# De•Bite Restaurant Ordering

De•Bite is a premium Lagos restaurant ordering website with menu customization, cart checkout, WhatsApp ordering, order tracking, and kitchen operations tools.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/debite run dev` — run the customer-facing web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/debite/src/App.tsx` — customer routes, cart state, WhatsApp handoff, tracking, and kitchen operations view
- `artifacts/debite/src/index.css` — De•Bite theme tokens, responsive layout utilities, and WhatsApp/cart dock motion
- `artifacts/debite/public/debite-logo.png` — provided De•Bite logo used for favicon and public branding
- `artifacts/api-server/src/routes/menu.ts` — launch menu seed data and availability updates
- `artifacts/api-server/src/routes/orders.ts` — order creation, tracking, payment confirmation, and status updates
- `lib/api-spec/openapi.yaml` — source of truth for generated API hooks and validation
- `lib/db/src/schema/` — PostgreSQL menu and order tables

## Architecture decisions

- Orders are saved before WhatsApp opens, so the restaurant can track orders and update status from the operations view.
- The browser owns the active cart; the API owns menu availability and order records.
- WhatsApp remains the payment and confirmation channel; this app does not collect payment details.
- The supplied logo is copied unchanged and used as the app favicon, header mark, and brand artwork.

## Product

- Responsive home, menu, checkout, track order, about, contact, FAQ, privacy, and terms pages.
- Customizable menu items, delivery/pickup totals, ₦1,000 delivery fee, and free delivery at ₦15,000+.
- Pre-filled WhatsApp order message containing line items, customizations, totals, and customer details.
- Kitchen operations view for incoming orders, payment confirmation, order status, and menu availability.

## User preferences

- Keep the provided De•Bite logo artwork unchanged.

## Gotchas

- Vite build verification requires `PORT` and `BASE_PATH` because the artifact workflow injects them.
- OpenAPI `integer` fields currently generate `zod.int()` which is not available in the workspace's Zod runtime; use numeric fields with minimum validation for generated contracts.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
