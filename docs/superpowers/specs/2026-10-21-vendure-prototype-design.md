# Acca44 Vendure prototype

## Purpose
Give the shop operator a usable demonstration of managing shoes for Lindau and Friedrichshafen and accepting online test orders. Robin owns hosting and technical operations. Existing inventory is maintained manually in a spreadsheet; its columns and completeness are unverified.

## Deployment target
Coolify project `Carina Rehbein`, environment `development`:
https://coolify.robinrehbein.de/project/x7o8imdwnnumgvo2zs1coqxr/environment/3qafrazukc2j1wx1dwyb0rfr

The environment was inspected on 2026-10-21 and contains zero resources. The target server, available capacity, domains and deployment source still need inspection. Public access for testing is requested; production commerce is outside this prototype.

## Proposed architecture
- Self-hosted Vendure server and worker, using a pinned supported release selected during implementation planning.
- PostgreSQL with persistent storage; persistent product assets.
- Vendure Dashboard for authenticated administration, initially using supported standard workflows.
- A small German storefront connected to the Shop API, with EUR prices, product variants, cart and test checkout.
- Two stock locations named Lindau and Friedrichshafen. A location represents physical stock, not a separate storefront.
- Synthetic shoe data covering sizes, colors and per-location stock. Clearly mark all products, orders and payment flows as demonstrations.

## Operator workflows
View variant stock at both locations, receive goods through supported inventory adjustments, and process test orders. Evaluate manual in-store sale recording and transfers against the selected Vendure version before promising those workflows. Any custom stock mutation must preserve stock movement history, reservations and authorization; no direct database edits.

## Limits
No real payment capture, customer imports, tax-compliant cash register implementation or production launch. Spreadsheet import is deferred until a sample and mapping are available. A custom simplified operator screen is deferred until standard Dashboard usability has been tested.

## Verification
Build and start the pinned stack; verify login and authorization, product and variant display, independent location quantities, cart and test checkout, stock reservation behavior, insufficient-stock rejection and data persistence after restart. Report local and deployed checks separately. Verify HTTPS and authenticated admin access on the final development URLs.

## Decisions before implementation
Review this scope and create an implementation plan. Confirm the deployment server and domain from Coolify configuration. Use generated development credentials managed outside tracked source files. Determine the supported strategy for allocations across the two locations and document any prototype limitations.
