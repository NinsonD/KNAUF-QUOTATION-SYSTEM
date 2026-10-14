# Knauf workbook calculation model

The reference is `Knauf Costing Sheets.xls`. Its 19 worksheets define 14 systems, including five separate head-deflection variants.

## Model rules

- Material identities, units and base/head specifications follow the workbook.
- Wall length = area / height. Stud, track, fixing, bracing and board-strip factors are evaluated from the workbook geometry expressions.
- The normal form keeps area and system selection simple. Height, spacing and strip/bracing dimensions are available under Technical Settings, with the workbook's defaults.
- A head-deflection variant can change base boards, screws and fixing quantities as well as add head materials.
- All intermediate quantities, amounts and rates retain full precision. Display formatting uses normal currency/quantity precision. Excel formulas and cached values use the same full-precision policy.
- Rates are entered per quotation. Unpriced items are highlighted. Drafts can be saved; issue and PDF/Excel export require rates for nonzero quantities.
- Product pack labels do not turn rates into pack prices: a `pcs` quantity needs a per-piece rate. No purchase-pack or wastage rounding is applied.
- Deliberate factor overrides and additional/removable items remain supported for estimators/admins. Rate changes do not freeze the geometry formulas when area changes.
- Saved quotes retain geometry parameters and a calculation version. Legacy records remain visible and can be explicitly rebuilt as drafts. Existing rates are retained only for matching product names.

## Corrections to inconsistent workbook references

These corrections follow the headings and quantity/rate definitions instead of copying inconsistent cell references:

1. Include every listed insulation row in base cost, including KW111, KW112, KW115 and their head variants.
2. Multiply head material factors by project area. KW111+HW used board quantity; KW112+HW used wall length.
3. Divide head cost by project area. KW112+HW used wall length; KW115+HW used wall height.
4. Add the actual base and head rates. Four head variants referenced blank cells instead of the base rate.

The custom-size 3% commercial note is retained in the terms. The estimator should include the applicable charge in the entered rate; the workbook itself does not apply a surcharge formula.

## Deployment and data

- Local development can use SQLite. Vercel builds generate the PostgreSQL client from `prisma/schema.postgresql.prisma` using the supplied production connection.
- Build-time initialization uses non-destructive schema synchronization (no reset or accept-data-loss flags), creates missing catalog data and preserves existing prices, users and quotations.
- Production requires a private `AUTH_SECRET`. Demo credential switching is not included in the browser bundle.
- Credentials and environment files must never be committed. Account migration is a separately approved, one-time action, not a build-time password reset.

## Verification

`npm run test:workbook` compares 76 scenarios and 900 material rows against independently evaluated workbook fixtures. It tests geometry changes, invalid areas, custom rates, Excel formulas/sheet names and PDF generation.

Local API checks additionally verify authenticated persistence, server-side totals, atomic failure, metadata permissions and saved exports using an isolated database copy.
