# Quotation creator project analysis

Reviewed on 12 October 2026. The project has a working quotation flow and a useful separation between calculation, storage, and export code. It is a substantial prototype, but access control and quotation integrity need correction before it is used as a shared production system.

This review covered the application source, every API route, both Prisma schemas, seed data, material templates, prices, exports, configuration, and the existing verification scripts. It also included a production build, type checking, lint, live API checks, browser interaction, and a rendered PDF. Mutation checks used an isolated copy of `prisma/dev.db`; application source and the original database were not changed.

**What the application currently does**

| Area | Current behavior |
| --- | --- |
| Framework | Next.js 16.3.4 App Router, React 19, TypeScript, Tailwind CSS 4 |
| Storage | Prisma 6 with SQLite in the active schema; a separate PostgreSQL schema is present |
| Catalog | 14 templates: 4 ceilings, 4 partitions, 1 shaft wall, 5 wall linings |
| Materials | 183 template material rows, including deflection; 49 distinct material names |
| Pricing | 62 bundled default price entries; all 49 template materials have a matching default price |
| Deflection | Supported by 5 templates, with a separate item section and subtotal |
| Quotation studio | System selection, project/client/sales details, area, status, editable material names/factors/units/prices, add/remove rows, live totals |
| Saved quotations | Search and status filtering, item and area editing, status changes, deletion, export |
| Documents | PDF from `pdf-lib`, Excel from `exceljs`, HTML preview and dedicated print page |
| Authentication | Password login, signed session cookie, ADMIN / ESTIMATOR / SALES / VIEWER permissions, demo role switching |
| Existing local data | 14 database systems, 62 master prices, 4 users, 4 quotes at the start of the review |

The studio calculates in the browser, sends a calculation snapshot to the quotation API, and stores a quotation header with item rows. Saved PDF and Excel routes reconstruct the export from those stored snapshots. The catalog price editor writes to a separate master-price table.

The main code boundaries are [calculation](D:/KNAUF-QUATATION-CALCULATOR/src/lib/engine/calculator.ts), [quotation APIs](D:/KNAUF-QUATATION-CALCULATOR/src/app/api/quotes/route.ts), [authentication](D:/KNAUF-QUATATION-CALCULATOR/src/lib/auth/session.ts), [PDF export](D:/KNAUF-QUATATION-CALCULATOR/src/lib/exporters/pdf-generator.ts), [Excel export](D:/KNAUF-QUATATION-CALCULATOR/src/lib/exporters/excel-generator.ts), and [database schema](D:/KNAUF-QUATATION-CALCULATOR/prisma/schema.prisma).

**What works well**

- The normal calculation flow separates base and deflection materials clearly. Quantities use area × consumption factor, quantities round to three decimal places, line prices to two, and totals sum the rounded lines.
- All 14 bundled systems returned finite, non-negative line prices at 1,000 m² with their default prices. No duplicate template codes or missing default-price matches were found.
- KW111 at 1,000 m² calculates AED 45,057 base + AED 7,494 deflection = AED 52,551, or AED 52.55/m². The existing engine script and the saved sample exports agree on this normal case.
- Quotation items retain their own factors and prices. This is a useful starting point for preserving historical offers when master prices change.
- Passwords are salted and hashed; signature and password comparisons use timing-safe comparisons. Session cookies are HTTP-only and are marked secure in production.
- The branded interface has clear stages, immediate calculation feedback, and several document output options. The quotation detail page fit a 390-pixel viewport without document-level horizontal overflow; its material table uses horizontal scrolling.

**Highest-priority findings**

| Priority | Finding and verified impact | Evidence and corrective direction |
| --- | --- | --- |
| Critical | **Anonymous requests can read, create, update, delete, and export quotes.** GET and export handlers have no authentication check. Mutation checks use `if (user && !permission)`, so a missing user passes. Live checks returned 201 for creation and 200 for updating/deleting without a cookie. | [Create guard](D:/KNAUF-QUATATION-CALCULATOR/src/app/api/quotes/route.ts:49), [update guard](D:/KNAUF-QUATATION-CALCULATOR/src/app/api/quotes/[id]/route.ts:45), [delete guard](D:/KNAUF-QUATATION-CALCULATOR/src/app/api/quotes/[id]/route.ts:153). Require a valid session first, then apply permissions to each endpoint. |
| Critical | **Demo credentials and an admin role switch are delivered to the browser.** Seeded demo passwords remain valid locally, and the login/profile screens expose unrestricted role switching. A fixed session signing secret is also used when `AUTH_SECRET` is absent; it was absent from the inspected local configuration and process environment. | [Client demo credentials](D:/KNAUF-QUATATION-CALCULATOR/src/lib/auth/AuthContext.tsx:90), [secret fallback](D:/KNAUF-QUATATION-CALCULATOR/src/lib/auth/session.ts:7), [seed](D:/KNAUF-QUATATION-CALCULATOR/prisma/seed.ts:12). Gate demo functionality to an explicit development mode, replace seeded credentials, require a configured secret, and invalidate existing sessions during the transition. |
| High | **The server trusts submitted totals and quantities.** A quote with lines totalling AED 52,551 was successfully saved with a grand total of AED 1. The create/update routes never invoke the calculation engine to establish the financial snapshot. | [Stored totals](D:/KNAUF-QUATATION-CALCULATOR/src/app/api/quotes/route.ts:108). Accept validated factors/prices and calculate quantities, line amounts, subtotals, and rates on the server. |
| High | **Master price changes do not feed new calculations.** After changing a copied-database material price to AED 99, `/api/catalog` returned 99, while `/api/calculate` and the studio continued using the bundled AED 9.50. The studio never loads the master catalog prices. | [Studio price initialization](D:/KNAUF-QUATATION-CALCULATOR/src/app/quotes/new/page.tsx:39), [calculation API](D:/KNAUF-QUATATION-CALCULATOR/src/app/api/calculate/route.ts:61). Use one authoritative catalog/price service for new calculations and preserve accepted quote snapshots separately. |
| High | **A failed update can remove a quote's line items.** Item deletion, item creation, and header update occur in separate database operations. A test update that later failed on a duplicate quote number left zero items while retaining the old header total. | [Item replacement](D:/KNAUF-QUATATION-CALCULATOR/src/app/api/quotes/[id]/route.ts:78). Validate before mutation and wrap header/item changes in one transaction. |
| High | **Role restrictions are inconsistent and bypassable.** SALES can approve a quote with a status-only request and change totals by omitting `baseItems`. However, the detail page always submits `baseItems`, so an ordinary SALES status save receives 403. Creation also lets SALES submit custom item calculations. | [Conditional item check](D:/KNAUF-QUATATION-CALCULATOR/src/app/api/quotes/[id]/route.ts:66), [detail save payload](D:/KNAUF-QUATATION-CALCULATOR/src/app/quotes/[id]/page.tsx:179). Define permissions for each editable field and status transition; use matching client controls and server enforcement. |
| High | **Invalid input reaches persistent storage.** A negative area of -10 and a status of `ANY_STRING` were saved successfully. Missing `calculation` returns 500 with an internal property-access error. Negative prices/factors and non-finite values are not consistently rejected. | [Required-field check](D:/KNAUF-QUATATION-CALCULATOR/src/app/api/quotes/route.ts:70), [engine area fallback](D:/KNAUF-QUATATION-CALCULATOR/src/lib/engine/calculator.ts:11). Add request schemas with finite numeric bounds, positive area, allowed statuses/units, bounded strings/arrays, and useful 400 responses. Zod is installed but unused. |

**Calculation, catalog, and editing findings**

| Priority | Finding | Effect and direction |
| --- | --- | --- |
| Medium | Deflection toggling discards custom values | Changing the first deflection price from 13.50 to 42, turning the option off, then on restored 13.50. Disabled deflection items should remain in editing state, with only their inclusion in totals changing. [Toggle handler](D:/KNAUF-QUATATION-CALCULATOR/src/app/quotes/new/page.tsx:147). |
| Medium | Catalog quote links select the wrong template | The D127 card's Generate Quotation link opened KC_B001. Links pass only `category`, and the studio selects the first template in that category. Pass and honor `systemCode`. [Catalog link](D:/KNAUF-QUATATION-CALCULATOR/src/app/catalog/page.tsx:276). |
| Medium | Read-only users get editable material controls | As VIEWER, area/status were disabled and Save hidden, but factor/price fields and Add Material Row remained enabled. These edits affect the local preview even though a normal viewer save is rejected. `MaterialGrid` has no read-only prop. [Material grid](D:/KNAUF-QUATATION-CALCULATOR/src/components/quotation/MaterialGrid.tsx:7). |
| Medium | Reset Defaults does nothing on saved quotes | The detail page supplies an empty callback for the visible reset button. Implement reset with a defined price/snapshot policy or remove the control. [Callback](D:/KNAUF-QUATATION-CALCULATOR/src/app/quotes/[id]/page.tsx:399). |
| Medium | Master price units disagree with template units | CW 70, CW 92, UW 70, and UW 92 prices are marked `pcs` in the database while material factors use `m`. The seed guesses units from name substrings and misses these product names. Store explicit product units and verify price-per-unit conventions. [Seed unit inference](D:/KNAUF-QUATATION-CALCULATOR/prisma/seed.ts:59). |
| Medium | Editable dates are lost on save | The studio accepts a date, but the quotation API/schema do not store it. Saved views and exports use `createdAt` instead. Add a quotation date field if it represents the offer date. [Save payload](D:/KNAUF-QUATATION-CALCULATOR/src/app/quotes/new/page.tsx:204). |
| Medium | Quote numbering is fragile | New numbers use a random three-digit suffix. Creation checks for a duplicate before inserting and appends only the last four timestamp digits, with no atomic sequence or retry. Concurrent requests can still collide. Use a transactional sequence or explicit unique-conflict handling. [Numbering](D:/KNAUF-QUATATION-CALCULATOR/src/app/api/quotes/route.ts:90). |
| Medium | Calculation behavior is duplicated | Similar arithmetic exists in the shared engine, studio, and detail page. The engine restores defaults when `customItems.base` is an empty array, while the studio can remove every row. A shared calculation policy would reduce these divergences. |

The data files have no attached source document, revision number, approval record, or explanation of geometry assumptions for the consumption factors. The review verified internal arithmetic and price coverage, not that these factors match official Knauf engineering guidance. The interface's “certified”, “calibrated”, and “100% health” claims currently have no evidence mechanism in the code. Product names also act as pricing keys, including spelling aliases; stable product IDs and explicit units would make catalog maintenance more reliable.

**Document findings**

- **PDF layout and content:** The rendered sample shows the quotation badge overlapping the company name and contact information. Project/client names are drawn without width-aware wrapping. Material descriptions are truncated at 48 characters, and each term is truncated at 118 characters; the long first term loses most of its content. Use text measurement, wrapping, and variable row/section heights. [Header](D:/KNAUF-QUATATION-CALCULATOR/src/lib/exporters/pdf-generator.ts:80), [terms](D:/KNAUF-QUATATION-CALCULATOR/src/lib/exporters/pdf-generator.ts:668).
- **Arabic and other Unicode text:** A PDF with an Arabic project name failed with `WinAnsi cannot encode`. Embedded Unicode fonts and an appropriate text-layout approach are needed for this input. [Font setup](D:/KNAUF-QUATATION-CALCULATOR/src/lib/exporters/pdf-generator.ts:35).
- **Stored terms are ignored:** The database stores quotation-specific terms, but PDF, Excel, and HTML output use the hardcoded standard terms. Pass the saved terms through each exporter. [PDF](D:/KNAUF-QUATATION-CALCULATOR/src/lib/exporters/pdf-generator.ts:668), [Excel](D:/KNAUF-QUATATION-CALCULATOR/src/lib/exporters/excel-generator.ts:228), [HTML](D:/KNAUF-QUATATION-CALCULATOR/src/components/quotation/PrintableQuote.tsx:265).
- **Saved exports can disagree with the visible preview:** Editing a saved quote changes the local preview immediately, while Download PDF/Excel reads the last saved database version. Make this distinction clear or export the current validated draft.
- **Excel worksheet names can break export:** A valid quote reference such as `ANM/2026/001` is passed directly to `addWorksheet`, which throws because `/` is disallowed. Sanitize and bound the worksheet name separately from the quote reference. [Worksheet creation](D:/KNAUF-QUATATION-CALCULATOR/src/lib/exporters/excel-generator.ts:21).
- **Excel recalculation uses a different rounding policy:** Cached values reflect rounded engine quantities/amounts, while formulas use unrounded multiplication. A factor of 0.1234 at 1 m² and AED 10 produced cached quantity 0.123 and amount 1.23, but the formulas recalculate to 0.1234 and 1.234. Use explicit rounding in formulas to match the engine. [Formulas](D:/KNAUF-QUATATION-CALCULATOR/src/lib/exporters/excel-generator.ts:133).
- **Document metadata is inconsistent:** HTML includes status; the vector PDF does not render it, and Excel uses neither quotation date nor status. Signature dates are fixed to 2026. A shared document model should carry the same metadata to each output.
- **The preview modal appears underneath navigation:** Browser inspection showed the navbar over the modal toolbar/document. The modal is inside `main` at `z-10`, while navigation sits at `z-30`; its descendant `z-50` cannot escape that stacking context. Move overlays to an appropriate top-level layer. [Layout](D:/KNAUF-QUATATION-CALCULATOR/src/app/layout.tsx:31).

Visual evidence: [rendered sample PDF](D:/KNAUF-QUATATION-CALCULATOR/analysis/sample-quote.pdf), [PDF page image](D:/KNAUF-QUATATION-CALCULATOR/analysis/sample-quote.png), and [print-preview screenshot](D:/KNAUF-QUATATION-CALCULATOR/analysis/print-preview.jpg).

**Data model, dashboard, and operating gaps**

- The active SQLite schema uses floating-point money and unrestricted string statuses/roles. Enforce valid values at request boundaries and establish a consistent monetary precision policy.
- The PostgreSQL schema is not a deployable equivalent of the current schema: it has no `User` model or quote ownership relation, changes terms from a JSON string to an array, and changes numbers to Prisma Decimal values. Auth calls and current serialization/number methods require adaptation before switching. [PostgreSQL schema](D:/KNAUF-QUATATION-CALCULATOR/prisma/schema.postgresql.prisma).
- The API never assigns `userId` when creating a quote. All four initial quotes were ownerless. There is no audit history, immutable revision model, approval record, or conflict detection for simultaneous edits; updates overwrite the same quote.
- Sessions trust the role inside the signed cookie for up to seven days and do not check the current database user/role. Account deletion or role changes would not revoke existing tokens immediately. Login has no throttling, and password verification is synchronous.
- Dashboard category percentages, system popularity bars, health, and specification checkmarks are hardcoded. The average rate uses only the six most recent quotes, and a zero quote count displays 2. These are presentation/demo values, not reliable business metrics. [Dashboard](D:/KNAUF-QUATATION-CALCULATOR/src/app/page.tsx:31).
- The quotations endpoint returns every matching quote and its full items without pagination. Client searches have no cancellation/version protection, so older responses can replace newer results. Several fetch failures are logged or silently ignored instead of being shown to the user.
- Labels are often visually adjacent without `htmlFor`/input IDs. Some icon buttons and the deflection switch lack accessible names. Preview modals lack dialog semantics, focus trapping, and Escape handling. These are source/browser observations, not a complete accessibility conformance audit.
- The README remains the Next.js starter README. There is no documented database bootstrap, environment example, backup/restore procedure, migration history, deployment recipe, test script, or CI workflow. Since the SQLite file is ignored, a fresh checkout cannot rely on the reviewed seeded database being present.
- User management is described in role metadata and returned permissions, but no user-management screen/API is implemented.

Potential product extensions should follow the intended commercial scope: multiple assemblies in one quote, pack/bundle rounding, explicit wastage, discounts/markup, tax totals, validity dates, payment/delivery terms, quote cloning, and client-specific access. Their absence is a scope decision rather than a defect against the current request. The current engine produces theoretical material estimates and explicitly labels totals as excluding VAT.

**Verification results and limits**

| Check | Result |
| --- | --- |
| `npm run build` | Passed; production routes compiled and generated |
| `tsc --noEmit --incremental false` | Passed on the original project |
| `prisma validate` | Active SQLite schema passed |
| `test-quotation-engine.ts` | Completed successfully; KW111 calculations, logo Excel generation, and seeded database checks |
| `test-auth-permissions.ts` | Passed password, session round-trip, permission-helper, and seeded-login checks |
| All bundled template calculations | All 14 produced finite non-negative line amounts at 1,000 m² with defaults |
| `npm run lint` | Failed: 48 errors, 30 warnings; mostly explicit `any`, unused imports, and React effect/purity rules |
| Live API integrity/access checks | Reproduced the anonymous access, forged totals, invalid input, role, price drift, and failed-update issues above |
| Browser checks | Confirmed deflection reset, D127 link mismatch, viewer material controls, modal stacking, and small-screen layout |
| Export checks | PDF/Excel generation succeeded for the normal sample; Arabic PDF and slash-containing Excel reference failed |
| Dependency vulnerability audit | Could not complete: the npm registry audit endpoint was unavailable from this environment; no clean vulnerability result is claimed |

The existing engine script uses `console.assert`, which logs a failure without necessarily failing the process, and tests only one template's normal calculations. The auth script checks helpers and seeded accounts, not route authorization. This explains how both scripts pass while serious API problems remain. Add meaningful route-level tests for anonymous users, every role, invalid payloads, rounding, transaction rollback, price updates, and export content/layout.

Evidence is retained in [runtime results](D:/KNAUF-QUATATION-CALCULATOR/analysis/runtime-results.json), [template rates](D:/KNAUF-QUATATION-CALCULATOR/analysis/system-rates.json), [build log](D:/KNAUF-QUATATION-CALCULATOR/analysis/build.log), and [lint log](D:/KNAUF-QUATATION-CALCULATOR/analysis/lint.log). The review did not validate engineering factors against supplier documentation, test a PostgreSQL deployment, or perform a complete browser-print pagination/accessibility audit.

**Recommended implementation order**

1. Enforce authentication on quotation/data/export endpoints; remove production demo access and require a session secret.
2. Validate inputs, load authoritative prices, recalculate financial snapshots on the server, and make quotation updates transactional.
3. Align roles, approval transitions, quote ownership, revision handling, and UI edit permissions.
4. Correct template links, deflection-state preservation, date/terms persistence, and PDF/Excel consistency.
5. Reconcile the production schema, add reliable regression checks and CI, clear lint errors, and document setup/deployment/backups.
