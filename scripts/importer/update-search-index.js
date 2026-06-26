const fs = require("fs");
const path = require("path");
const CONSTANTS = require("./constants");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function update() {
  const productsIndex = readJson(CONSTANTS.PRODUCTS_INDEX_FILE);

  const searchIndex = productsIndex.map((product) => ({
    handle: product.handle,
    title: product.title,
    partNumber: product.partNumber,
    vendor: product.vendor,
    category: product.category,
    collection: product.collection,
    collectionHandle: product.collectionHandle,
    image: product.image,
    price: product.price,
    variantCount: product.variantCount,
  }));

  writeJson(CONSTANTS.SEARCH_INDEX_FILE, searchIndex);

  return {
    products: searchIndex,
  };
}

module.exports = {
  update,
};