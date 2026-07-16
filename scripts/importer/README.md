# Sparesco Importer — One-Shot Update

## Requirements

Node 22.23.1 or newer:

```powershell
nvm use 22.23.1
```

No SQLite npm package is required. This importer uses `node:sqlite`.

## Replace importer

Rename the old folder:

```powershell
Rename-Item scripts\importer scripts\importer-old
```

Extract this ZIP into:

```text
scripts/importer/
```

## Workflow

### 1. Duplicate report

```powershell
node scripts/importer/scan-duplicates.js
```

Report:

```text
.import-state\reports\duplicate-review.xlsx
```

Duplicate behavior:

- canonical match ignores spaces, hyphens, underscores, punctuation and letter case
- part number is preferred, then handle
- first product is kept
- only tags are merged
- all other duplicate fields are ignored
- every duplicate is written to the Excel report

### 2. Prepare

```powershell
node scripts/importer/prepare.js --redo
```

### 3. Upload

```powershell
node scripts/importer/upload.js
```

The upload dashboard displays:

- image-cache progress
- collection progress
- Excel progress
- product progress
- current collection
- current Excel
- current product handle

### Image manifests

The first run creates one manifest per collection:

```text
catalog/image-manifests/<collection>.json
```

If no manifest exists, that collection is scanned once to bootstrap it.

Future runs read the manifest and do not list all R2 images again.

### 4. Status

```powershell
node scripts/importer/status.js
```

### 5. Retry failures

```powershell
node scripts/importer/retry-failed.js
node scripts/importer/upload.js
```

### 6. Publish once

```powershell
node scripts/importer/publish.js
```

## Recommended environment values

```env
IMPORT_PRODUCT_CONCURRENCY=8
IMPORT_IMAGE_CONCURRENCY=8
IMPORT_PUBLISH_CONCURRENCY=12
IMPORT_PRODUCT_RETRIES=3
IMPORT_REQUEST_RETRIES=6
```
