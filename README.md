# Galaxy x Waevy Workflow

**Galaxy x Waevy Workflow** is a Weavy clone: a visual AI workflow builder for creating pipelines with text, image, video, LLM, crop, and frame-extraction nodes. Workflows run on a React Flow canvas, execute via Trigger.dev, and persist in PostgreSQL.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)[![Bun](https://img.shields.io/badge/Bun-000?logo=bun&logoColor=fff)](#)![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)[![GitHub](https://img.shields.io/badge/GitHub-%23121011.svg?logo=github&logoColor=white)](#)[![Vercel](https://img.shields.io/badge/Vercel-%23000000.svg?logo=vercel&logoColor=white)](#)

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Tech Architecture & Data Flow](#tech-architecture--data-flow)
3. [How Data Is Fetched](#how-data-is-fetched)
4. [Near–Real-Time Execution Status](#near-real-time-execution-status)
5. [Auth (Clerk)](#auth-clerk)
6. [Trigger.dev](#triggerdev)
7. [TUS / Transloadit](#tus--transloadit)
8. [App Features](#app-features)
9. [Basic Usage Guide](#basic-usage-guide)
10. [Using the Template Section](#using-the-template-section)
11. [Suggested Betterments](#suggested-betterments)
12. [Local Setup & Commands](#local-setup--commands)
13. [Environment Variables](#environment-variables)
14. [Requirements Checklist (Weavy Clone)](#requirements-checklist-weavy-clone)

---

## Tech Stack

| Layer               | Technology                                                            |
| ------------------- | --------------------------------------------------------------------- |
| **Framework**       | Next.js 16 (App Router)                                               |
| **Language**        | TypeScript (strict mode)                                              |
| **UI**              | React 19, Tailwind CSS 4, Radix UI, shadcn/ui, Framer Motion          |
| **Canvas**          | React Flow (@xyflow/react)                                            |
| **Data & API**      | TanStack Query (React Query), fetch with credentials                  |
| **Validation**      | Zod (API body/query, env, workflow export/import)                     |
| **Database**        | PostgreSQL, Prisma ORM                                                |
| **Auth**            | Clerk (middleware + API `auth()`)                                     |
| **Background jobs** | Trigger.dev (run-llm, crop-image, extract-video-frame)                |
| **Uploads**         | TUS (tus-js-client) + Transloadit (prepare → TUS → notify → complete) |
| **LLM / Vision**    | Google Gemini (Gemini 2.5 Flash / Pro)                                |
| **Package manager** | Bun                                                                   |

---

## Tech Architecture & Data Flow

### High-Level Flow

- **Frontend:** Next.js App Router pages and client components. Workflow canvas and sidebars live under `/workflow/[id]`. Dashboard (My Files) is `/`.
- **API:** Next.js Route Handlers under `/api/workflow-file/...`, `/api/webhooks/...`, etc. All workflow APIs use a shared `createApi()` factory with optional Zod body/query and `requireAuth`.
- **Auth:** Clerk protects non-public routes via middleware (`src/proxy.ts`). API routes that need a user call `auth()` and use `requireAuth: true` in `createApi`.
- **Database:** Prisma connects to PostgreSQL. Main entities: `user`, `workflow_file`, `workflow_node`, `workflow_edge`, `workflow_execution`, `node_execution`, `workflow_template`.
- **Execution:** Run node or run flow → API creates `workflow_execution` and `node_execution` rows → API triggers Trigger.dev task with `_executionMeta` (workflowId, nodeId, nodeExecutionId, workflowExecutionId, completionUrl). Task runs (Gemini / FFmpeg / etc.), then calls completion webhook with result. Webhook updates `node_execution`, and for full flows may trigger the next batch of nodes or mark the workflow execution complete.
- **Uploads:** Image/Video node → Prepare (Transloadit assembly + TUS URL) → Client uploads via TUS → Transloadit notifies our webhook → We update node config with preview/URL and optionally call upload-complete API.

### Data Flow Summary

1. **Workflow CRUD:** UI → API (Zod-validated) → Prisma → DB. React Query invalidates list/detail keys after mutations.
2. **Execution:** UI → Execute API → DB (create execution + node executions) → `tasks.trigger(taskId, payload)` → Trigger.dev runs task → Task POSTs to `/api/webhooks/execution-complete` with output/error → Webhook updates DB and, for full flow, may trigger more nodes or mark run complete.
3. **Uploads:** UI → Prepare API → Transloadit assembly + TUS URL → Client TUS upload → Transloadit webhook → Our notify route updates node → Optional complete API for UI state.

---

## How Data Is Fetched

- **Client:** TanStack Query (`useQuery` / `useMutation`) in `src/services/client-api/`. Each resource (workflow files, nodes, edges, executions, templates) has a getter (and often a mutation) that calls the corresponding API route with `credentials: "include"`.
- **Keys:** Centralized in `src/config/client-constants.ts` (e.g. `API_ROUTES.WORKFLOW_FILE.GET.key`). Query keys are built from route key + params (e.g. `workflowId`, `executionId`, `query` for search).
- **Auth:** Queries that need a signed-in user use `useAuth()` from Clerk and set `enabled: isSignedIn && ...` so requests only run when authenticated.
- **No BFF layer:** The frontend talks directly to Next.js API routes; there is no separate backend server.

---

## Near–Real-Time Execution Status

- **Mechanism:** **Webhooks + polling**, no WebSockets.
    - **Trigger.dev** tasks, on completion, POST to `POST /api/webhooks/execution-complete` with `execution_id`, `execution_node_id`, `node_id`, `workflow_id`, `output`, `error`. The webhook updates `node_execution` and, when applicable, the `workflow_execution` and triggers the next nodes (full flow).
    - **UI:** When an execution is expanded in the right-sidebar "Execution history", `useGetWorkflowExecution` is called with `refetchInterval: 2000` (2s polling). That keeps the run detail (and node-level status) updating without WebSockets.
- **Result:** Status is "near–real-time": as soon as the task calls the webhook, the DB is updated; the UI reflects it on the next poll (or on manual refetch after a mutation like "Stop flow").

---

## Auth (Clerk)

- **Role:** Clerk is the only auth provider. It handles sign-in, sign-up, session, and user identity.
- **Middleware:** `src/proxy.ts` exports `proxy` (Clerk's `clerkMiddleware`). It uses `createRouteMatcher(PUBLIC_ROUTES)`; non-public routes call `auth.protect()`. Public routes include `/auth(.*)`, `/api/health(.*)`, `/api/webhooks(.*)`. You must wire this proxy as the root middleware (e.g. `middleware.ts` exporting it) so all non-public pages and API routes are protected.
- **API:** Workflow and file APIs use `createApi(..., requireAuth: true)`. The factory calls Clerk's `auth()` and attaches `user` (e.g. `userId`) to the handler. Workflow ownership is enforced via `assertWorkflowOwnership(workflowId, user.id)` using the DB `user` table linked by `clerk_id`.
- **DB sync:** Clerk user lifecycle is synced to the app's `user` table via the Clerk webhook (`/api/webhooks/clerk`): `user.created` / `user.updated` upsert a user by `clerk_id`, `user.deleted` deletes. The `db:sync` script can also sync existing Clerk users into the DB.

---

## Trigger.dev

- **Role:** All node executions (Run LLM, Crop Image, Extract Video Frame) run as Trigger.dev tasks so long-running or heavy work runs in the cloud, not in the Next.js process.
- **Tasks:**
    - `run-llm` — Gemini (vision-capable) with prompt/images.
    - `crop-image` — FFmpeg crop.
    - `extract-video-frame` — FFmpeg frame extraction.
      Each task receives a payload plus `_executionMeta` (workflowId, nodeId, nodeExecutionId, workflowExecutionId, completionUrl). On success/failure, the task calls `notifyExecutionComplete(meta, output, error)` which POSTs to the completion webhook with a fixed `x-complete-key` header.
- **Flow:** Execute API creates DB execution records, then `tasks.trigger(taskId, payload)`. No polling of Trigger.dev in the app; state is updated only when the webhook is hit. The UI then refreshes execution state via the 2s polling when a run is expanded.

---

## TUS / Transloadit

- **Role:** Image and video uploads use **TUS** (resumable uploads) and **Transloadit** for processing and storage. The app does not store file bytes itself; Transloadit returns public URLs that we store in node config.
- **Flow:**
    1. **Prepare:** Client calls `POST .../nodes/[nodeId]/upload/prepare` with `{ type: "image" | "video" }`. Server creates a Transloadit assembly (with template ID for image or video), returns `assembly_id`, `assembly_ssl_url`, `tus_url`.
    2. **Upload:** Client uses `tus-js-client` to upload the file to `tus_url`.
    3. **Notify:** Transloadit runs the template and POSTs to our `/api/transloadit/notify` (with `workflow_id`, `node_id` in query). We verify the HMAC signature, parse the assembly result, get the public URL, and update the workflow node's config (e.g. `previewUrl`, `url`).
    4. **Complete:** Client may call `POST .../nodes/[nodeId]/upload/complete` with `assembly_ssl_url` to confirm and refresh UI state.
- **Security:** Notify route validates the Transloadit signature using `TRANSLOADIT_SECRET_KEY`.

---

## App Features

- **Dashboard (My Files):** List of workflow files, search, create new file, rename (context menu), delete (context menu). Prebuilt workflows section with "Workflow library" and "Tutorials" tabs; using a template creates a new file from its JSON and redirects to that workflow.
- **Desktop-only gate:** On viewports below the desktop breakpoint, a full-screen gate is shown (logo, "Your masterpiece needs a bigger canvas", copy link). The app is intended for desktop use.
- **Workflow canvas:** React Flow with dot grid; left sidebar with node types (Text, Upload Image, Upload Video, LLM, Crop Image, Extract Frame); right sidebar with Run node / Run flow / Stop flow and execution history. Nodes show a pulsating glow when that node is running.
- **Nodes:** Text (textarea + value handle), Image Upload (Transloadit + preview), Video Upload (Transloadit + player), Run LLM (model selector, prompts, temperature, image inputs), Crop Image (FFmpeg via Trigger), Extract Frame (FFmpeg via Trigger). Edges are animated (purple).
- **Execution:** Run selected node or run full flow. Executions appear in the right panel; expanding a run shows node-level history (status, output preview: image/video/LLM with "Know more" for full content). Stop-flow button per running run to force-stop that execution.
- **Persistence:** Workflows (nodes, edges, positions, config) and execution history are stored in PostgreSQL. Config and position are saved on blur / on change (e.g. model selector) for the current workflow.
- **Export / Import:** Export workflow as JSON (version, name, nodes, edges). Import creates a new workflow from that JSON (used also when using a template).
- **Templates:** Prebuilt workflow templates (name + JSON) stored in `workflow_template`. Dashboard shows templates; using one imports its JSON into a new file and redirects to it. A seeded "Social Media Flow" template demonstrates a full dummy flow; you can add more via the template API or the seed script.

---

## Basic Usage Guide

1. **Sign in:** Use Clerk sign-in/sign-up. After auth you land on the dashboard (My Files).
2. **Create workflow:** Click "Create New File" or use a prebuilt template from "Workflow library." You are taken to `/workflow/[id]`.
3. **Build graph:** Drag nodes from the left sidebar onto the canvas. Connect output handles to input handles (only valid connections are allowed). Configure each node (text, model, crop region, etc.).
4. **Run:** Select a node and click "Run node" to run only that node, or click "Run flow" to run the full DAG. Watch the right sidebar for run list and expand a run to see per-node status and output.
5. **Stop:** While a run is in progress, use the stop (square) icon on that run in the execution accordion to force-stop it.
6. **Export / Import:** Use the sidebar (or menu) to export the current workflow as JSON or import from a file.
7. **Rename / Delete:** On the dashboard, right-click a file card to Rename or Delete. Inside a workflow, use the sidebar menu to rename the file.

---

## Using the Template Section

- **Where:** On the main dashboard (My Files), the "Prebuilt workflows" block at the top shows a "Workflow library" tab with template cards.
- **How to use:** Click a template card. The app creates a new workflow file, imports the template's JSON (nodes + edges) into it, and redirects you to `/workflow/[newFileId]`. A loading toast is shown during create → import → redirect.
- **Seeded template:** The repo includes a seed script that inserts a "Social Media Flow" template (a full dummy flow with image upload, crop, text, LLM, video upload, extract frame, and a second LLM). Run:
  `bun run src/cmd/seed-social-media-flow-template.ts`
  (after DB is set up) to seed it. That template can be used to demo the entire pipeline and how to use the template section.
- **Adding templates:** Use the workflow template API (POST with name + JSON conforming to the workflow export schema) or run custom seed scripts. Template JSON must match the export format (version, name, nodes array, edges array).

---

## Suggested Betterments

- **Library page:** A dedicated "Library" or "Templates" page with categories, search, and richer template cards (e.g. thumbnails, descriptions).
- **Public template registries:** Support for external or community template feeds (e.g. JSON URLs or a registry API) so users can browse and import templates from a central catalog.
- **More intuitive visualizer:** Improved execution visualizer: e.g. highlight the path of the current run on the canvas, show which node is running next, or a timeline view of node start/end times.

---

## Local Setup & Commands

### Prerequisites

- Node 18+ (or Bun)
- PostgreSQL (local or hosted, e.g. Supabase)
- Accounts: Clerk, Trigger.dev, Transloadit, Google AI (Gemini)

### Setup

1. **Clone and install**

    ```bash
    cd galaxy-workflow
    bun install
    ```

2. **Environment**
    - Copy `.env.example` to `.env` and fill every variable (see [Environment Variables](#environment-variables)).
    - Ensure `HOST` and `NEXT_PUBLIC_HOST` are set (e.g. `http://localhost:3000` for dev). The execution-complete webhook is called by Trigger.dev at `HOST`; use a tunnel (e.g. ngrok) if Trigger runs in the cloud and must reach localhost.

3. **Database**

    ```bash
    bun run db:push
    bun run db:generate
    ```

    Optionally seed users from Clerk: `bun run db:sync`.
    Optionally seed the Social Media Flow template: `bun run src/cmd/seed-social-media-flow-template.ts`.

4. **Trigger.dev**
    - Link the project: `bunx trigger dev` (or use the `dev:trigger` script) and follow prompts.
    - For local task execution, run `bun run dev:trigger` in a separate terminal so tasks run against your app's webhook.

5. **Clerk**
    - Configure sign-in/sign-up URLs and webhook URL (e.g. `https://your-host/api/webhooks/clerk`) in the Clerk dashboard. Add the webhook signing secret to `.env`.

6. **Middleware (Clerk protection)**
   The app defines Clerk middleware in `src/proxy.ts`. Ensure your project has a root `middleware.ts` (or `src/middleware.ts`) that exports this middleware so non-public routes require sign-in (e.g. `export { proxy as default } from "@/proxy";` or equivalent).

7. **Run the app**
    ```bash
    bun run dev
    ```
    Open the URL (e.g. `http://localhost:3000`).

### Package Scripts (package.json)

| Command                  | Description                                                   |
| ------------------------ | ------------------------------------------------------------- |
| `bun run dev`            | Start Next.js dev server                                      |
| `bun run build`          | db:push → db:generate → deploy:trigger → db:sync → next build |
| `bun run start`          | Start Next.js production server                               |
| `bun run lint`           | Run ESLint                                                    |
| `bun run test`           | Run Vitest once                                               |
| `bun run test:watch`     | Run Vitest in watch mode                                      |
| `bun run db:generate`    | Prisma generate client                                        |
| `bun run db:push`        | Prisma db push (schema → DB, accept data loss)                |
| `bun run db:push-dev`    | Prisma db push (no --accept-data-loss)                        |
| `bun run db:migrate`     | Prisma migrate dev                                            |
| `bun run db:studio`      | Open Prisma Studio                                            |
| `bun run db:sync`        | Sync Clerk users into DB (`bun src/cmd/sync-users.ts`)        |
| `bun run dev:trigger`    | Run Trigger.dev dev server                                    |
| `bun run deploy:trigger` | Deploy Trigger.dev tasks                                      |
| `bun run dev:tunnel`     | Run dev tunnel script (e.g. for webhooks)                     |
| `bun run setup-dev`      | Run setup script (`bun src/cmd/setup-dev.ts`)                 |
| `bun run prepare`        | Husky install (pre-commit hooks)                              |

---

## Environment Variables

See `.env.example` for the full list. Summary:

- **Database:** `DATABASE_URL`, `DIRECT_URL`
- **App:** `ENV`, `HOST` (used for webhook callback URL)
- **Clerk:** `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- **Trigger.dev:** `TRIGGER_SECRET_KEY`, `TRIGGER_PROJECT_REF`
- **Transloadit:** `TRANSLOADIT_PUBLIC_KEY`, `TRANSLOADIT_SECRET_KEY`, `TRANSLOADIT_IMAGE_TEMPLATE_ID`, `TRANSLOADIT_VIDEO_TEMPLATE_ID`
- **Gemini:** `GEMINI_API_KEY`
- **Public:** `NEXT_PUBLIC_HOST`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

---

## Requirements Checklist (Weavy Clone)

This checklist mirrors the "Required" list for the Weavy clone. **Please confirm which items your build covers** (and note any gaps):

- [ ] **Pixel-perfect Weavy clone UI (exact spacing/colors)** — Subject to perspective.
- [x] **Clerk authentication with protected routes** — Clerk middleware + API `requireAuth`; public routes for auth and webhooks.
- [x] **Left sidebar with 6 buttons (Text, Upload Image, Upload Video, LLM, Crop Image, Extract Frame)** — Implemented as draggable node types.
- [x] **Right sidebar with workflow history panel** — Execution history accordion with run list and node-level detail.
- [x] **Node-level execution history when clicking a run** — Expanding a run shows each node's status and output preview.
- [x] **React Flow canvas with dot grid background** — Canvas uses React Flow and dot grid.
- [x] **Functional Text Node with textarea and output handle** — Value handle, config persisted.
- [x] **Functional Upload Image Node with Transloadit upload and image preview** — Prepare → TUS → Transloadit notify → preview.
- [x] **Functional Upload Video Node with Transloadit upload and video player preview** — Same flow; video preview and URL.
- [x] **Functional LLM Node with model selector, prompts, and run capability** — Gemini; model selector (e.g. 2.5 Flash/Pro), system/user prompts, run.
- [x] **Functional Crop Image Node (FFmpeg via Trigger.dev)** — Trigger task, FFmpeg crop.
- [x] **Functional Extract Frame from Video Node (FFmpeg via Trigger.dev)** — Trigger task, FFmpeg frame extraction.
- [x] **All node executions via Trigger.dev tasks** — run-llm, crop-image, extract-video-frame run as Trigger tasks.
- [x] **Pulsating glow effect on nodes during execution** — Status-driven styling on nodes when running.
- [x] **Pre-built sample workflow (demonstrates all features)** — e.g. "Social Media Flow" template; seed script provided.
- [x] **Node connections with animated purple edges** — React Flow edges with animation.
- [x] **API routes with Zod validation** — Body/query validated with Zod in `createApi`.
- [x] **Google Gemini integration with vision support** — Run LLM task uses Gemini with image inputs.
- [x] **TypeScript throughout with strict mode** — TypeScript strict in the project.
- [x] **PostgreSQL database with Prisma ORM** — Prisma + PostgreSQL.
- [x] **Workflow save/load to database** — Workflow files, nodes, edges persisted; load on open.
- [x] **Workflow history persistence to database** — `workflow_execution` and `node_execution` stored.
- [x] **Workflow export/import as JSON** — Export/import routes and UI; template use imports JSON into a new file.
- [x] **Deployed on Vercel with environment variables** — Intended for Vercel; all config via env.

**If any item is not covered in your build,** tick/untick as needed and add a short note (e.g. "partial", "different approach", or "not implemented") in your copy of this checklist.

---

### Summary

This app is a **Weavy clone** (not Krea), built for Galaxy AI. The checklist and behavior are aligned to the Weavy reference. All items above are implemented in the codebase.
