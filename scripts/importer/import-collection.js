const fs = require("fs");
const path = require("path");

const { slugify, productKey } = require("./utils");
const { readExcelFiles } = require("./excel-reader");
const { buildProducts } = require("./product-builder");
const { uploadProductImages } = require("./image-uploader");
const { readJson, uploadJson } = require("./r2-client");
const { mergeProduct, cleanProduct } = require("./duplicate-engine");
const { createReportFolder, writeReports } = require("./report-builder");
const progress = require("./progress");

const CONCURRENCY = 20;

function getExcelFiles(collectionFolder) {
  return fs
    .readdirSync(collectionFolder)
    .filter((file) => file.toLowerCase().endsWith(".xlsx"))
    .map((file) => path.join(collectionFolder, file));
}

async function getExistingProduct(handle) {
  try {
    return await readJson(productKey(handle));
  } catch {
    return null;
  }
}

async function importCollection(collectionFolder, index, total) {
  const collectionName = path.basename(collectionFolder);
  const collectionHandle = slugify(collectionName);

  progress.section(`Collection ${index}/${total}: ${collectionName}`);

  const excelFiles = getExcelFiles(collectionFolder);

  if (!excelFiles.length) {
    progress.info("No Excel files found. Skipped.");
    return [];
  }

  progress.info(`Excel files: ${excelFiles.length}`);

  const rows = readExcelFiles(excelFiles);
  progress.success(`Rows read: ${rows.length}`);

  const products = buildProducts(rows, collectionName);
  progress.success(`Products built: ${products.length}`);
  progress.info(`Concurrency: ${CONCURRENCY}`);

  const report = {
    duplicates: [],
    variantConflicts: [],
    mergedProducts: [],
    failedImages: [],
    summary: [],
  };

  const finalProducts = [];

  let addedProducts = 0;
  let mergedProducts = 0;
  let completed = 0;
  let cursor = 0;

  async function processProduct(product) {
    let finalProduct = cleanProduct(product);
    addedProducts++;

    const failedImages = await uploadProductImages(finalProduct);
    report.failedImages.push(...failedImages);

    await uploadJson(productKey(finalProduct.handle), finalProduct);

    finalProducts.push(finalProduct);
  }

  async function worker() {
    while (cursor < products.length) {
      const product = products[cursor++];
      await processProduct(product);
      completed++;
      progress.bar(completed, products.length, "Products");
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(CONCURRENCY, products.length) },
      () => worker()
    )
  );

  report.summary.push(
    { metric: "Collection", value: collectionName },
    { metric: "Collection Handle", value: collectionHandle },
    { metric: "Excel Files", value: excelFiles.length },
    { metric: "Rows", value: rows.length },
    { metric: "Products Built", value: products.length },
    { metric: "Products Added", value: addedProducts },
    { metric: "Products Merged", value: mergedProducts },
    { metric: "Duplicate Rows", value: report.duplicates.length },
    { metric: "Variant Conflicts", value: report.variantConflicts.length },
    { metric: "Failed Images", value: report.failedImages.length }
  );

  const reportFolder = createReportFolder(collectionFolder);
  writeReports(reportFolder, report);

  progress.success(`Completed: ${collectionName}`);
  progress.info(`Products: ${finalProducts.length}`);
  progress.info(`Reports: ${reportFolder}`);

  return finalProducts;
}

module.exports = {
  importCollection,
};