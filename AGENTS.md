# AGENTS.md — Galaxy Workflow

Guidance for AI agents and contributors implementing features in this codebase. Read this before making changes.

## Project overview

**Galaxy x Waevy Workflow** is a visual AI workflow builder (Weavy clone). Users build node graphs on a React Flow canvas; workflows persist in PostgreSQL and execute via Trigger.dev (LLM, FFmpeg crop/frame extraction). Auth is Clerk; uploads use TUS + Transloadit.

For architecture, data flow, and setup, see [README.md](./README.md).

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Runtime / PM | **Bun** (always use `bun`, never npm/yarn/pnpm) |
| UI | React 19, Tailwind CSS 4, Radix / shadcn/ui (new-york), Framer Motion |
| Canvas | @xyflow/react |
| Data fetching | TanStack Query (client) → Next.js Route Handlers (server) |
| Validation | Zod (API bodies/queries, env, workflow import/export) |
| Database | PostgreSQL + Prisma ORM |
| Auth | Clerk (`src/proxy.ts` middleware + API `requireAuth`) |
| Background jobs | Trigger.dev v4 (`src/trigger/`) |
| State | Zustand (canvas cross-cutting callbacks), React Query (server state) |
| Toasts | sonner |

---

## Directory structure

```
galaxy-workflow/
├── prisma/schema.prisma          # DB schema; client output → src/db/prisma/
├── trigger.config.ts               # Trigger.dev config (Bun runtime, FFmpeg, Prisma)
├── src/
│   ├── app/                        # App Router: thin pages + API route handlers
│   │   ├── api/                    # REST endpoints (workflow-file, webhooks, transloadit, …)
│   │   ├── auth/                   # Clerk sign-in / sign-up pages
│   │   ├── workflow/[id]/          # Workflow editor page
│   │   ├── layout.tsx              # Root providers (auth, query, theme, sidebar, desktop gate)
│   │   └── page.tsx                # Dashboard (My Files)
│   ├── screens/                    # Feature screens: UI + colocated hooks
│   ├── components/                 # Shared UI
│   │   ├── ui/                     # shadcn components (barrel: index.ts)
│   │   ├── canvas/                 # React Flow canvas, node registry, sidebars
│   │   ├── common/                 # App sidebar, sidebar user
│   │   ├── providers/              # Auth, Query, Theme, Dashboard, Motion
│   │   ├── elements/               # DesktopOnlyGate, icons
│   │   └── brand/                  # Logos
│   ├── services/client-api/        # TanStack Query hooks + fetch helpers per domain
│   ├── db/
│   │   ├── client.ts               # Singleton Prisma client (Pg adapter)
│   │   ├── actions/                # Prisma data-access functions (*.action.ts)
│   │   └── prisma/                 # Generated client (do not hand-edit)
│   ├── trigger/                    # Trigger.dev tasks
│   ├── lib/                        # Domain logic (execution, workflow-export, utils)
│   ├── utils/
│   │   ├── server/                 # createApi, logger, clerk, tus, … (serverUtilsRegistry)
│   │   └── client/                 # error mapper, query client, UI helpers (clientUtils)
│   ├── config/                     # Env (server-env, client-env) + constants
│   ├── types/                      # Shared TS types (api, errors, common)
│   ├── store/                      # Zustand stores
│   ├── hooks/                      # Shared React hooks
│   ├── cmd/                        # One-off CLI scripts (seed, sync, setup)
│   └── proxy.ts                    # Clerk middleware (export as root middleware)
├── .cursor/rules/                  # Cursor-specific rules (Bun, Trigger.dev)
└── test/                           # Vitest tests
```

**Path alias:** `@/*` → `./src/*` (see `tsconfig.json`).

---

## Layering rules (follow strictly)

### 1. App Router pages — thin entrypoints

Pages in `src/app/` should only wire route params and render a screen. No business logic.

```tsx
// src/app/workflow/[id]/page.tsx
import { WorkflowScreen } from "@/screens/workflow";

export default async function WorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkflowScreen workflowId={id} />;
}
```

### 2. Screens — UI + colocated hooks

Each feature lives under `src/screens/<feature>/`:

| File | Role |
| --- | --- |
| `<feature>-screen.tsx` or `screen.tsx` | Presentational component (`"use client"`) |
| `hook.ts` | Data fetching, mutations, local UI state, handlers |
| `index.ts` | Barrel export of the screen |
| `components/` | Screen-specific subcomponents |

Screens import from `@/components/ui`, `@/services/client-api`, `@/hooks`, and `@/store`. They do **not** call Prisma or Trigger directly.

### 3. API routes — `createApi` factory

All workflow APIs use `createApi` from `serverUtilsRegistry`:

```ts
import { serverUtilsRegistry } from "@/utils/server";
import { assertWorkflowOwnership } from "@/utils/server/workflow-validators";

const { createApi, sendJsonApiResponse } = serverUtilsRegistry;

export const POST = createApi<BodySchema, QuerySchema, true>({
  requireAuth: true,
  bodySchema: myBodySchema,   // optional Zod schema
  querySchema: myQuerySchema, // optional Zod schema
  execute: async ({ body, query, user, params }) => {
    await assertWorkflowOwnership(params!.workflowId!, user.id);
    // … call db/actions, trigger tasks …
    return sendJsonApiResponse({ code: 200, success: true, data: { … } });
  },
});
```

Rules:

- Set `requireAuth: true` for user-scoped workflow APIs.
- Validate input with Zod; throw `ApiError` or return `sendJsonApiResponse` for domain errors.
- Call **`assertWorkflowOwnership(workflowId, clerkUserId)`** before mutating workflow data.
- Use **`validateNodeConnection`** when creating edges.
- Keep route handlers thin: delegate to `src/db/actions/` and `src/lib/execution/`.
- Responses use the **`JsonApiResponse<T>`** shape (`success`, `code`, `data` | `error`).

### 4. Database — `src/db/actions/*.action.ts`

- One file per aggregate (`workflow-file.action.ts`, `workflow-node.action.ts`, …).
- Export plain async functions that use the shared `prisma` client from `@/db/client`.
- Use Prisma enums/types from `@/db/prisma/client`.
- Do **not** import Prisma in client components. On the client, use types from `@/db/prisma/browser` when needed.

After schema changes:

```bash
bun run db:push      # or db:migrate in production workflows
bun run db:generate
```

### 5. Client API — TanStack Query in `src/services/client-api/`

Structure per domain (mirror API resources):

```
services/client-api/workflow-file/
├── create-workflow-file.ts   # fetch fn + useCreateWorkflowFile hook
├── get-workflow-files.ts
├── index.ts                  # re-exports all
```

Conventions:

- Register routes in `src/config/client-constants.ts` (`API_ROUTES`) — path, method, and **query key**.
- Query keys: `[API_ROUTES.*.key, …params]` (e.g. workflowId, search query).
- Use `useAuth()` and `enabled: isSignedIn` for authenticated queries.
- Parse responses as `JsonApiResponse<T>`; throw `Error` on failure (handled by `useAPIErrorHandler`).
- Mutations use `mutationKey: [API_ROUTES.*.key]`.
- Invalidate or optimistically update query cache in screen hooks after mutations.

### 6. Trigger.dev tasks — `src/trigger/`

- Use **`@trigger.dev/sdk` v4** (`task`, `batch`, `logger`) — never deprecated `client.defineJob`.
- Task files export `task({ id: "kebab-case-id", run: async (payload) => … })`.
- Shared orchestration logic lives in `orchestrator-shared.ts`.
- **Full flow:** `workflow-orchestrator` uses `batch.triggerAndWait`; child tasks omit `completionUrl`.
- **Single-node:** API triggers task with `_executionMeta`; completion goes through `process-node-completion` or webhook path.
- Tasks that need DB create their own `PrismaClient` with `PrismaPg` adapter (see `workflow-orchestrator.ts`).
- Config: `trigger.config.ts` — `runtime: "bun"`, `dirs: ["./src/trigger"]`, FFmpeg + Prisma extensions.

Deploy / dev:

```bash
bun run dev:trigger
bun run deploy:trigger
```

See `.cursor/rules/trigger.*.mdc` for Trigger.dev patterns.

### 7. Canvas & nodes — `src/components/canvas/`

- **NODE_REGISTRY** maps `NodeType` → definition + React component.
- New node types: extend enum in `nodes/registry/types.ts`, add component in `nodes/library/`, register in `nodes/registry/index.ts`.
- Node config lives in `node.data.config`; persist via API on blur/change.
- Interactive controls inside nodes use `nodrag nopan` so they don't steal canvas drag.
- Full guide: [src/components/canvas/README.md](./src/components/canvas/README.md).

---

## Code style & formatting

| Rule | Value |
| --- | --- |
| Prettier | Tabs, tab width 4 (`.prettierrc`) |
| File names | kebab-case (`workflow-file-card.tsx`) |
| Components | PascalCase |
| Hooks | `use*` prefix; screen hooks named `useMyFiles`, `useWorkflowFile`, etc. |
| DB actions | `*.action.ts`, named exports (`createWorkflowFile`, …) |
| Imports | `@/` alias; group external → internal |
| UI components | Import from `@/components/ui` barrel, not deep paths |
| Class merging | `cn()` from `@/lib/utils` |
| Client-only | `"use client"` at top of client components/hooks |

TypeScript: **strict mode** — avoid `any`; prefer Prisma/Zod inferred types.

---

## Environment & config

- **Server env:** `src/config/server-env.ts` via `@t3-oss/env-nextjs` + Zod. Access as `serverEnv.VAR_NAME`.
- **Client env:** `src/config/client-env.ts` (only `NEXT_PUBLIC_*`).
- **Never** read undeclared env vars; add new vars to the appropriate env file and `.env.example`.
- **Constants:** client routes/keys in `client-constants.ts`; server-only (public routes, node connection rules) in `server-constants.ts`.

---

## Auth & security

- Clerk middleware: `src/proxy.ts` — protect all routes except `PUBLIC_ROUTES` in `server-constants.ts`.
- Ensure root `middleware.ts` re-exports the proxy (see README).
- Workflow APIs: always `requireAuth: true` + `assertWorkflowOwnership`.
- Webhooks (`/api/webhooks/*`, `/api/transloadit/notify`): verify signatures; keep in `PUBLIC_ROUTES`.
- Do not commit secrets (`.env`, keys). Warn if asked to commit them.

---

## Execution model (when touching runs)

| Mode | Entry | Orchestration | UI refresh |
| --- | --- | --- | --- |
| Full flow | `POST …/execute-flow` | `workflow-orchestrator` + `process-node-completion` | Poll `useGetWorkflowExecution` every 2s when expanded |
| Single node | `POST …/nodes/:id/execute` | Direct task trigger + completion handler | Same polling |

Source nodes (`text`, `image_upload`, `video_upload`) are not individually executable. Processing nodes resolve inputs from predecessors or config.

---

## UI patterns

- **Providers** in root layout: Auth → Theme → Query → Sidebar → DesktopOnlyGate.
- **Dashboard layout:** `DashboardProvider` wraps list screens with heading + action button.
- **Desktop-only:** `DesktopOnlyGate` blocks sub-desktop viewports; design for desktop.
- **Feedback:** `toast` from sonner for success/error; `useAPIErrorHandler()` in screen hooks.
- **Debouncing:** `DEBOUNCE_TIME` (500ms) from `client-constants.ts`; `use-debounce` for search.
- **Theming:** `next-themes` (`.dark` class) + CSS variables in `globals.css`. See the design system below.

---

## UI / Design system — **aakriti** (warm-monochrome · mild-brutalist)

The app is branded **aakriti** (आकृति, "form/shape"): a warm, Indian-art-inspired system that
reads as **near-minimalist editorial with quiet brutalist structure** — hairline borders,
flat surfaces, ink as the action color, and marigold reserved for a rare accent. Source of
truth for tokens is `src/app/globals.css`. **Use the semantic / `--ak-*` / `--data-*` tokens
— never invent or hardcode hex.**

**Signature look**

- **Color:** warm-monochrome. Ink `#1A1714` text + **ink/charcoal `--primary` CTA** (light surface in dark) · paper `#FAF6EE` ground (`--background`), white cards · hairline `--ak-line #E7E0D2` borders (`--border`). **Marigold `#FFB200` is a rare accent only** — the focus ring (`--ring`), the running status dot, selection wash, the आ glyph, and the optional `highlight`/`brand` button. The flat accent set — vermilion, rani, indigo, peacock, leaf, sky — stays `--data-*` and is reserved for **canvas data-types / connections & charts — never chrome**. Run state uses `--status-idle|running|completed|failed`.
- **Borders:** **1px hairline (`border`) is the standard.** `--border-strong` (ink) is for the rare emphasized divider/outline; reserve thicker weights for the आ brand tile only.
- **Radii:** softened — controls `rounded-[var(--radius)]` (8px), cards `rounded-lg` (12px); only true pills (switch, badge dots) are round.
- **Shadows:** **ultra-diffuse and almost absent.** The Tailwind `shadow-xs…shadow-2xl` utilities are remapped to low-opacity soft shadows; surfaces rest **flat**, overlays (popover/dialog/dropdown/island) get a soft elevation, and a hover may earn a whisper. **No hard-offset shadows, no press-translate, no glassmorphism, no gradients, no inset gloss.**
- **Type:** `font-display` = **Instrument Serif** — an editorial serif used sparingly for hero / display moments and the lowercase **aakriti** wordmark · `font-sans` = Space Grotesk (headings at weight 600, body, buttons, node titles) · `font-mono` = Space Mono (labels, meta, numbers, eyebrows) · `font-devanagari` = Tiro Devanagari Hindi (the आ brand mark only). Wired via `next/font` in `layout.tsx`. **Headings (`h1–h6`) default to Space Grotesk;** opt into the serif with `font-display`.

**The interaction recipe (apply to every interactive surface)**

- **Rest:** `border border-border`, flat (no shadow).
- **Hover:** a quiet color shift only — fill darkens (`--primary-hover`) or fills `accent`; pressable cards may add `hover:shadow-sm` + a faint `hover:border-border-strong/30`. **No translate.**
- **Active:** no press transform.
- **Focus:** `focus-visible:ring-2 ring-ring` (marigold), 2px offset — the single accent moment. **Disabled:** `opacity-50`.
- Motion stays snappy but subtle: `[transition-timing-function:var(--ease-snap)]`, 90–240ms, on `color`/`background`/`border` (not transform/box-shadow press). Ghost/link variants opt out of border.

**Conventions**

- Build component variants with `cva` and keep every component's prop/variant API **additive** so screens keep compiling.
- **Copy:** sentence case everywhere; the wordmark is lowercase **aakriti**; eyebrows/meta labels are UPPERCASE Space Mono (use the `ak-eyebrow` utility). Numbers/model-ids/timestamps in mono. **No emoji** — status is colored dots/badges.
- **Backgrounds:** flat paper, often the (softened) `ak-dotgrid` utility (canvas, auth, hero/empty states).
- **Canvas:** nodes use hairline borders, flat by default; data-type accents color the handles/edges/minimap, and the marigold `ring` marks selected/running/active-drop states.
- **Brand glyph:** the आ marigold tile (`src/components/brand/logo.tsx`) — never a Lucide icon; it is the one place marigold stays bold. Lucide elsewhere at ~2px stroke.
- **Clerk** is themed via a custom `appearance` in `auth-provider.tsx` (token-driven `variables` + hairline/flat `elements`), not a prebuilt Clerk theme.
- **Brand board:** see `docs/brand/aakriti-brand-board.md` for the identity board spec + generation prompt.

---

## Testing & quality

```bash
bun run lint          # ESLint (Next core-web-vitals + TypeScript)
bun run test          # Vitest
bun run test:watch
```

After substantive React changes, run react-doctor (see `.agents/skills/react-doctor/SKILL.md`).

Add tests only when they cover meaningful behavior — avoid trivial assertions.

---

## Common implementation checklists

### New API endpoint

1. Add route under `src/app/api/…/route.ts` using `createApi`.
2. Add Zod schemas for body/query.
3. Implement or reuse `db/actions` functions.
4. Register path in `API_ROUTES` (`client-constants.ts`).
5. Add fetch + hook in `services/client-api/<domain>/`.
6. Wire into screen `hook.ts`.
7. Use `assertWorkflowOwnership` / `validateNodeConnection` where applicable.

### New canvas node type

1. Add Prisma enum value if persisted type is new (migration + generate).
2. Add `NodeType` enum + registry entry (see canvas README).
3. Implement node component with `BaseNode` + `useUpdateNodeConfig`.
4. Update server execution logic (`lib/execution/`, trigger tasks) if executable.
5. Update `VALID_NODE_CONNECTIONS` in `server-constants.ts`.
6. Add sidebar entry in canvas node sidebar.

### New Trigger task

1. Create `src/trigger/my-task.ts` with `task({ id: "my-task", … })`.
2. Register task id in orchestrator shared constants if part of DAG.
3. Handle `_executionMeta` via `stripExecutionMeta` / `handleExecutionComplete`.
4. Deploy with `bun run deploy:trigger`; ensure env vars exist in Trigger.dev project.

### New screen / page

1. Create `src/screens/<name>/` (screen, hook, index, optional components).
2. Add thin page in `src/app/…/page.tsx`.
3. Add nav item to `APP_NAV_ITEMS` in `client-constants.ts` if needed.

---

## Do not

- Use npm/yarn/pnpm — **Bun only**.
- Put Prisma or Trigger calls in client components or screen UI files.
- Hand-edit `src/db/prisma/` generated files.
- Bypass `createApi` for new authenticated JSON APIs.
- Skip ownership checks on workflow mutations.
- Use deprecated Trigger.dev v2 APIs (`client.defineJob`).
- Add unrelated refactors or over-abstract one-off helpers in the same change.
- Create commits or PRs unless explicitly asked.

---

## Related docs

- [README.md](./README.md) — architecture, setup, env vars, feature list
- [src/components/canvas/README.md](./src/components/canvas/README.md) — node registry & canvas
- [.cursor/rules/](./cursor/rules/) — Bun, Trigger.dev Cursor rules
