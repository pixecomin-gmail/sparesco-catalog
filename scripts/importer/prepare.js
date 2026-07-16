const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

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

const {
  safeReadJson,
} = require("./r2-client");

const {
  heading,
  bar,
} = require("./progress");

function ensureReportsDir() {
  if (!fs.existsSync(config.REPORTS_DIR)) {
    fs.mkdirSync(config.REPORTS_DIR, {
      recursive: true,
    });
  }
}

function getFolders() {
  return fs
    .readdirSync(config.IMPORTS_DIR, {
      withFileTypes: true,
    })
    .filter((item) => item.isDirectory())
    .filter((item) => item.name.toLowerCase() !== "reports")
    .map((item) => path.join(config.IMPORTS_DIR, item.name))
    .filter((folder) =>
      fs
        .readdirSync(folder)
        .some((file) =>
          file.toLowerCase().endsWith(".xlsx")
        )
    )
    .sort((a, b) => a.localeCompare(b));
}

function getExcelFiles(folder) {
  return fs
    .readdirSync(folder)
    .filter((file) =>
      file.toLowerCase().endsWith(".xlsx")
    )
    .map((file) => path.join(folder, file))
    .sort((a, b) => a.localeCompare(b));
}

function firstSource(product) {
  return product?.sources?.[0] || {};
}

function detectHandleCollisions(products) {
  const byHandle = new Map();
  const collisions = [];

  for (const product of products) {
    const handle = slugify(product.handle);
    const canonicalKey = canonicalize(
      product.canonicalKey || product.handle
    );

    if (!byHandle.has(handle)) {
      byHandle.set(handle, product);
      continue;
    }

    const first = byHandle.get(handle);
    const firstCanonical = canonicalize(
      first.canonicalKey || first.handle
    );

    if (firstCanonical === canonicalKey) {
      continue;
    }

    const firstSourceData = firstSource(first);
    const laterSourceData = firstSource(product);

    collisions.push({
      "Published Handle": handle,
      "First Canonical Key": firstCanonical,
      "First Collection":
        firstSourceData.collectionName ||
        firstSourceData.collectionHandle ||
        "",
      "First Excel": firstSourceData.excelFile || "",
      "First Row": firstSourceData.sourceRow || "",
      "Later Canonical Key": canonicalKey,
      "Later Collection":
        laterSourceData.collectionName ||
        laterSourceData.collectionHandle ||
        "",
      "Later Excel": laterSourceData.excelFile || "",
      "Later Row": laterSourceData.sourceRow || "",
      "Reason":
        "Two different canonical products produce the same published handle",
      "Required Action":
        "Change one Handle in Excel, then run prepare again",
    });
  }

  return collisions;
}

function writeHandleCollisionReport(rows) {
  ensureReportsDir();

  const filePath = path.join(
    config.REPORTS_DIR,
    "handle-collisions.xlsx"
  );

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(
    rows.length
      ? rows
      : [{ Result: "No handle collisions found" }]
  );

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Handle Collisions"
  );

  XLSX.writeFile(workbook, filePath);

  return filePath;
}

async function main() {
  const redo =
    process.argv.includes("--redo");

  const db = openDb();

  heading("PREPARE SQLITE STAGING");

  if (redo) {
    db.exec(`
      DELETE FROM products;
      DELETE FROM collections;
      DELETE FROM failed_images;
    `);

    console.log(
      "Existing local staging data cleared."
    );
  }

  const folders = getFolders();
  const allProducts = [];
  let totalRows = 0;

  for (
    let folderIndex = 0;
    folderIndex < folders.length;
    folderIndex++
  ) {
    const folder =
      folders[folderIndex];

    const collectionName =
      path.basename(folder);

    const files =
      getExcelFiles(folder);

    console.log(
      `Collection ${folderIndex + 1}/${folders.length}: ` +
        collectionName
    );

    for (
      let fileIndex = 0;
      fileIndex < files.length;
      fileIndex++
    ) {
      console.log(
        `  File ${fileIndex + 1}/${files.length}: ` +
          path.basename(files[fileIndex])
      );
    }

    const rows =
      readExcelFiles(files);

    const products =
      buildProducts(
        rows,
        collectionName
      );

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
          canonicalize(
            product.canonicalKey ||
              product.handle
          )
        )
        .filter(Boolean)
    ),
  ];

  console.log("");
  let cloudRegistry = new Map();

  if (redo) {
    console.log(
      "Redo mode: Cloudflare duplicate registry ignored for a clean rebuild."
    );
  } else {
    console.log(
      "Loading Cloudflare duplicate registry..."
    );

    cloudRegistry =
      await loadRegistryForCanonicalKeys(
        canonicalKeys
      );
  }

  const mergedByCanonical =
    new Map();

  let currentDuplicates = 0;
  let cloudDuplicates = 0;

  for (
    let index = 0;
    index < allProducts.length;
    index++
  ) {
    const incoming =
      allProducts[index];

    const canonicalKey =
      canonicalize(
        incoming.canonicalKey ||
          incoming.handle
      );

    let firstProduct =
      mergedByCanonical.get(
        canonicalKey
      );

    if (!firstProduct) {
      const cloudEntry =
        getRegistryEntry(
          cloudRegistry,
          canonicalKey
        );

      if (cloudEntry?.publishedHandle) {
        const cloudProduct =
          await safeReadJson(
            productKey(
              cloudEntry.publishedHandle
            ),
            null
          );

        if (cloudProduct) {
          cloudProduct.canonicalKey =
            canonicalKey;

          cloudProduct.sources =
            cloudProduct.sources ||
            cloudEntry.sources ||
            [];

          mergeTagsOnly(
            cloudProduct,
            incoming
          );

          mergedByCanonical.set(
            canonicalKey,
            cloudProduct
          );

          cloudDuplicates++;

          bar(
            "Merging tags",
            index + 1,
            allProducts.length
          );

          continue;
        }
      }

      firstProduct =
        JSON.parse(
          JSON.stringify(incoming)
        );

      mergedByCanonical.set(
        canonicalKey,
        firstProduct
      );
    } else {
      mergeTagsOnly(
        firstProduct,
        incoming
      );

      currentDuplicates++;
    }

    bar(
      "Merging tags",
      index + 1,
      allProducts.length
    );
  }

  const finalProducts =
    Array.from(
      mergedByCanonical.values()
    );

  /*
   * Critical safety check:
   * SQLite uses handle as the primary key. Two different canonical
   * products must never silently overwrite one another.
   */
  const handleCollisions =
    detectHandleCollisions(finalProducts);

  if (handleCollisions.length) {
    const collisionReport =
      writeHandleCollisionReport(
        handleCollisions
      );

    db.close();

    console.log("");
    console.error(
      `STOPPED: ${handleCollisions.length} handle collision(s) found.`
    );
    console.error(
      `Report: ${collisionReport}`
    );
    console.error(
      "Change one conflicting Handle in Excel, then run prepare again."
    );

    process.exitCode = 1;
    return;
  }

  const upsertProduct =
    db.prepare(`
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
        canonical_key =
          excluded.canonical_key,

        product_json =
          excluded.product_json,

        status = CASE
          WHEN products.product_json =
               excluded.product_json
            THEN products.status
          ELSE 'pending'
        END,

        attempts = CASE
          WHEN products.product_json =
               excluded.product_json
            THEN products.attempts
          ELSE 0
        END,

        last_error = CASE
          WHEN products.product_json =
               excluded.product_json
            THEN products.last_error
          ELSE NULL
        END,

        uploaded_at = CASE
          WHEN products.product_json =
               excluded.product_json
            THEN products.uploaded_at
          ELSE NULL
        END,

        updated_at =
          excluded.updated_at
    `);

  const transaction =
    db.transaction((products) => {
      const now =
        new Date().toISOString();

      for (const product of products) {
        upsertProduct.run({
          handle:
            slugify(product.handle),

          canonical_key:
            canonicalize(
              product.canonicalKey ||
                product.handle
            ),

          product_json:
            JSON.stringify(product),

          updated_at:
            now,
        });
      }
    });

  transaction(finalProducts);

  /*
   * Verify that every final product was actually stored.
   * This prevents any future silent count mismatch.
   */
  const storedCount =
    Number(
      db.prepare(
        "SELECT COUNT(*) AS count FROM products"
      ).get().count || 0
    );

  if (storedCount !== finalProducts.length) {
    db.close();

    throw new Error(
      `SQLite verification failed: expected ${finalProducts.length} ` +
      `products, but stored ${storedCount}.`
    );
  }

  const stats =
    db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(
          CASE WHEN status = 'pending'
          THEN 1 ELSE 0 END
        ) AS pending,
        SUM(
          CASE WHEN status = 'completed'
          THEN 1 ELSE 0 END
        ) AS completed,
        SUM(
          CASE WHEN status = 'failed'
          THEN 1 ELSE 0 END
        ) AS failed
      FROM products
    `).get();

  console.log("");
  console.log(`Rows read: ${totalRows}`);
  console.log(
    `Products before duplicate handling: ` +
      `${allProducts.length}`
  );
  console.log(
    `Unique canonical products staged: ` +
      `${finalProducts.length}`
  );
  console.log(
    `SQLite products verified: ` +
      `${storedCount}`
  );
  console.log(
    `Current duplicates merged by tags: ` +
      `${currentDuplicates}`
  );
  console.log(
    `Cloudflare duplicates merged by tags: ` +
      `${cloudDuplicates}`
  );
  console.log(`Pending: ${stats.pending}`);
  console.log(
    `Completed retained: ` +
      `${stats.completed}`
  );
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
