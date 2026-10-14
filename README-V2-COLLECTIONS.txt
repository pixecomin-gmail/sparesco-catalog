SPARESCO V2 COLLECTION MANAGEMENT PATCH

Scope: ONLY /new admin, /new collections, /api/new, lib/v2. No existing live storefront or SEO files.

What this implements:
- Compact Collections admin listing and create/edit/delete editor
- Manual collection membership with product search and multi-select
- Automated collections with all/any rules (tag, vendor, product type, title; equals/contains)
- Collection title, description, handle, image from local upload or external HTTPS URL via V2 R2 upload API
- Collection detail and listing pages use saved titles/descriptions and automatic membership
- Export and Import header icons use matched outline SVG styling
- Collection data stored in .sparesco-v2-local/collections.json (development only)
- Legacy products with collectionHandle still work

Important limitations:
- This is LOCAL V2 development functionality, NOT a Cloudflare production-ready database migration.
- Cloudflare R2 image upload needs existing local .env.local R2 credentials and network access.
- Browser and Next.js production build not verified in this environment (dependencies absent).
- This patch does not modify live website /collections routes or production data.
- Existing collection handle references may require review when renaming a collection.

Installation:
1. Back up current app/new, app/api/new and lib/v2 files.
2. Extract this ZIP into sparesco-catalog-main with overwrite.
3. Run npm run build, then npm run dev.
4. Open http://localhost:3000/new/admin/products and choose Collections.
5. Test manual create/save, automated rules, image upload and delete locally.
Do not deploy to production.
