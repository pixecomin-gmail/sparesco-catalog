SPARESCO PRODUCT STUDIO — IMAGE + EXCEL UPDATE

Copy app/admin/product-studio into your existing project, replacing ONLY that directory. No existing APIs or original admin files are changed.

Fixes: catalogue thumbnail URL resolution in listing and editor; Excel Import and Export buttons.

Import uses the existing lib/admin/excel-product-import.ts parser and /api/admin/import. Export uses /api/admin/export and xlsx.

IMPORTANT: Import, saves and deletions affect LIVE R2. Import explicitly requests confirmation. Export may be slow for large catalogues.

Run npm run build before committing. Keep the existing AdminHeader.tsx navigation link.

If images still fail, check NEXT_PUBLIC_R2_PUBLIC_URL and the actual imageFolder/collection in the returned API payload; this patch does not rewrite stored image data.
