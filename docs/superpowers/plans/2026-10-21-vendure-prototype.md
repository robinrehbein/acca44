# Acca44 prototype - approved implementation scope

Build a free self-hosted Vendure3.8.0 prototype using the standard German Dashboard, PostgreSQL, worker and Vite/React/ReactRouter storefront. The user explicitly replaced Next.js during implementation.

- Catalog: eight fictional Kamo-Gutsu/Satorisan shoes, two bags and two belts; options, unique SKUs, synthetic EUR gross prices, public facets.
- Physical stock: Lindau then Friedrichshafen, split remaining quantities; reservations, partial fulfillment and cancellation preserve location history. No backorders.
- Storefront: category/brand/size/color filtering, product variants, cart, guest checkout with fixed synthetic details, simulated payment and confirmation. No real mail or payment provider.
- Administration: standard Dashboard in German; operator catalog/assets/inventory/orders permissions without system administration. No custom simplified editor.
- Operations: one DockerCompose application in Coolify CarinaRehbein/development, existing app zanlm9c121xyyoq6nda6tzh8. Work on dev, deploy suitable merges automatically. Do not change production resources.
- Secret provisioning: Coolify magic variables generate secrets outside Git. Persistent database/assets; explicit additive seed only; migrations gate server/worker startup.
- Acceptance: unit tests, builds/typechecks, browser checkout, actual API split stock/partial shipment/cancellation/concurrency and auth checks, full Compose startup/seed/restart persistence, deployed HTTPS/UI/login/checkout and accurate separate evidence.

Deferred: source spreadsheet import until sample provided, POS/cash register compliance, actual customer/business data, paid extensions, production launch.
