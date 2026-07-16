const { openDb } = require("./db");

const db = openDb();

const result =
  db.prepare(`
    UPDATE products
    SET
      status = 'pending',
      last_error = NULL
    WHERE status = 'failed'
  `).run();

console.log(
  `Moved ${result.changes} failed products back to pending.`
);

db.close();

console.log(
  "Now run: node scripts/importer/upload.js"
);
