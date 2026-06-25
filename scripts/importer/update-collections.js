// scripts/importer/update-collections.js

const fs = require("fs");
const path = require("path");
const CONSTANTS = require("./constants");

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function update() {
  const map = new Map();

  const files = fs
    .readdirSync(CONSTANTS.DATA_PRODUCTS_DIR)
    .filter((file) => file.endsWith(".json"));

  for (const file of files) {
    const product = readJson(path.join(CONSTANTS.DATA_PRODUCTS_DIR, file));
    if (!product) continue;

    const handle = product.collectionHandle;
    if (!handle) continue;

    if (!map.has(handle)) {
      map.set(handle, {
        title: product.collection,
        handle,
        count: 0,
      });
    }

    map.get(handle).count++;
  }

  const final = Array.from(map.values()).sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  fs.writeFileSync(
    CONSTANTS.COLLECTIONS_FILE,
    JSON.stringify(final, null, 2),
    "utf8"
  );

  return {
    collections: final,
    count: final.length,
  };
}

module.exports = {
  update,
};