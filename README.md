# Coadjust

Claims-workforce operating system from the Accenture Future Workforce insurance transcript thesis: allocate each claim decision to model, human, or paired review by measured combined accuracy, and keep the readiness / redeployment ledger.

## Stack

- **Web:** Next.js App Router (`apps/web`) — TypeScript
- **API:** Express (`apps/api`) — TypeScript, OpenAPI `/v1` surface
- **Data:** DynamoDB (Local via Docker)
- **Shared types:** `packages/shared`

## Quick start

Local Dynamo defaults to **Dynalite** (no Docker). Use `npm run db:up:docker` if you prefer Amazon DynamoDB Local.

```bash
cp .env.example .env
npm install
npm run build --workspace=@coadjust/shared
# Terminal A — in-process DynamoDB (or `npm run db:up:docker` if Docker is available)
npm run db:local
# Terminal B
npm run db:setup && npm run db:seed
npm run dev:api
# Terminal C
npm run dev:web
```

- Web: http://localhost:3000
- API: http://localhost:4000/health

### Demo logins

Password for all users: `coadjust`

| Email | Role |
|-------|------|
| ava.handler@coadjust.demo | Handler |
| leo.leader@coadjust.demo | Team leader |
| nina.quality@coadjust.demo | Quality / conduct |
| sam.workforce@coadjust.demo | Workforce |
| jordan.caio@coadjust.demo | CAIO / governance |
| priya.dpo@coadjust.demo | DPO |

API key for integrations: `coadjust-demo-api-key`
