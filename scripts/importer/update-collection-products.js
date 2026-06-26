const fs = require("fs");
const path = require("path");
const CONSTANTS = require("./constants");

function ensureFolder(folder) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function update() {
  ensureFolder(CONSTANTS.PUBLIC_COLLECTION_PRODUCTS_DIR);

  const productsIndex = readJson(CONSTANTS.PRODUCTS_INDEX_FILE);
  const groups = new Map();

  for (const product of productsIndex) {
    if (!groups.has(product.collectionHandle)) {
      groups.set(product.collectionHandle, []);
    }

    groups.get(product.collectionHandle).push(product);
  }

  for (const [collectionHandle, products] of groups.entries()) {
    writeJson(
      path.join(
        CONSTANTS.PUBLIC_COLLECTION_PRODUCTS_DIR,
        `${collectionHandle}.json`
      ),
      products
    );
  }

  return {
    count: groups.size,
  };
}

module.exports = {
  update,
};