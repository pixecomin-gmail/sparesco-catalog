const fs = require("fs");
const path = require("path");

const { slugify, productKey } = require("./utils");
const { readExcelFiles } = require("./excel-reader");
const { buildProducts } = require("./product-builder");
const { uploadProductImages } = require("./image-uploader");
const { uploadJson } = require("./r2-client");
const { cleanProduct } = require("./duplicate-engine");
const { createReportFolder, writeReports } = require("./report-builder");
const { createIncrementalPublisher } = require("./incremental-index");
const {
  loadCheckpoint,
  saveCheckpoint,
  clearCheckpoint,
} = require("./import-checkpoint");
const {
  loadRegistryForHandles,
  getRegistryEntry,
  belongsToCollection,
  commitRegistryProducts,
} = require("./handle-registry");
const progress = require("./progress");

const CONCURRENCY = 5;
const BATCH_SIZE = 10;
const FULL_INDEX_EVERY = 100;

function seconds(ms) {
  return (ms / 1000).toFixed(2);
}

function getExcelFiles(collectionFolder) {
  return fs
    .readdirSync(collectionFolder)
    .filter((file) => file.toLowerCase().endsWith(".xlsx"))
    .map((file) => path.join(collectionFolder, file))
    .sort((a, b) => a.localeCompare(b));
}

async function importCollection(collectionFolder, index, total) {
  const runStartedAt = Date.now();
  const collectionName = path.basename(collectionFolder);
  const collectionHandle = slugify(collectionName);

  progress.section(`Collection ${index}/${total}: ${collectionName}`);

  const excelFiles = getExcelFiles(collectionFolder);

  if (!excelFiles.length) {
    progress.info("No Excel files found. Skipped.");
    return [];
  }

  const excelStartedAt = Date.now();
  const rows = readExcelFiles(excelFiles);
  const excelMs = Date.now() - excelStartedAt;

  const buildStartedAt = Date.now();
  const products = buildProducts(rows, collectionName);
  const buildMs = Date.now() - buildStartedAt;

  const registryStartedAt = Date.now();
  const registry = await loadRegistryForHandles(
    products.map((product) => product.handle)
  );
  const registryLoadMs = Date.now() - registryStartedAt;

  const checkpoint = loadCheckpoint(
    collectionFolder,
    collectionHandle
  );
  const completedSet = new Set(checkpoint.completedHandles || []);

  const report = {
    duplicates: [],
    variantConflicts: [],
    mergedProducts: [],
    failedImages: [],
    summary: [],
  };

  const allowedProducts = [];

  for (const product of products) {
    const existing = getRegistryEntry(registry, product.handle);

    if (existing && !belongsToCollection(existing, collectionHandle)) {
      report.duplicates.push({
        excelFile: product.__sources?.[0]?.excelFile || "",
        sourceRow: product.__sources?.[0]?.sourceRow || "",
        handle: product.handle,
        existingSources: (existing.sources || [])
          .map((source) => `${source.collectionHandle}/${source.excelFile}`)
          .join(", "),
        existingTags: (existing.tags || []).join(", "),
        action: "SKIPPED",
        reason: "Handle already exists in another collection source",
      });
      continue;
    }

    allowedProducts.push(product);
  }

  const pendingProducts = allowedProducts.filter(
    (product) => !completedSet.has(product.handle)
  );

  progress.info(`Excel files: ${excelFiles.length}`);
  progress.success(`Rows read: ${rows.length} (${seconds(excelMs)}s)`);
  progress.success(`Products built: ${products.length} (${seconds(buildMs)}s)`);
  progress.info(`Registry loaded: ${seconds(registryLoadMs)}s`);
  progress.info(`Registry duplicates skipped: ${report.duplicates.length}`);
  progress.info(`Already completed: ${completedSet.size}`);
  progress.info(`Pending: ${pendingProducts.length}`);

  const publisher = await createIncrementalPublisher();
  const importedProducts = [];

  let failedProducts = 0;
  let successfulSinceFullPublish = 0;
  let batchNumber = 0;

  for (let start = 0; start < pendingProducts.length; start += BATCH_SIZE) {
    batchNumber++;
    const batchStartedAt = Date.now();

    const batch = pendingProducts.slice(start, start + BATCH_SIZE);
    const successfulItems = [];
    let cursor = 0;

    const batchTiming = {
      imageDownloadMs: 0,
      imageExistsMs: 0,
      imageUploadMs: 0,
      productJsonMs: 0,
      publishMs: 0,
      registryCommitMs: 0,
      imageCount: 0,
    };

    async function worker() {
      while (cursor < batch.length) {
        const sourceProduct = batch[cursor++];

        try {
          const finalProduct = cleanProduct(sourceProduct);

          const imageResult = await uploadProductImages(finalProduct);
          report.failedImages.push(...imageResult.failedImages);

          batchTiming.imageDownloadMs += imageResult.timing.downloadMs;
          batchTiming.imageExistsMs += imageResult.timing.existsMs;
          batchTiming.imageUploadMs += imageResult.timing.uploadMs;
          batchTiming.imageCount += imageResult.timing.imageCount;

          const jsonStartedAt = Date.now();
          await uploadJson(productKey(finalProduct.handle), finalProduct);
          batchTiming.productJsonMs += Date.now() - jsonStartedAt;

          successfulItems.push({
            product: finalProduct,
            source: sourceProduct.__sources?.[0] || null,
          });
        } catch (error) {
          failedProducts++;

          checkpoint.failedHandles = [
            ...new Set([
              ...(checkpoint.failedHandles || []),
              sourceProduct.handle,
            ]),
          ];

          progress.error(`${sourceProduct.handle}: ${error.message}`);
        }
      }
    }

    await Promise.all(
      Array.from(
        { length: Math.min(CONCURRENCY, batch.length) },
        () => worker()
      )
    );

    if (successfulItems.length) {
      successfulSinceFullPublish += successfulItems.length;
      const forceFull = successfulSinceFullPublish >= FULL_INDEX_EVERY;

      const successfulProducts = successfulItems.map(
        (item) => item.product
      );

      const publishStartedAt = Date.now();
      await publisher.publishBatch(successfulProducts, { forceFull });
      batchTiming.publishMs = Date.now() - publishStartedAt;

      const registryCommitStartedAt = Date.now();
      await commitRegistryProducts(successfulItems, collectionHandle);
      batchTiming.registryCommitMs =
        Date.now() - registryCommitStartedAt;

      for (const product of successfulProducts) {
        completedSet.add(product.handle);
        importedProducts.push(product);
      }

      checkpoint.completedHandles = Array.from(completedSet);
      checkpoint.failedHandles = (
        checkpoint.failedHandles || []
      ).filter((handle) => !completedSet.has(handle));

      saveCheckpoint(collectionFolder, checkpoint);

      if (forceFull) successfulSinceFullPublish = 0;
    }

    const batchMs = Date.now() - batchStartedAt;

    console.log("");
    console.log(
      `Batch ${batchNumber} timing (${batch.length} products, ` +
      `${batchTiming.imageCount} images):`
    );
    console.log(`  Image download:   ${seconds(batchTiming.imageDownloadMs)}s`);
    console.log(`  R2 image exists:  ${seconds(batchTiming.imageExistsMs)}s`);
    console.log(`  R2 image upload:  ${seconds(batchTiming.imageUploadMs)}s`);
    console.log(`  Product JSON:     ${seconds(batchTiming.productJsonMs)}s`);
    console.log(`  Publish indexes:  ${seconds(batchTiming.publishMs)}s`);
    console.log(`  Registry commit:  ${seconds(batchTiming.registryCommitMs)}s`);
    console.log(`  Wall-clock batch: ${seconds(batchMs)}s`);

    progress.bar(
      completedSet.size,
      allowedProducts.length,
      "Products"
    );
  }

  const finalizeStartedAt = Date.now();
  await publisher.finalize();
  const finalizeMs = Date.now() - finalizeStartedAt;

  report.summary.push(
    { metric: "Collection", value: collectionName },
    { metric: "Collection Handle", value: collectionHandle },
    { metric: "Excel Files", value: excelFiles.length },
    { metric: "Rows", value: rows.length },
    { metric: "Products Built", value: products.length },
    { metric: "Registry Duplicates Skipped", value: report.duplicates.length },
    { metric: "Products Imported This Run", value: importedProducts.length },
    { metric: "Products Completed Total", value: completedSet.size },
    { metric: "Failed Products", value: failedProducts },
    { metric: "Failed Images", value: report.failedImages.length }
  );

  const reportFolder = createReportFolder(collectionFolder);
  writeReports(reportFolder, report);

  if (
    completedSet.size === allowedProducts.length &&
    failedProducts === 0
  ) {
    clearCheckpoint(collectionFolder);
  } else {
    saveCheckpoint(collectionFolder, checkpoint);
  }

  progress.success(`Completed run: ${collectionName}`);
  progress.info(`Final index publish: ${seconds(finalizeMs)}s`);
  progress.info(`Total run time: ${seconds(Date.now() - runStartedAt)}s`);
  progress.info(`Imported this run: ${importedProducts.length}`);
  progress.info(`Completed total: ${completedSet.size}/${allowedProducts.length}`);
  progress.info(`Reports: ${reportFolder}`);

  return importedProducts;
}

module.exports = { importCollection };

if (require.main === module) {
  const collectionName = process.argv.slice(2).join(" ").trim();

  if (!collectionName) {
    console.error(
      'Usage: node scripts/importer/import-collection.js "Collection Name"'
    );
    process.exit(1);
  }

  const collectionFolder = path.join(
    process.cwd(),
    "imports",
    collectionName
  );

  if (!fs.existsSync(collectionFolder)) {
    console.error(`Collection folder not found: ${collectionFolder}`);
    process.exit(1);
  }

  importCollection(collectionFolder, 1, 1).catch((error) => {
    console.error("\nCollection import failed:");
    console.error(error);
    process.exit(1);
  });
}
