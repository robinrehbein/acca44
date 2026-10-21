# Vendure prototype execution ledger

Approved scope: complete free Vendure prototype, German storefront and standard Dashboard, 12 synthetic products, Lindau-first allocations across two stock locations, development-only Coolify deployment.

- Git updated with `git pull --ff-only`: already current at b2354c0.
- Isolated workspace: /private/tmp/acca44-vendure, branch feat/vendure-prototype.
- Parallel ownership: storefront agent apps/storefront; backend agent apps/server excluding stock; deployment agent Docker/Compose/docs; root stock integration and deployment.
- User amendment: Vite + React + React Router replaces Next.js. Frontend static bundle with a minimal session gateway; no Next.js runtime.
- Vendure 3.8.0 availability verified in npm registry.
- No original untracked files modified in primary checkout.
- User amendment: work on branch `dev`; existing Coolify app `zanlm9c121xyyoq6nda6tzh8` deploys dev automatically after suitable merges.
- Root unit tests RED (5 failed) -> GREEN (5 passed) for Lindau-first split, shortage rejection, unrelated location exclusion, remaining allocation and return balances.
- Full unit suite: 12 passed; both workspace typechecks passed.
- Independent review: no concrete must-fix found; direct React Router/Vite updates applied. Remaining upstream dependency advisories documented separately.
- Live local browser checkout passed with synthetic order JZRAKQC18CH7KRAW, EUR143.90; local real API stock tests passed six groups (details in integration-results).
- Upstream3.8.0 split movement rows store line total at every location. Public blocking StockMovementEvent handler normalizes movement quantities inside the same transaction; inventory counts remain service-managed. Ruling: required to preserve accurate split-order history; cost if wrong is transactional fulfillment rejection (fail closed), covered by real API tests.
