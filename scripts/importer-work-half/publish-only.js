const fs = require("fs");
const path = require("path");
const readline = require("readline");

const config = require("./config");
const { readExcelFiles } = require("./excel-reader");
const { buildProducts } = require("./product-builder");
const { mergeProducts } = require("./merge-engine");
const { productKey } = require("./utils");
const { readJson } = require("./r2-client");
const { publishAll } = require("./publisher");

const READ_CONCURRENCY = Number(
  process.env.IMPORT_READ_CONCURRENCY || 30
);

function getFolders() {
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

async function mapLimit(items, concurrency, worker) {
  let cursor = 0;
  const results = new Array(items.length);

  async function run() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, items.length) },
      () => run()
    )
  );

  return results;
}

async function loadUploadedProducts(products) {
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
  const folders = getFolders();
  const allProducts = [];

  console.log("");
  console.log("==================================================");
  console.log("BUILDING FINAL WEBSITE INDEXES");
  console.log("==================================================");
  console.log(`Collections found: ${folders.length}`);
  console.log("");

  for (let index = 0; index < folders.length; index++) {
    const folder = folders[index];
    const collectionName = path.basename(folder);
    const files = getExcelFiles(folder);

    console.log(
      `Collection ${index + 1}/${folders.length}: ${collectionName}`
    );

    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      console.log(
        `  File ${fileIndex + 1}/${files.length}: ` +
          path.basename(files[fileIndex])
      );
    }

    const rows = readExcelFiles(files);
    const products = buildProducts(rows, collectionName);

    allProducts.push(...products);

    console.log(
      `  ${rows.length} rows -> ${products.length} products`
    );
    console.log("");
  }

  console.log("Merging duplicate handles...");
  const merged = mergeProducts(allProducts);

  console.log(`Products before merge: ${allProducts.length}`);
  console.log(`Unique products after merge: ${merged.products.length}`);
  console.log(
    `Cross-collection duplicates merged: ${merged.duplicates.length}`
  );
  console.log("");
  console.log("Loading uploaded product JSONs (with final image filenames)...");

  const uploadedProducts = await loadUploadedProducts(merged.products);

  await publishAll(uploadedProducts);

  console.log("");
  console.log(
    `Publish-only completed in ` +
      `${((Date.now() - startedAt) / 1000).toFixed(1)}s`
  );
}

main().catch((error) => {
  console.error("");
  console.error("PUBLISH FAILED");
  console.error(error);
  process.exit(1);
});
