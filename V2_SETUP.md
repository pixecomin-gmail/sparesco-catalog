# Sparesco V2 — LOCAL drop-in replacement

This ZIP is extracted into the **existing** `sparesco-catalog-main` root. It replaces **only V2 paths** (`app/new`, `app/api/new`, `lib/v2`, `v2-migrations`, `v2-samples`) and does not change existing live routes, existing Product Studio, package.json or Cloudflare config.

## Local test

1. In PowerShell at project root, unzip using `Expand-Archive -LiteralPath '.\sparesco-v2-rebuilt.zip' -DestinationPath '.' -Force`.
2. Run `npm run build` then `npm run dev`.
3. Visit `http://localhost:3000/new/admin/products` and import `v2-samples/test.xlsx` using collection handle `test-collection`.
4. Test Add Product, Edit Product, Save, Delete, Excel Export, `/new`, `/new/collections`, `/new/search?q=SA`, `/new/products/sa-18278`, and `/new/enquiry`.

## Storage and safety

V2 now uses a **local JSON development store** at `.sparesco-v2-local/products.json` (created on first save). This deliberately fixes the previous `getRequestContext()` crash under ordinary `npm run dev`, without touching D1 or existing production data. Add `.sparesco-v2-local/` to `.gitignore` before any commit. Writes and V2 reads are disabled in production. **Do not deploy this build.**

## What remains before an A–Z production release

This is a substantial local rebuild, **not** a verified production-ready A–Z delivery. The storefront is newly styled in the existing Sparesco palette, not a pixel-exact copy of the current live site. Image URLs and alt text can be edited; binary uploads to R2 are not yet wired. The admin is deliberately local-only and not authenticated; it must not be deployed. An authenticated D1/R2 production adapter, exact storefront UI integration, cache and SEO migration checks, and integration tests are required before release. Raw Excel columns are preserved and editable, but editing a raw column does not automatically remap every derived variant field; use the variant editor for fields that must immediately reflect on the storefront. The export synchronizes key mapped columns; other raw columns are exported from preserved source rows.

## Design intent

One authoritative V2 product record drives local homepage, collections, PDP, related products, enquiry list and search. There is no manual search-index or collection-index update. Existing production routes and SEO remain untouched.
