const { openDb } = require("./db");
const { heading } = require("./progress");
const { publishAll } = require("./publisher");

async function main() {
  const db = openDb();

  heading("PUBLISH WEBSITE INDEXES");

  const stats =
    db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(
          CASE WHEN status = 'completed'
          THEN 1 ELSE 0 END
        ) AS completed,
        SUM(
          CASE WHEN status = 'pending'
          THEN 1 ELSE 0 END
        ) AS pending,
        SUM(
          CASE WHEN status = 'failed'
          THEN 1 ELSE 0 END
        ) AS failed
      FROM products
    `).get();

  if (!stats.total) {
    throw new Error(
      "SQLite staging database is empty. Run prepare.js first."
    );
  }

  if (
    stats.completed !==
    stats.total
  ) {
    throw new Error(
      `Cannot publish: ${stats.completed}/${stats.total} completed, ` +
        `${stats.pending} pending, ${stats.failed} failed.`
    );
  }

  console.log(
    `Loading ${stats.total} products from SQLite...`
  );

  const rows =
    db.prepare(`
      SELECT product_json
      FROM products
      WHERE status = 'completed'
      ORDER BY handle
    `).all();

  const products =
    rows.map((row) =>
      JSON.parse(
        row.product_json
      )
    );

  const startedAt =
    Date.now();

  await publishAll(products);

  console.log("");
  console.log(
    `Published ${products.length} products in ` +
      `${((Date.now() - startedAt) / 1000).toFixed(1)}s.`
  );

  db.close();
}

main().catch((error) => {
  console.error("");
  console.error("PUBLISH FAILED");
  console.error(error);
  process.exit(1);
});
