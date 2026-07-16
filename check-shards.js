const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync(".import-state/catalog-import.sqlite");

const map = {};

const stmt = db.prepare(
  "SELECT handle FROM products WHERE status='completed'"
);

for (const row of stmt.iterate()) {
  const handle = (row.handle || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const shard = handle.substring(0, 2) || "other";

  map[shard] = (map[shard] || 0) + 1;
}

const top = Object.entries(map)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

console.table(
  top.map(([shard, products]) => ({
    shard,
    products,
  }))
);

db.close();