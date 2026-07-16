const fs = require("fs");
const path = require("path");
const readline = require("readline");

const config = require("./config");
const { readExcelFiles } = require("./excel-reader");
const { buildProducts } = require("./product-builder");
const { mergeProducts } = require("./merge-engine");
const { productKey, slugify } = require("./utils");
const { uploadJson, readJson } = require("./r2-client");
const {
  mapLimit,
  loadExistingImageKeys,
  uploadProductImages,
} = require("./image-uploader");
const {
  loadCheckpoint,
  saveCheckpoint,
  clearCheckpoint,
} = require("./checkpoint");
const { publishAll } = require("./publisher");
const { writeRunReports } = require("./report-builder");

const READ_CONCURRENCY = Number(
  process.env.IMPORT_READ_CONCURRENCY || 30
);

function getCollectionFolders() {
  return fs
    .readdirSync(config.IMPORTS_DIR, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .filter((item) => item.name.toLowerCase() !== "reports")
    .map((item) => path.join(config.IMPORTS_DIR, item.name))
    .filter((folder) =>
      fs
        .readdirSync(folder)
        .some((file) => file.toLowerCase().endsWith(".xlsx"))
    )
    .sort((a, b) => a.localeCompare(b));
}

function getExcelFiles(folder) {
  return fs
    .readdirSync(folder)
    .filter((file) => file.toLowerCase().endsWith(".xlsx"))
    .map((file) => path.join(folder, file))
    .sort((a, b) => a.localeCompare(b));
}

function parseFlags() {
  const args = new Set(process.argv.slice(2));

  return {
    redo: args.has("--redo"),
    skipImages: args.has("--skip-images"),
    noPublish: args.has("--no-publish"),
  };
}

function drawProgress(label, current, total) {
  const width = 28;
  const ratio = total ? current / total : 1;
  const filled = Math.min(width, Math.round(ratio * width));

  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);

  process.stdout.write(
    `${label} [` +
      "█".repeat(filled) +
      "░".repeat(width - filled) +
      `] ${current}/${total}`
  );

  if (current >= total) process.stdout.write("\n");
}

async function hydrateForPublish(products) {
  let completed = 0;

  return mapLimit(
    products,
    READ_CONCURRENCY,
    async (product) => {
      const uploaded = await readJson(productKey(product.handle));
      completed++;
      drawProgress("Loading product JSON", completed, products.length);
      return uploaded;
    }
  );
}

async function main() {
  const startedAt = Date.now();
  const flags = parseFlags();

  if (flags.redo) clearCheckpoint();

  const folders = getCollectionFolders();
  if (!folders.length) throw new Error("No collection folders found.");

  console.log(`Collections found: ${folders.length}`);
  console.log("");

  const allProducts = [];
  let totalRows = 0;

  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i];
    const name = path.basename(folder);
    const excelFiles = getExcelFiles(folder);

    console.log(`Collection ${i + 1}/${folders.length}: ${name}`);

    for (let fileIndex = 0; fileIndex < excelFiles.length; fileIndex++) {
      console.log(
        `  File ${fileIndex + 1}/${excelFiles.length}: ` +
          path.basename(excelFiles[fileIndex])
      );
    }

    const rows = readExcelFiles(excelFiles);
    const products = buildProducts(rows, name);

    totalRows += rows.length;
    allProducts.push(...products);

    console.log(
      `  ${rows.length} rows -> ${products.length} products`
    );
    console.log("");
  }

  const merged = mergeProducts(allProducts);
  const products = merged.products;

  console.log(`Rows: ${totalRows}`);
  console.log(`Products before merge: ${allProducts.length}`);
  console.log(`Unique products after merge: ${products.length}`);
  console.log(
    `Cross-collection duplicates merged: ${merged.duplicates.length}`
  );

  const checkpoint = loadCheckpoint();
  const completed = new Set(checkpoint.completedHandles || []);
  const pending = products.filter(
    (product) => !completed.has(product.handle)
  );

  console.log(`Already completed: ${completed.size}`);
  console.log(`Pending uploads: ${pending.length}`);

  const collectionHandles = [
    ...new Set(
      products.map((product) =>
        slugify(product.imageFolder || product.collection)
      )
    ),
  ];

  const existingImages = flags.skipImages
    ? new Map(
        collectionHandles.map((handle) => [handle, new Set()])
      )
    : await loadExistingImageKeys(collectionHandles);

  const failedImages = [];
  let processedThisRun = 0;

  await mapLimit(
    pending,
    config.CONCURRENCY.products,
    async (product) => {
      if (!flags.skipImages) {
        const failures = await uploadProductImages(
          product,
          existingImages
        );

        failedImages.push(...failures);
      }

      await uploadJson(productKey(product.handle), product);

      completed.add(product.handle);
      processedThisRun++;

      drawProgress(
        "Product uploads",
        processedThisRun,
        pending.length
      );

      if (processedThisRun % 100 === 0) {
        checkpoint.completedHandles = Array.from(completed);
        saveCheckpoint(checkpoint);
      }
    }
  );

  checkpoint.completedHandles = Array.from(completed);
  saveCheckpoint(checkpoint);

  if (!flags.noPublish) {
    console.log("");
    console.log("Loading final uploaded product JSONs...");
    const uploadedProducts = await hydrateForPublish(products);
    await publishAll(uploadedProducts);
  } else {
    console.log("");
    console.log("Website index publish skipped (--no-publish).");
  }

  const reportFolder = writeRunReports({
    duplicates: merged.duplicates,
    failedImages,
    summary: [
      { metric: "Collections", value: folders.length },
      { metric: "Rows", value: totalRows },
      { metric: "Products Before Merge", value: allProducts.length },
      { metric: "Unique Products", value: products.length },
      { metric: "Duplicates Merged", value: merged.duplicates.length },
      { metric: "Uploaded This Run", value: processedThisRun },
      { metric: "Failed Images", value: failedImages.length },
      {
        metric: "Published",
        value: flags.noPublish ? "No" : "Yes",
      },
    ],
  });

  if (
    completed.size === products.length &&
    !flags.noPublish
  ) {
    clearCheckpoint();
  }

  console.log("");
  console.log("DONE");
  console.log(
    `Completed total: ${completed.size}/${products.length}`
  );
  console.log(`Reports: ${reportFolder}`);
  console.log(
    `Total time: ${((Date.now() - startedAt) / 1000).toFixed(1)}s`
  );
}

main().catch((error) => {
  console.error("");
  console.error("IMPORT FAILED");
  console.error(error);
  process.exit(1);
});
