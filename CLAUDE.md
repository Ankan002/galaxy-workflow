# CLAUDE.md

Instructions for Claude (and other AI assistants) working in this repository.

## Primary guidance

**Read and follow [AGENTS.md](./AGENTS.md) before implementing anything.**

That document is the source of truth for:

- Project structure and layering (app → screens → services → API → db/actions → trigger)
- Code conventions (naming, formatting, imports, error handling)
- How to add API routes, canvas nodes, Trigger tasks, and screens
- Auth, execution model, and environment config
- Commands (`bun run …`) and things to avoid

## Quick context

Galaxy Workflow is a Next.js 16 + React 19 visual AI workflow builder. PostgreSQL/Prisma for persistence, Clerk for auth, Trigger.dev for node execution, TanStack Query for client data fetching.

Use **Bun** for all package and script commands.

## Other references

- [README.md](./README.md) — full architecture, setup, and environment variables
- [src/components/canvas/README.md](./src/components/canvas/README.md) — canvas and node registry
- `.cursor/rules/` — additional Cursor rules (Bun, Trigger.dev)

When AGENTS.md and README disagree on conventions, prefer **AGENTS.md** for implementation style and **README.md** for product/architecture details.
