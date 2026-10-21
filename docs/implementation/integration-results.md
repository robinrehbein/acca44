# Local integration evidence

Verified on 2026-10-21 against Vendure 3.8.0, local PostgreSQL on port 55444, API on port 3001, and the persistent worker. This is local prototype qualification, not a production deployment or a payment-provider certification.

Commands:

```sh
npm run build:server -w @acca44/server
npm run build:dashboard -w @acca44/server
TEST_ALLOW_MUTATIONS=true node tests/integration.mjs
```

Results: server TypeScript build passed; complete standard Dashboard production build passed (7,975 modules). The Dashboard build reports an upstream main-chunk size warning. The API integration script passed all six check groups twice consecutively after its fixture/API probes were corrected.

| Check | Observed result |
| --- | --- |
| Authentication and permissions | Correct superadmin and operator credentials accepted; invalid password rejected; anonymous catalog administration denied. Operator reads catalog, orders and stock locations; administrator listing and global-settings mutation denied. |
| Live API schema | Cancellation and fulfillment input/union types introspected; real `cancelOrder` and `addFulfillmentToOrder` mutations used. |
| Split allocation | With Lindau 2 and Friedrichshafen 2, buying 3 reserves exactly Lindau 2 and Friedrichshafen 1. Allocation ledger quantities are 2 and 1. |
| Partial fulfillment | Fulfilling 2 leaves Lindau on-hand/allocation 0/0 and Friedrichshafen 2/1. Fulfilling the last 1 leaves Friedrichshafen 1/0. Sale ledger entries are -2 and -1. |
| Cancellation before fulfillment | Cancelling the paid split order restores allocations to zero at both original locations; on-hand remains 2/2. Release ledger quantities are 2 and 1. |
| Cancellation after partial fulfillment | After fulfilling Lindau 2, cancelling the order returns exactly Lindau 2 and releases Friedrichshafen 1. Both locations finish on-hand 2, allocated 0. Cancellation and release ledger quantities are 2 and 1 respectively. |
| Competing checkouts | Two separate sessions prepare checkout for the last available pair, then submit payment concurrently. Exactly one reaches `PaymentSettled`; total allocation remains 1, with no negative or underallocated paid stock. Cancelling the winner releases the pair. |

The isolated test variant was `SATORISAN-MORGENLICHT-WEISS-36`. An existing frontend reservation on `SATORISAN-MORGENLICHT-WEISS-39` was preserved. The test selects an unallocated Morgenlicht variant, resets only that fixture's stock through the Admin API, and finishes with 2 units at each location. Synthetic customers use `smoke-...@acca44.example`; payments and tracking data explicitly indicate simulation. Synthetic orders remain as demo evidence. On rerun, only this smoke test's own non-active, non-cancelled orders are recovered; unrelated orders are not cancelled.

The mutating script refuses to run without `TEST_ALLOW_MUTATIONS=true` and refuses remote origins unless `TEST_ALLOW_REMOTE_MUTATIONS=true` is also explicitly supplied. Credentials come from the root `.env` and are never printed.

## Evidence boundaries

All checkout, inventory, payment-state, fulfillment and cancellation assertions use real Shop/Admin GraphQL APIs and persisted PostgreSQL state, not mocks. This script does not contact an external payment provider or send email. Vendure's public stock-movement API does not expose movement locations; sale/release rows also do not expose order lines. Therefore the script correlates new movement IDs on an isolated variant, checks movement quantity multisets, and independently asserts each location's persisted stock/allocation values. It does not claim direct per-movement location API inspection.

The standard Dashboard build is verified here; browser/UI checks and Coolify deployment evidence belong to their separate verification records. PostgreSQL emits an upstream `pg` concurrent-query deprecation warning; no assertion failed because of it.

## Container and deployed development evidence

The complete Docker Compose stack (PostgreSQL, migration job, server, worker and storefront) built and started locally. Explicit seeding and all six integration groups passed against that stack. Restarting the persistent services preserved catalog, orders and stock.

On 2026-10-21 the development deployment served valid HTTPS at `https://acca44.robinrehbein.de` and `https://api.acca44.robinrehbein.de/dashboard/`. Explicit additive seeding produced 12 demo products. `TEST_ALLOW_MUTATIONS=true TEST_ALLOW_REMOTE_MUTATIONS=true node tests/deployed-shop-smoke.mjs` passed through the public storefront gateway: order `58EY5JV71LJKEUPT` reached `PaymentSettled` using only the simulated payment handler. An independent client had no active cart before or after checkout, and the paid client's cart cleared. This remote check covers checkout and session isolation; the six detailed inventory lifecycle groups above were tested locally, not rerun remotely.

Photorealistic generated shoe, bag and belt images are labelled as AI-generated demo imagery; they are not original manufacturer product photographs. See [image provenance](image-assets.md).
