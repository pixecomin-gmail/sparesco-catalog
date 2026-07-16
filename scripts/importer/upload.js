const config = require("./config");
const { openDb } = require("./db");

const {
  productKey,
  slugify,
} = require("./utils");

const {
  uploadJson,
} = require("./r2-client");

const {
  mapLimit,
  uploadProductImages,
} = require("./image-uploader");

const {
  loadManifests,
  saveChangedManifests,
} = require("./image-manifest");

const {
  heading,
  Dashboard,
} = require("./progress");

async function main() {
  const db = openDb();

  heading("UPLOAD PRODUCTS AND IMAGES");

  db.prepare(`
    UPDATE products
    SET status = 'pending'
    WHERE status = 'processing'
  `).run();

  const rows = db.prepare(`
    SELECT
      handle,
      product_json,
      attempts
    FROM products
    WHERE status = 'pending'
    ORDER BY handle
  `).all();

  if (!rows.length) {
    console.log("No pending products.");
    db.close();
    return;
  }

  const products = rows.map((row) => ({
    row,
    product:
      JSON.parse(row.product_json),
  }));

  const collectionHandles = [
    ...new Set(
      products.map(({ product }) =>
        slugify(
          product.imageFolder ||
            product.collection
        )
      )
    ),
  ];

  const dashboard =
    new Dashboard();

  dashboard.update({
    stage: "Loading image cache",
    cacheCurrent: 0,
    cacheTotal:
      collectionHandles.length,

    collectionCurrent: 0,
    collectionTotal:
      collectionHandles.length,

    excelCurrent: 0,
    excelTotal: 0,

    productCurrent: 0,
    productTotal: rows.length,
  });

  const manifests =
    await loadManifests(
      collectionHandles,
      (current, total) => {
        dashboard.update({
          stage: "Loading image cache",
          cacheCurrent: current,
          cacheTotal: total,
        });
      }
    );

  const markProcessing =
    db.prepare(`
      UPDATE products
      SET
        status = 'processing',
        attempts = attempts + 1,
        last_error = NULL,
        updated_at = ?
      WHERE handle = ?
    `);

  const markCompleted =
    db.prepare(`
      UPDATE products
      SET
        product_json = ?,
        status = 'completed',
        last_error = NULL,
        uploaded_at = ?,
        updated_at = ?
      WHERE handle = ?
    `);

  const markPending =
    db.prepare(`
      UPDATE products
      SET
        status = 'pending',
        last_error = ?,
        updated_at = ?
      WHERE handle = ?
    `);

  const markFailed =
    db.prepare(`
      UPDATE products
      SET
        status = 'failed',
        last_error = ?,
        updated_at = ?
      WHERE handle = ?
    `);

  const logImageFailure =
    db.prepare(`
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

    dashboard.update({
      stage:
        "Stopping safely after active uploads",
    });
  });

  await mapLimit(
    products,
    config.CONCURRENCY.products,
    async ({ row, product }) => {
      if (stopping) return;

      const source =
        product.sources?.[0] || {};

      const collectionIndex =
        Math.max(
          0,
          collectionHandles.indexOf(
            slugify(
              product.imageFolder ||
                product.collection
            )
          )
        ) + 1;

      dashboard.update({
        stage: "Uploading",
        collectionCurrent:
          collectionIndex,
        collectionTotal:
          collectionHandles.length,

        excelCurrent: 1,
        excelTotal: 1,

        currentCollection:
          source.collectionName ||
          source.collectionHandle ||
          product.collection ||
          "-",

        currentExcel:
          source.excelFile ||
          "-",

        currentHandle:
          product.handle,
      });

      markProcessing.run(
        new Date().toISOString(),
        product.handle
      );

      try {
        const imageFailures =
          await uploadProductImages(
            product,
            manifests
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

        const now =
          new Date().toISOString();

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
          error?.message ||
          String(error);

        if (
          attempts <
          config.RETRIES.product
        ) {
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

      dashboard.update({
        stage: "Uploading",
        productCurrent:
          completed + failed,
        productTotal:
          rows.length,
        completed,
        failed,
      });
    }
  );

  dashboard.update({
    stage: "Saving image manifests",
  });

  await saveChangedManifests(
    manifests
  );

  db.prepare(`
    UPDATE products
    SET status = 'pending'
    WHERE status = 'processing'
  `).run();

  dashboard.update({
    stage: "Upload complete",
    productCurrent:
      completed + failed,
    productTotal:
      rows.length,
    completed,
    failed,
  });

  console.log("");

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

  console.log(`Total: ${stats.total}`);
  console.log(
    `Completed: ${stats.completed}`
  );
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
