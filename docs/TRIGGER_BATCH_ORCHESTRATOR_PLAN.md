# Trigger.dev Batch Job as Orchestrator – Migration Plan

This document is a **step-by-step action plan** to use Trigger’s batch/orchestrator task as the full-flow orchestrator **without changing current behavior** (same API, same UI, same outcomes). Single-node execution and the webhook continue to work as today.

---

## 1. Current Flow (What We Preserve)

### 1.1 Full flow (today)

1. **Entry**: User clicks “Run flow” → `POST /api/workflow-file/:workflowId/execute-flow`
2. **Next.js**:
   - `executeFullFlow(workflowId, completionUrl)`:
     - Creates `workflow_execution` (type `full`)
     - Creates `node_execution` for each **source** node (text, image_upload, video_upload) with `output` from config
     - Calls `triggerReadyNodes(workflowId, workflowExecutionId, completionUrl)`
3. **triggerReadyNodes** (in Next.js):
   - Loads nodes/edges from DB
   - Computes “ready” nodes (all predecessors completed in this run, no execution yet)
   - For each ready node: resolves inputs via `resolveInputsForNodeInFlow`, creates `node_execution`, calls `tasks.trigger(taskId, payload)` with `_executionMeta` including `completionUrl`
4. **Trigger tasks** (crop-image, run-llm, extract-video-frame):
   - Run with payload + `_executionMeta`
   - On completion call `notifyExecutionComplete(meta, output, error)` → **POST to Next.js webhook**
5. **Webhook** `POST /api/webhooks/execution-complete`:
   - Updates `node_execution` (output/error)
   - If execution type is `full`: calls `triggerReadyNodes(...)` again (next wave)
   - When all nodes terminal: updates `workflow_execution` (result, status)

### 1.2 Single-node run (unchanged)

- `POST .../nodes/:nodeId/execute` → create `workflow_execution` (type `one_node`) + `node_execution` → `tasks.trigger(taskId, payload, _executionMeta with completionUrl)` → task completes → webhook → update node_execution + workflow_execution. **No change.**

---

## 2. Target Flow (Trigger as Full-Flow Orchestrator)

- **Entry**: Same – `POST execute-flow` (same API).
- **Next.js** (execute-flow handler):
  - Same: create `workflow_execution` (type `full`) and **source** `node_execution` rows.
  - **New**: Instead of calling `triggerReadyNodes`, trigger **one** Trigger task: **workflow-orchestrator** with `{ workflowId, workflowExecutionId }` (no `completionUrl` for child tasks).
- **Orchestrator task** (runs on Trigger):
  - Uses **Prisma** (DB) to read nodes/edges and node_execution.
  - Loop:
    1. Compute **ready** node ids (same logic as `getReadyNodeIds`).
    2. For each ready node: resolve inputs (read predecessor outputs from DB), create `node_execution`, build task payload (with `_executionMeta` **without** `completionUrl`).
    3. **batch.triggerAndWait**(array of `{ id: taskId, payload }`) for this wave.
    4. For each result: update `node_execution` (output/error) via Prisma.
    5. If any new node became ready, repeat; else exit.
  - When loop ends: update `workflow_execution` (status, result) via Prisma.
  - Optional: POST to a “flow complete” webhook so Next.js can invalidate cache / UI can refresh (or rely on existing polling).
- **Child tasks** (crop-image, run-llm, extract-video-frame):
  - **Change**: Call `notifyExecutionComplete` **only if** `meta.completionUrl` is set. When run from the orchestrator, `completionUrl` is omitted so they do **not** hit the webhook; the orchestrator gets the result from `batch.triggerAndWait` and writes to DB.

**Result**: Full flow is orchestrated by Trigger (batch + loop); single-node and webhook behavior stay the same.

---

## 2.1 Who Does What (Execution ID and Ownership)

**Yes – the whole flow is shifted to Trigger; Next.js only deals with the execution id and starting the run.**

| Responsibility | Owner | What happens |
|----------------|--------|----------------|
| Create the run record | **Next.js** | Create `workflow_execution` (type `full`) and get `workflowExecutionId`. Create `node_execution` rows for **source** nodes (text, image_upload, video_upload) with their config-based output. |
| Start orchestration | **Next.js** | Call `tasks.trigger("workflow-orchestrator", { workflowId, workflowExecutionId })`. Return the same API response (e.g. `workflowExecutionId`) to the client. |
| Everything else for full flow | **Trigger** | Orchestrator task loads nodes/edges, computes ready nodes, resolves inputs, creates non-source `node_execution` rows, runs **batch.triggerAndWait()** per wave, updates all `node_execution` and finally `workflow_execution`. |

So from the app’s perspective: you create the execution (and thus the execution id) in your DB, then hand off to Trigger with that id. Trigger owns all “which node runs when,” “trigger child tasks,” “wait for results,” and “write back results.” Next.js does not drive the DAG or talk to the webhook for full-flow node completions.

---

## 2.2 How This Matches the Recommended Trigger Pattern (Architectural Feedback)

The feedback was:

> You used Next.js as the orchestrator (fire-and-forget tasks.trigger() + webhook callback), which works but isn't the recommended pattern. The correct approach is to have a **single orchestrator Trigger.dev task** that uses **batchTriggerAndWait()** to fan out child tasks — orchestration logic inside Trigger.dev gives **durability** (auto-resume on server crash), **full visibility** in the dashboard, and **native retry** on the orchestration layer.

This plan **does** implement that pattern. Mapping:

| Recommendation | How the plan covers it |
|----------------|-------------------------|
| **Single orchestrator Trigger task** | One task: `workflow-orchestrator`. It receives `workflowId` and `workflowExecutionId` and runs the full DAG loop on Trigger. |
| **batchTriggerAndWait() to fan out child tasks** | We use **batch.triggerAndWait()** (Trigger’s API for triggering *multiple different* tasks and waiting: crop-image, run-llm, extract-video-frame). Same pattern as “fan out child tasks and wait.” *Note: `batch.triggerAndWait` is the name when you trigger different task ids; `yourTask.batchTriggerAndWait` is for the same task with many payloads.* |
| **Orchestration logic inside Trigger** | The loop (get ready nodes → resolve inputs → create node_execution → batch.triggerAndWait → update results) lives entirely in the orchestrator task. No orchestration in Next.js or in the webhook for full flow. |
| **Durability (auto-resume on crash)** | While the orchestrator is waiting on `batch.triggerAndWait()`, Trigger checkpoints the run. If the Next.js server (or your webhook) crashes, the orchestrator is unaffected and resumes when the child runs complete. |
| **Full visibility in dashboard** | One orchestrator run per full flow; all child runs (crop, LLM, extract-video-frame) are triggered from it and visible in the Trigger dashboard. |
| **Native retry on orchestration layer** | The orchestrator task can use Trigger’s retry config. If it fails (e.g. DB timeout), Trigger retries the task. The plan calls out making node_execution creation/updates idempotent so retries don’t double-create or corrupt state. |

So after migration, you are no longer using “fire-and-forget + webhook callback” for full flow; you use “one orchestrator task + batch.triggerAndWait” as recommended.

---

## 3. Step-by-Step Action Plan

### Phase A – Backend: Shared logic and execution meta

**A1. Execution meta – optional completion URL**

- **File**: `src/trigger/execution-callback.ts` (and types).
- **Change**: Treat `completionUrl` as optional in `ExecutionMeta`.
- **Change**: In `notifyExecutionComplete`, only call `fetch(meta.completionUrl, ...)` when `meta.completionUrl` is present; otherwise no-op.
- **Reason**: Orchestrator will pass `_executionMeta` without `completionUrl`; child tasks must not POST to the webhook in that case.

**A2. Child tasks – conditional callback**

- **Files**: `src/trigger/crop-image.ts`, `src/trigger/run-llm.ts`, `src/trigger/extract-video-frame.ts`.
- **Change**: After stripping meta, only call `notifyExecutionComplete(meta, output, error)` when `meta?.completionUrl` is set.
- **Reason**: When run from orchestrator, no webhook; when run from Next.js (single-node or legacy path), webhook is used.

**A3. Extract “resolve inputs + create node execution + build payload” for one node**

- **File**: `src/lib/execution/full-flow-execution.ts` (or a new shared module used by both Next.js and Trigger).
- **Current**: `triggerReadyNodes` does: get ready nodes → for each, `resolveInputsForNodeInFlow` → create node_execution → `tasks.trigger(taskId, payload)`.
- **Action**: Extract a **pure** (or DB-backed) helper that, given `(workflowId, workflowExecutionId, nodeId, nodesById, edges)`, returns either:
  - `{ payload, nodeExecutionId }` (and caller creates node_execution), or
  - the same but the function also creates the node_execution (if we keep creation in one place).
- **Goal**: Orchestrator task (running on Trigger) can reuse the same “resolve inputs” and “create node_execution” logic. Prefer moving “create node_execution” into a shared place callable from Trigger (e.g. Prisma inside the task) so the orchestrator does not depend on Next.js for that.

**A4. Shared “get ready node ids” and “resolve inputs”**

- **Files**: `src/lib/execution/full-flow-execution.ts` and/or new `src/lib/execution/orchestrator-helpers.ts`.
- **Action**: Ensure `getReadyNodeIds` and `resolveInputsForNodeInFlow` (or equivalents) can be called from code that has **only** DB access (Prisma), not Next.js-specific APIs. If they already only use workflow-execution DB actions, they can be imported from the Trigger task (once Prisma is available there).
- **Detail**: Orchestrator will need to load nodes/edges from DB and build `nodesById` / edges list; then call the same get-ready and resolve-input logic. Any `getNodeOutputForExecution` must use Prisma (or a shared layer that uses Prisma).

---

### Phase B – Backend: Trigger orchestrator task and Prisma

**B1. Prisma in Trigger build**

- **File**: `trigger.config.ts`.
- **Action**: Add `prismaExtension` (see [Trigger Prisma extension](https://trigger.dev/docs/config/extensions/prismaExtension)) so Trigger tasks can use Prisma. Use the mode that matches your Prisma version (e.g. modern for Prisma 7).
- **Env**: Ensure Trigger deployment has `DATABASE_URL` (and any pooler URL if required) so Prisma in the task can connect to the same DB as Next.js.

**B2. Workflow orchestrator task**

- **New file**: `src/trigger/workflow-orchestrator.ts` (or similar).
- **Behavior**:
  1. **Payload**: `{ workflowId: string, workflowExecutionId: string }`.
  2. **Run**:
     - Load nodes and edges from DB (Prisma).
     - Topological order and “ready” logic: reuse same logic as current full flow (get ready node ids from current run’s node_execution).
     - **Loop**:
       - Get ready node ids for this run.
       - If none left, break.
       - For each ready node:
         - Resolve inputs (using DB to get predecessor outputs).
         - Create `node_execution` (Prisma).
         - Build payload for the corresponding task (crop-image, run-llm, extract-video-frame) with `_executionMeta: { workflowId, nodeId, nodeExecutionId, workflowExecutionId }` and **no** `completionUrl`.
       - Call **batch.triggerAndWait** with the array of `{ id: taskId, payload }`.
       - For each returned result (ok, output, error, and a way to map back to nodeExecutionId – e.g. by passing nodeExecutionId in payload and matching by order or by a correlation id), update the corresponding `node_execution` (output/error) via Prisma.
     - After loop: set `workflow_execution` status/result (same as current webhook does when “all terminal”).
  3. **Idempotency / errors**: Define what happens if the orchestrator fails mid-loop (e.g. retry from start vs resume from last state). Prefer at-least-once semantics and idempotent node_execution updates so retries are safe.

**B3. Map batch results back to node executions**

- **Detail**: `batch.triggerAndWait` returns an array of results (e.g. `{ ok, output, error, ... }`). You need to associate each result with the correct `nodeExecutionId`. Options:
  - Pass `nodeExecutionId` (and optionally `nodeId`) inside each payload (e.g. in `_executionMeta`). When building the batch, keep an array `[nodeExecutionId1, nodeExecutionId2, ...]` in the same order as the batch items; then use the same index to update the right row.
  - Or use a correlation id in the payload and in the result (if the SDK exposes it) to map back. Prefer the ordered array for simplicity.

---

### Phase C – Backend: Execute-flow and webhook

**C1. Execute-flow API – trigger orchestrator**

- **File**: `src/app/api/workflow-file/[workflowId]/execute-flow/route.ts`.
- **Change**:
  - Keep: create `workflow_execution` (type `full`) and create **source** `node_execution` rows (same as today).
  - Replace: instead of calling `executeFullFlow(workflowId, completionUrl)` (which calls `triggerReadyNodes`), call **tasks.trigger("workflow-orchestrator", { workflowId, workflowExecutionId })**.
  - Keep the same response shape (e.g. return `workflowExecutionId` and a “started” message) so the client does not change.
- **Optional**: Feature flag (e.g. env `USE_TRIGGER_ORCHESTRATOR=true`) to switch between “old” (triggerReadyNodes from Next.js) and “new” (orchestrator task). If you want zero risk, ship behind a flag and switch later.

**C2. Webhook – full flow**

- **File**: `src/app/api/webhooks/execution-complete/route.ts`.
- **Change**: When the webhook receives a completion for a run:
  - If `execution_type === "full"`: **do not** call `triggerReadyNodes`. (Orchestrator is responsible for the next waves.) Still update `node_execution` if the webhook is ever called for that run (e.g. legacy or single-node). In the new design, for full flow the webhook will **not** be called by node tasks (no completionUrl), so this path may only run for old in-flight runs during migration.
  - If `execution_type === "one_node"`: keep current behavior (update node_execution + workflow_execution).
- **Result**: No double-triggering of “next wave” for full flow; single-node unchanged.

**C3. Optional – flow-complete webhook**

- **New**: `POST /api/webhooks/flow-complete` (or reuse execution-complete with a different payload shape).
- **Purpose**: Orchestrator, after updating `workflow_execution`, can POST once to notify Next.js that the flow is done (e.g. for cache invalidation or real-time UI). If the UI already polls the executions list, this is optional.

---

### Phase D – Frontend and observability

**D1. Frontend – no required changes**

- **Execute flow**: Same API and same response; UI keeps calling the same endpoint and can keep polling or refetching executions.
- **Single-node run**: Unchanged; still uses webhook.
- **Display**: Execution list and node status come from DB; orchestrator writes the same `node_execution` and `workflow_execution` fields, so the UI continues to work.

**D2. Trigger dashboard**

- **Runs**: You will see one “workflow-orchestrator” run per full flow, plus child runs (crop-image, run-llm, etc.) triggered from it. Batch runs will appear under the batch/orchestrator run.
- **Logs**: Add clear logs in the orchestrator (e.g. “Wave 1: triggering nodes X, Y”, “Wave 2: …”) so debugging is easy.

**D3. Error handling and retries**

- **Orchestrator**: If the orchestrator task fails (e.g. DB error, timeout), Trigger will retry according to the task’s retry config. Ensure:
  - Creating node_execution and updating output/error is idempotent or safe under retries (e.g. “create if not exists”, “update by id”).
  - No duplicate node runs: either pass idempotency keys for child triggers or ensure the “ready” logic does not re-trigger the same node (you already avoid that by creating node_execution before triggering).
- **Child tasks**: Keep existing retry behavior; they already report success/failure via return value, and the orchestrator will write that to the DB.

---

## 4. File / Module Checklist

| Area | File(s) | Action |
|------|--------|--------|
| Execution meta | `src/trigger/execution-callback.ts` | Optional `completionUrl`; only notify when set |
| Child tasks | `src/trigger/crop-image.ts`, `run-llm.ts`, `extract-video-frame.ts` | Call `notifyExecutionComplete` only if `meta?.completionUrl` |
| Shared orchestration logic | `src/lib/execution/full-flow-execution.ts` or new helper module | Extract get-ready + resolve-inputs + (optionally) create node_execution so Trigger can reuse |
| Trigger config | `trigger.config.ts` | Add `prismaExtension` for Prisma 7 |
| New task | `src/trigger/workflow-orchestrator.ts` | New task: loop (get ready → resolve inputs → create node_execution → batch.triggerAndWait → update node_execution) → update workflow_execution |
| Execute-flow API | `src/app/api/workflow-file/[workflowId]/execute-flow/route.ts` | Create run + source executions, then trigger "workflow-orchestrator" instead of `triggerReadyNodes` |
| Webhook | `src/app/api/webhooks/execution-complete/route.ts` | For full flow, do not call `triggerReadyNodes`; keep single-node behavior |
| Optional | New webhook or payload | Flow-complete notification for UI/cache |

---

## 5. Order of Implementation (Recommended)

1. **A1 + A2** – Optional completion URL and conditional callback in all three child tasks. Deploy and verify single-node and current full flow still work (full flow still uses webhook and triggerReadyNodes).
2. **A3 + A4** – Refactor so “get ready”, “resolve inputs”, and “create node_execution” are reusable from a Prisma-only context (no Next.js-only imports in that path). Tests if you have them.
3. **B1** – Add Prisma to Trigger config and confirm Trigger can connect to your DB (e.g. run a tiny Trigger task that does one Prisma read).
4. **B2 + B3** – Implement the workflow-orchestrator task and wire batch.triggerAndWait and result mapping. Test in dev by triggering the orchestrator manually with a known workflowExecutionId.
5. **C1** – Switch execute-flow to trigger the orchestrator instead of calling executeFullFlow (optionally behind a flag).
6. **C2** – Webhook: skip triggerReadyNodes for full flow.
7. **D2 + D3** – Logging, idempotency, and retry behavior; then remove the feature flag if used.

---

## 6. Drop-in Replacement – No Impact on Current Functionality

**Yes. This is a drop-in replacement; current functionality stays intact.**

| Area | Unchanged |
|------|-----------|
| **API** | Same `POST /api/workflow-file/:workflowId/execute-flow`. Same request/response (e.g. `workflowExecutionId` returned). Client code does not change. |
| **Single-node execution** | Not touched. Still: create `workflow_execution` (type `one_node`) + `node_execution` → `tasks.trigger(taskId, payload)` with `completionUrl` → task completes → webhook → update DB. |
| **Webhook** | Still used for single-node. For full flow we simply stop calling `triggerReadyNodes` from the webhook (orchestrator drives waves); webhook still updates `node_execution` when it is called (e.g. single-node or legacy in-flight runs). |
| **DB schema** | No schema changes. Same `workflow_execution` and `node_execution` tables and fields. Orchestrator reads/writes the same rows. |
| **UI** | No required changes. Execution list and node status come from the same DB; orchestrator writes the same status/result fields. Polling or refetch continues to work. |
| **Outcomes** | Same DAG order, same inputs per node (same resolve logic), same outputs written to `node_execution`, same final `workflow_execution` status/result. Only the *driver* of the DAG moves from Next.js to Trigger. |

**What actually changes (internal only):**

- For **full flow**, instead of Next.js calling `triggerReadyNodes` (and the webhook calling it again after each wave), we start **one** orchestrator task with `workflowExecutionId`; that task does the “ready → trigger batch → wait → update DB” loop on Trigger. The observable result (which nodes ran, in what order, with what outputs) is the same.

So from the app’s perspective: same APIs, same UI, same data model, same behavior. It’s a drop-in replacement; everything current keeps working.

---

## 7. Rollback

- **With feature flag**: Set `USE_TRIGGER_ORCHESTRATOR=false` and redeploy; execute-flow will use the old path again.
- **Without flag**: Revert C1 to call `executeFullFlow` and C2 to keep calling `triggerReadyNodes` for full flow; redeploy. Orchestrator task can remain deployed but unused.

---

## 8. Docs References

- [Trigger – Triggering](https://trigger.dev/docs/triggering): `tasks.trigger`, `batch.trigger`, `batch.triggerAndWait`
- [Trigger – Batch trigger](https://trigger.dev/docs/management/tasks/batch-trigger): batch size, payload shape
- [Trigger – Wait](https://trigger.dev/docs/wait): parent checkpointing while waiting
- [Trigger – Prisma extension](https://trigger.dev/docs/config/extensions/prismaExtension): Prisma in Trigger tasks

This plan keeps current functionality intact while moving full-flow orchestration into Trigger’s batch/orchestrator model.
