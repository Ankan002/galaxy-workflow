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
7. [File storage (AWS S3)](#file-storage-aws-s3)
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
| **Background jobs** | Trigger.dev (workflow-orchestrator, run-llm, crop-image, extract-video-frame) |
| **Uploads**         | AWS S3 via presigned PUT URLs (presign → direct PUT → confirm) |
| **LLM / Vision**    | Google Gemini (Gemini 2.5 Flash / Pro)                                |
| **Package manager** | Bun                                                                   |

---

## Tech Architecture & Data Flow

### High-Level Flow

- **Frontend:** Next.js App Router pages and client components. Workflow canvas and sidebars live under `/workflow/[id]`. Dashboard (My Files) is `/`.
- **API:** Next.js Route Handlers under `/api/workflow-file/...`, `/api/webhooks/...`, etc. All workflow APIs use a shared `createApi()` factory with optional Zod body/query and `requireAuth`.
- **Auth:** Clerk protects non-public routes via middleware (`src/proxy.ts`). API routes that need a user call `auth()` and use `requireAuth: true` in `createApi`.
- **Database:** Prisma connects to PostgreSQL. Main entities: `user`, `workflow_file`, `workflow_node`, `workflow_edge`, `workflow_execution`, `node_execution`, `workflow_template`.
- **Execution:**  
  - **Full flow:** User clicks "Run flow" → API creates `workflow_execution` (type `full`) and source `node_execution` rows (text, image_upload, video_upload) → API triggers a single Trigger.dev task **workflow-orchestrator** with `{ workflowId, workflowExecutionId }`. The orchestrator runs entirely on Trigger: it loads nodes/edges from the DB (Prisma), repeatedly computes ready nodes, resolves inputs from predecessor outputs, creates `node_execution` rows, and calls **batch.triggerAndWait** for each wave (crop-image, run-llm, extract-video-frame). Child tasks are invoked **without** `completionUrl`, so they do not POST to the webhook; the orchestrator gets results from `batch.triggerAndWait` and updates `node_execution` (output/error) via Prisma. When no more ready nodes remain, the orchestrator updates `workflow_execution` (status, result, error). Orchestration thus lives inside Trigger (durability, dashboard visibility, native retry).  
  - **Single-node run:** User runs one node → API creates `workflow_execution` (type `one_node`) and `node_execution` → API triggers the corresponding Trigger task with `_executionMeta` including `completionUrl`. The task runs, then calls `notifyExecutionComplete`, which POSTs to `/api/webhooks/execution-complete`. The webhook updates `node_execution` and `workflow_execution`.
- **Uploads:** Gallery or Image/Video node → Presign API (`/api/gallery/upload-url`) → Client `PUT`s directly to S3 → Confirm API (`/api/gallery`) creates the `gallery_item` → node config gets the public URL.

### Data Flow Summary

1. **Workflow CRUD:** UI → API (Zod-validated) → Prisma → DB. React Query invalidates list/detail keys after mutations.
2. **Execution:**  
   - **Full flow:** UI → `POST /api/workflow-file/:workflowId/execute-flow` → DB (create `workflow_execution` + source `node_execution` rows) → `tasks.trigger("workflow-orchestrator", { workflowId, workflowExecutionId })` → Orchestrator loads DAG, `batch.triggerAndWait`(initial ready nodes) → updates DB from results. Each child task, on completion, calls `tasks.trigger("process-node-completion", ...)` → process-node-completion updates node, loops: get ready → `batch.triggerAndWait` → update DB until no more ready → updates `workflow_execution` when all terminal. Event-driven; no webhook for full flow.  
   - **Single-node:** UI → Execute node API → DB (create `workflow_execution` + `node_execution`) → `tasks.trigger(taskId, payload)` with `completionUrl` → Task runs → Task POSTs to `/api/webhooks/execution-complete` → Webhook updates `node_execution` and `workflow_execution`.
3. **Uploads:** UI → Presign API → presigned S3 PUT URL → client uploads directly to S3 → Confirm API creates the `gallery_item` and the node/gallery shows the public URL.

---

## How Data Is Fetched

- **Client:** TanStack Query (`useQuery` / `useMutation`) in `src/services/client-api/`. Each resource (workflow files, nodes, edges, executions, templates) has a getter (and often a mutation) that calls the corresponding API route with `credentials: "include"`.
- **Keys:** Centralized in `src/config/client-constants.ts` (e.g. `API_ROUTES.WORKFLOW_FILE.GET.key`). Query keys are built from route key + params (e.g. `workflowId`, `executionId`, `query` for search).
- **Auth:** Queries that need a signed-in user use `useAuth()` from Clerk and set `enabled: isSignedIn && ...` so requests only run when authenticated.
- **No BFF layer:** The frontend talks directly to Next.js API routes; there is no separate backend server.

---

## Near–Real-Time Execution Status

- **Mechanism:** **Orchestrator + process-node-completion + webhooks (single-node) + polling**; no WebSockets.
    - **Full flow:** The **workflow-orchestrator** runs `batch.triggerAndWait`(initial batch) and updates DB from results. Each child task, on completion, triggers **process-node-completion**, which updates the node and runs `batch.triggerAndWait` in a loop for downstream nodes until none remain. Both orchestrator and process-node-completion write to the DB. Child tasks do **not** call the webhook when run from the orchestrator (no `completionUrl` in `_executionMeta`).
    - **Single-node run:** The triggered task, on completion, POSTs to `POST /api/webhooks/execution-complete` with `execution_id`, `execution_node_id`, `node_id`, `workflow_id`, `output`, `error`. The webhook updates `node_execution` and `workflow_execution`.
    - **UI:** When an execution is expanded in the right-sidebar "Execution history", `useGetWorkflowExecution` is called with `refetchInterval: 2000` (2s polling). That keeps the run detail (and node-level status) updating without WebSockets.
- **Result:** Status is "near–real-time": for full flow, the DB is updated by the orchestrator after each wave; for single-node, as soon as the task calls the webhook, the DB is updated. The UI reflects changes on the next poll (or on manual refetch after a mutation like "Stop flow").

---

## Auth (Clerk)

- **Role:** Clerk is the only auth provider. It handles sign-in, sign-up, session, and user identity.
- **Middleware:** `src/proxy.ts` exports `proxy` (Clerk's `clerkMiddleware`). It uses `createRouteMatcher(PUBLIC_ROUTES)`; non-public routes call `auth.protect()`. Public routes include `/auth(.*)`, `/api/health(.*)`, `/api/webhooks(.*)`. You must wire this proxy as the root middleware (e.g. `middleware.ts` exporting it) so all non-public pages and API routes are protected.
- **API:** Workflow and file APIs use `createApi(..., requireAuth: true)`. The factory calls Clerk's `auth()` and attaches `user` (e.g. `userId`) to the handler. Workflow ownership is enforced via `assertWorkflowOwnership(workflowId, user.id)` using the DB `user` table linked by `clerk_id`.
- **DB sync:** Clerk user lifecycle is synced to the app's `user` table via the Clerk webhook (`/api/webhooks/clerk`): `user.created` / `user.updated` upsert a user by `clerk_id`, `user.deleted` deletes. The `db:sync` script can also sync existing Clerk users into the DB.

---

## Trigger.dev

- **Role:** All node executions (Run LLM, Crop Image, Extract Video Frame) run as Trigger.dev tasks so long-running or heavy work runs in the cloud, not in the Next.js process. **Full-flow orchestration** also runs on Trigger via a single **workflow-orchestrator** task that uses **batch.triggerAndWait** to drive the DAG.
- **Tasks:**
    - **`workflow-orchestrator`** — Full-flow only. Payload: `{ workflowId, workflowExecutionId }`. Loads nodes/edges from the DB (Prisma in the task), then loops: (1) compute ready node ids (predecessors completed, no execution yet), (2) for each ready node resolve inputs from predecessor outputs and create `node_execution`, (3) call **batch.triggerAndWait** with crop-image, run-llm, extract-video-frame payloads (with `_executionMeta` **without** `completionUrl`), (4) update each `node_execution` from the batch results, (5) repeat until no ready nodes remain, then update `workflow_execution` (status, result, error). Ensures durability (checkpointing while waiting), full visibility in the Trigger dashboard, and native retry at the orchestration layer.
    - **`run-llm`** — Gemini (vision-capable) with prompt/images.
    - **`crop-image`** — FFmpeg crop.
    - **`extract-video-frame`** — FFmpeg frame extraction.  
      Each of these receives a payload plus optional `_executionMeta` (workflowId, nodeId, nodeExecutionId, workflowExecutionId, **completionUrl**). They call `notifyExecutionComplete(meta, output, error)` **only when** `meta.completionUrl` is set (single-node or legacy path); when run from the orchestrator, `completionUrl` is omitted so they do not POST to the webhook—the orchestrator gets the result from `batch.triggerAndWait` and writes to the DB.
- **Flow:**  
  - **Full flow:** Execute API creates `workflow_execution` and source `node_execution` rows, then `tasks.trigger("workflow-orchestrator", { workflowId, workflowExecutionId })`. The orchestrator runs on Trigger and updates all execution state via Prisma; the app does not poll Trigger. The UI refreshes execution state via 2s polling when a run is expanded.  
  - **Single-node:** Execute API creates execution records, then `tasks.trigger(taskId, payload)` with `completionUrl`. The task runs and POSTs to the completion webhook; the webhook updates the DB. UI polling is unchanged.
- **Config:** The orchestrator uses Prisma in the task (see `trigger.config.ts`: `prismaExtension({ mode: "modern" })`). Ensure **DATABASE_URL** is set in your Trigger.dev project environment so the orchestrator can connect to the same PostgreSQL database as the Next.js app.

---

## File storage (AWS S3)

- **Role:** All files (uploads and generated outputs) live in **AWS S3**. The bucket is **public-read**, so each object has a permanent URL we store in `gallery_item.url` and node config. Object keys follow `<user_id>/<random_id>-<cuid>.<ext>` (user id = internal ulid).
- **Upload flow (browser):**
    1. **Presign:** Client calls `POST /api/gallery/upload-url` with `{ name, contentType, size }`. Server resolves the internal user id, builds the key, and returns a presigned **PUT** URL plus the final public `url`/`key`.
    2. **Upload:** Client `PUT`s the file straight to S3 (progress via `XMLHttpRequest`).
    3. **Confirm:** Client calls `POST /api/gallery` with `{ name, key, contentType, size }`; server validates the key prefix and creates the `gallery_item` row.
- **Gallery:** `GET /api/gallery?cursor=&query=&type=` is cursor-paginated (`useInfiniteQuery`); `DELETE /api/gallery/:id` removes the S3 object and the row (ownership-checked).
- **Node file picker:** Image/Video upload nodes open a picker dialog to browse existing gallery items or upload a new one; the chosen item's public URL is written to node config (`previewUrl`/`url`).
- **Generated outputs:** The `crop-image` and `extract-video-frame` Trigger.dev tasks upload their FFmpeg output to S3 and create a `gallery_item` for the workflow owner, so processed assets also appear in the gallery.
- **Util:** `serverUtilsRegistry.s3` (`src/utils/server/s3.ts`) wraps the runtime-agnostic helpers in `src/lib/s3/` used by both the Next server and Trigger.dev tasks.

---

## App Features

- **Dashboard (My Files):** List of workflow files, search, create new file, rename (context menu), delete (context menu). Prebuilt workflows section with "Workflow library" and "Tutorials" tabs; using a template creates a new file from its JSON and redirects to that workflow.
- **Desktop-only gate:** On viewports below the desktop breakpoint, a full-screen gate is shown (logo, "Your masterpiece needs a bigger canvas", copy link). The app is intended for desktop use.
- **Workflow canvas:** React Flow with dot grid; left sidebar with node types (Text, Upload Image, Upload Video, LLM, Crop Image, Extract Frame); right sidebar with Run node / Run flow / Stop flow and execution history. Nodes show a pulsating glow when that node is running.
- **Nodes:** Text (textarea + value handle), Image Upload (gallery picker / S3 + preview), Video Upload (gallery picker / S3 + player), Run LLM (model selector, prompts, temperature, image inputs), Crop Image (FFmpeg via Trigger), Extract Frame (FFmpeg via Trigger). Edges are animated (purple).
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
- Accounts: Clerk, Trigger.dev, AWS (S3 bucket), Google AI (Gemini)

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
- **Trigger.dev:** `TRIGGER_SECRET_KEY`, `TRIGGER_PROJECT_REF`. For the workflow-orchestrator and crop/extract tasks, set **DATABASE_URL** and the **AWS_\*** vars in the Trigger.dev project environment (same DB + bucket as the app), since those tasks upload outputs to S3.
- **AWS S3:** `AWS_BUCKET_NAME`, `AWS_BUCKET_REGION`, `AWS_KEY_ID`, `AWS_KEY_SECRET` (bucket must be public-read via bucket policy)
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
- [x] **Functional Upload Image Node with S3 upload and image preview** — Gallery picker / presigned S3 upload → preview.
- [x] **Functional Upload Video Node with S3 upload and video player preview** — Same flow; video preview and URL.
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
