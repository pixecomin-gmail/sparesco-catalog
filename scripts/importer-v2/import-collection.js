const fs = require("fs");
const path = require("path");

const config = require("./config");
const { slugify, productKey } = require("./utils");
const { readExcelFiles } = require("./excel-reader");
const { buildProducts } = require("./product-builder");
const { uploadProductImages } = require("./image-uploader");
const { readJson, uploadJson } = require("./r2-client");
const { mergeProduct, cleanProduct } = require("./duplicate-engine");
const { createReportFolder, writeReports } = require("./report-builder");

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

async function importCollection(collectionFolder) {
  const collectionName = path.basename(collectionFolder);
  const collectionHandle = slugify(collectionName);

  console.log(`\nImporting: ${collectionName}`);

  const excelFiles = getExcelFiles(collectionFolder);

  if (!excelFiles.length) {
    console.log("No Excel files found. Skipped.");
    return [];
  }

  const rows = readExcelFiles(excelFiles);
  const products = buildProducts(rows, collectionName);

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

  for (const product of products) {
    const existing = await getExistingProduct(product.handle);

    let finalProduct;

    if (existing) {
      const result = mergeProduct(existing, product, collectionName);

      finalProduct = result.product;

      report.duplicates.push(...result.duplicates);
      report.variantConflicts.push(...result.variantConflicts);
      report.mergedProducts.push(...result.mergedProducts);

      mergedProducts++;
    } else {
      finalProduct = cleanProduct(product);
      addedProducts++;
    }

    const failedImages = await uploadProductImages(finalProduct);
    report.failedImages.push(...failedImages);

    await uploadJson(productKey(finalProduct.handle), finalProduct);

    finalProducts.push(finalProduct);
  }

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

  console.log(`Done: ${collectionName}`);
  console.log(`Products: ${finalProducts.length}`);
  console.log(`Report: ${reportFolder}`);

  return finalProducts;
}

module.exports = {
  importCollection,
};