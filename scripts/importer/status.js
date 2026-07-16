const { openDb } = require("./db");
const { heading } = require("./progress");

function number(value) {
  return Number(value || 0)
    .toLocaleString("en-IN");
}

function main() {
  const db = openDb();

  heading("IMPORT STATUS");

  const stats =
    db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(
          CASE WHEN status = 'pending'
          THEN 1 ELSE 0 END
        ) AS pending,
        SUM(
          CASE WHEN status = 'processing'
          THEN 1 ELSE 0 END
        ) AS processing,
        SUM(
          CASE WHEN status = 'completed'
          THEN 1 ELSE 0 END
        ) AS completed,
        SUM(
          CASE WHEN status = 'failed'
          THEN 1 ELSE 0 END
        ) AS failed,
        SUM(attempts) AS attempts
      FROM products
    `).get();

  const collections =
    db.prepare(
      "SELECT COUNT(*) AS count FROM collections"
    ).get().count;

  const failedImages =
    db.prepare(
      "SELECT COUNT(*) AS count FROM failed_images"
    ).get().count;

  console.log(
    `Collections prepared: ${number(collections)}`
  );
  console.log(
    `Products total:       ${number(stats.total)}`
  );
  console.log(
    `Completed:            ${number(stats.completed)}`
  );
  console.log(
    `Pending:              ${number(stats.pending)}`
  );
  console.log(
    `Processing:           ${number(stats.processing)}`
  );
  console.log(
    `Failed:               ${number(stats.failed)}`
  );
  console.log(
    `Total attempts:       ${number(stats.attempts)}`
  );
  console.log(
    `Failed images logged: ${number(failedImages)}`
  );

  db.close();
}

main();
