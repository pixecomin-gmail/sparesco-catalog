const fs = require("fs");
const path = require("path");

const config = require("./config");
const { openDb } = require("./db");
const { readExcelFiles } = require("./excel-reader");
const { buildProducts } = require("./product-builder");
const { mergeTagsOnly } = require("./merge-engine");
const {
  slugify,
  canonicalize,
  productKey,
} = require("./utils");
const {
  loadRegistryForCanonicalKeys,
  getRegistryEntry,
} = require("./duplicate-registry");
const { safeReadJson } = require("./r2-client");
const { heading, bar } = require("./progress");

function getFolders() {
  return fs
    .readdirSync(config.IMPORTS_DIR, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .filter((item) => item.name.toLowerCase() !== "reports")
    .map((item) => path.join(config.IMPORTS_DIR, item.name))
    .filter((folder) =>
      fs.readdirSync(folder).some((file) =>
        file.toLowerCase().endsWith(".xlsx")
      )
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

async function main() {
  const redo = process.argv.includes("--redo");
  const db = openDb();

  heading("PREPARE SQLITE STAGING");

  if (redo) {
    db.exec(`
      DELETE FROM products;
      DELETE FROM collections;
      DELETE FROM failed_images;
    `);

    console.log("Existing local staging data cleared.");
  }

  const folders = getFolders();
  const allProducts = [];
  let totalRows = 0;

  for (let folderIndex = 0; folderIndex < folders.length; folderIndex++) {
    const folder = folders[folderIndex];
    const collectionName = path.basename(folder);
    const files = getExcelFiles(folder);

    console.log(
      `Collection ${folderIndex + 1}/${folders.length}: ${collectionName}`
    );

    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      console.log(
        `  File ${fileIndex + 1}/${files.length}: ${path.basename(files[fileIndex])}`
      );
    }

    const rows = readExcelFiles(files);
    const products = buildProducts(rows, collectionName);

    totalRows += rows.length;
    allProducts.push(...products);

    db.prepare(`
      INSERT INTO collections (
        handle,
        title,
        excel_files,
        row_count,
        product_count,
        prepared_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(handle) DO UPDATE SET
        title = excluded.title,
        excel_files = excluded.excel_files,
        row_count = excluded.row_count,
        product_count = excluded.product_count,
        prepared_at = excluded.prepared_at
    `).run(
      slugify(collectionName),
      collectionName,
      files.length,
      rows.length,
      products.length,
      new Date().toISOString()
    );
  }

  const canonicalKeys = [
    ...new Set(
      allProducts
        .map((product) =>
          canonicalize(product.canonicalKey || product.handle)
        )
        .filter(Boolean)
    ),
  ];

  console.log("");
  console.log("Loading Cloudflare duplicate registry...");

  const cloudRegistry =
    await loadRegistryForCanonicalKeys(canonicalKeys);

  const mergedByCanonical = new Map();
  let currentDuplicateCount = 0;
  let cloudDuplicateCount = 0;

  for (let index = 0; index < allProducts.length; index++) {
    const incoming = allProducts[index];
    const canonicalKey = canonicalize(
      incoming.canonicalKey || incoming.handle
    );

    let firstProduct = mergedByCanonical.get(canonicalKey);

    if (!firstProduct) {
      const cloudEntry = getRegistryEntry(
        cloudRegistry,
        canonicalKey
      );

      if (cloudEntry?.publishedHandle) {
        const cloudProduct = await safeReadJson(
          productKey(cloudEntry.publishedHandle),
          null
        );

        if (cloudProduct) {
          cloudProduct.canonicalKey = canonicalKey;
          cloudProduct.sources = cloudProduct.sources || cloudEntry.sources || [];

          mergeTagsOnly(cloudProduct, incoming);

          mergedByCanonical.set(
            canonicalKey,
            cloudProduct
          );

          cloudDuplicateCount++;

          bar(
            "Merging tags",
            index + 1,
            allProducts.length
          );

          continue;
        }
      }

      firstProduct = JSON.parse(
        JSON.stringify(incoming)
      );

      mergedByCanonical.set(
        canonicalKey,
        firstProduct
      );
    } else {
      mergeTagsOnly(firstProduct, incoming);
      currentDuplicateCount++;
    }

    bar(
      "Merging tags",
      index + 1,
      allProducts.length
    );
  }

  const upsertProduct = db.prepare(`
    INSERT INTO products (
      handle,
      canonical_key,
      product_json,
      status,
      attempts,
      last_error,
      uploaded_at,
      updated_at
    )
    VALUES (
      @handle,
      @canonical_key,
      @product_json,
      'pending',
      0,
      NULL,
      NULL,
      @updated_at
    )
    ON CONFLICT(handle) DO UPDATE SET
      canonical_key = excluded.canonical_key,
      product_json = excluded.product_json,
      status = CASE
        WHEN products.product_json = excluded.product_json
          THEN products.status
        ELSE 'pending'
      END,
      attempts = CASE
        WHEN products.product_json = excluded.product_json
          THEN products.attempts
        ELSE 0
      END,
      last_error = CASE
        WHEN products.product_json = excluded.product_json
          THEN products.last_error
        ELSE NULL
      END,
      uploaded_at = CASE
        WHEN products.product_json = excluded.product_json
          THEN products.uploaded_at
        ELSE NULL
      END,
      updated_at = excluded.updated_at
  `);

  const transaction = db.transaction((products) => {
    const now = new Date().toISOString();

    for (const product of products) {
      upsertProduct.run({
        handle: product.handle,
        canonical_key:
          canonicalize(product.canonicalKey || product.handle),
        product_json: JSON.stringify(product),
        updated_at: now,
      });
    }
  });

  const finalProducts =
    Array.from(mergedByCanonical.values());

  transaction(finalProducts);

  const stats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed
    FROM products
  `).get();

  console.log("");
  console.log(`Rows read: ${totalRows}`);
  console.log(`Products before duplicate handling: ${allProducts.length}`);
  console.log(`Unique canonical products staged: ${finalProducts.length}`);
  console.log(`Current-import duplicates merged by tags: ${currentDuplicateCount}`);
  console.log(`Cloudflare duplicates merged by tags: ${cloudDuplicateCount}`);
  console.log(`Pending: ${stats.pending}`);
  console.log(`Completed retained: ${stats.completed}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`SQLite: ${config.DB_PATH}`);

  db.close();
}

main().catch((error) => {
  console.error("");
  console.error("PREPARE FAILED");
  console.error(error);
  process.exit(1);
});
