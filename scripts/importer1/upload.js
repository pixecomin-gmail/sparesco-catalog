const config = require("./config");
const { openDb } = require("./db");
const {
  productKey,
  slugify,
} = require("./utils");

const { uploadJson } = require("./r2-client");

const {
  mapLimit,
  loadExistingImageKeys,
  uploadProductImages,
} = require("./image-uploader");

const { heading, bar } = require("./progress");

async function main() {
  const db = openDb();

  heading("UPLOAD PRODUCTS AND IMAGES");

  db.prepare(`
    UPDATE products
    SET status = 'pending'
    WHERE status = 'processing'
  `).run();

  const rows = db
    .prepare(`
      SELECT
        handle,
        product_json,
        attempts
      FROM products
      WHERE status = 'pending'
      ORDER BY handle
    `)
    .all();

  if (!rows.length) {
    console.log("No pending products.");
    db.close();
    return;
  }

  const products = rows.map((row) => ({
    row,
    product: JSON.parse(row.product_json),
  }));

  const collectionHandles = [
    ...new Set(
      products.map(({ product }) =>
        slugify(
          product.imageFolder || product.collection
        )
      )
    ),
  ];

  console.log(`Pending products: ${rows.length}`);
  console.log(
    `Product concurrency: ${config.CONCURRENCY.products}`
  );
  console.log(
    `Image concurrency: ${config.CONCURRENCY.images}`
  );

  const existingImages =
    await loadExistingImageKeys(collectionHandles);

  const markProcessing = db.prepare(`
    UPDATE products
    SET
      status = 'processing',
      attempts = attempts + 1,
      last_error = NULL,
      updated_at = ?
    WHERE handle = ?
  `);

  const markCompleted = db.prepare(`
    UPDATE products
    SET
      product_json = ?,
      status = 'completed',
      last_error = NULL,
      uploaded_at = ?,
      updated_at = ?
    WHERE handle = ?
  `);

  const markPending = db.prepare(`
    UPDATE products
    SET
      status = 'pending',
      last_error = ?,
      updated_at = ?
    WHERE handle = ?
  `);

  const markFailed = db.prepare(`
    UPDATE products
    SET
      status = 'failed',
      last_error = ?,
      updated_at = ?
    WHERE handle = ?
  `);

  const logImageFailure = db.prepare(`
    INSERT INTO failed_images (
      handle,
      image_url,
      reason,
      created_at
    )
    VALUES (?, ?, ?, ?)
  `);

  let completed = 0;
  let failed = 0;
  let stopping = false;

  process.on("SIGINT", () => {
    stopping = true;

    console.log(
      "\nStopping safely after active products finish..."
    );
  });

  await mapLimit(
    products,
    config.CONCURRENCY.products,
    async ({ row, product }) => {
      if (stopping) return;

      markProcessing.run(
        new Date().toISOString(),
        product.handle
      );

      try {
        const imageFailures =
          await uploadProductImages(
            product,
            existingImages
          );

        for (const failure of imageFailures) {
          logImageFailure.run(
            failure.handle,
            failure.imageUrl,
            failure.reason,
            new Date().toISOString()
          );
        }

        await uploadJson(
          productKey(product.handle),
          product
        );

        const now = new Date().toISOString();

        markCompleted.run(
          JSON.stringify(product),
          now,
          now,
          product.handle
        );

        completed++;
      } catch (error) {
        const attempts =
          Number(row.attempts || 0) + 1;

        const message =
          error?.message || String(error);

        if (attempts < config.RETRIES.product) {
          markPending.run(
            message,
            new Date().toISOString(),
            product.handle
          );
        } else {
          markFailed.run(
            message,
            new Date().toISOString(),
            product.handle
          );

          failed++;
        }
      }

      bar(
        "Product uploads",
        completed + failed,
        rows.length,
        `completed ${completed}, failed ${failed}`
      );
    }
  );

  db.prepare(`
    UPDATE products
    SET status = 'pending'
    WHERE status = 'processing'
  `).run();

  const stats = db
    .prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed
      FROM products
    `)
    .get();

  console.log("");
  console.log(`Total: ${stats.total}`);
  console.log(`Completed: ${stats.completed}`);
  console.log(`Pending: ${stats.pending}`);
  console.log(`Failed: ${stats.failed}`);

  db.close();
}

main().catch((error) => {
  console.error("");
  console.error("UPLOAD FAILED");
  console.error(error);
  process.exit(1);
});
