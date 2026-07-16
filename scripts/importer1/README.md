# Sparesco Importer V3

## Install dependency

```powershell
npm install better-sqlite3
```

The project should already contain:

```powershell
npm install @aws-sdk/client-s3 dotenv xlsx
```

## Replace the importer folder

```powershell
Rename-Item scripts\importer scripts\importer-old
```

Extract this ZIP into:

```text
scripts/importer/
```

## Recommended .env.local values

```env
IMPORT_PRODUCT_CONCURRENCY=8
IMPORT_IMAGE_CONCURRENCY=8
IMPORT_PUBLISH_CONCURRENCY=12
IMPORT_PRODUCT_RETRIES=3
IMPORT_REQUEST_RETRIES=6
```

## Workflow

### 1. Scan duplicate candidates

```powershell
node scripts/importer/scan-duplicates.js
```

Report:

```text
.import-state/reports/duplicate-review.xlsx
```

It compares:

- uppercase/lowercase
- spaces
- hyphens
- underscores
- punctuation differences

using a canonical alphanumeric key.

Review the report and manually update the Excel files/tags.

### 2. Prepare SQLite staging

Fresh preparation:

```powershell
node scripts/importer/prepare.js --redo
```

Later incremental preparation:

```powershell
node scripts/importer/prepare.js
```

Unchanged completed products remain completed. Changed products return to pending.

### 3. Upload pending products and images

```powershell
node scripts/importer/upload.js
```

Safe to stop with Ctrl+C. Run the same command again to resume.

### 4. Check status

```powershell
node scripts/importer/status.js
```

### 5. Retry failed products

```powershell
node scripts/importer/retry-failed.js
node scripts/importer/upload.js
```

### 6. Publish once

```powershell
node scripts/importer/publish.js
```

This publishes:

- catalog index
- catalog pages
- collection pages
- filters
- search index
- search shards
- handle registry
- permanent duplicate registry
- statistics

The duplicate registry is stored at:

```text
catalog/duplicate-registry/
```

Future duplicate scans download only the required registry shards.

## Important

Do not delete the live R2 catalog until this importer has passed a full test.
