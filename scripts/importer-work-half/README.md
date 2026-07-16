# Sparesco bulk importer

This importer is designed for a full clean rebuild of the catalogue.

## Important

1. Rename the current folder:

```powershell
Rename-Item scripts\importer scripts\importer-old
```

2. Extract this ZIP and place the extracted files in:

```text
scripts/importer/
```

3. Do not delete R2 yet. First test the new importer with the existing R2 data.

## Install dependencies

The project should already contain these packages:

```powershell
npm install @aws-sdk/client-s3 dotenv xlsx
```

## First test without publishing website indexes

This uploads/resumes product JSON and images but leaves the current website indexes unchanged:

```powershell
node scripts/importer/import-all.js --no-publish
```

To start the upload checkpoint from zero:

```powershell
node scripts/importer/import-all.js --redo --no-publish
```

## Publish website after uploads complete

```powershell
node scripts/importer/publish-only.js
```

## Full run

Uploads products/images and publishes all indexes once at the end:

```powershell
node scripts/importer/import-all.js
```

## Resume

Run the same command again:

```powershell
node scripts/importer/import-all.js
```

The local checkpoint is stored in:

```text
.import-state/bulk-import-checkpoint.json
```

## Optional complete R2 reset

Only after you have confirmed the new importer works:

```powershell
node scripts/importer/reset-catalog.js
```

It asks you to type:

```text
DELETE CATALOG
```

Or:

```powershell
node scripts/importer/reset-catalog.js --yes
```

This deletes the entire `catalog/` prefix, including product JSON, images, indexes, search shards, registry and reports.

## Why this is faster

- All Excel files are read and merged locally.
- Duplicate handles are merged across collections.
- Manually added tags are retained.
- Products and images upload without rebuilding website indexes each batch.
- Existing image keys are listed once per collection.
- Website indexes are published only once at the end.
- Registry shards are built once at the end.
