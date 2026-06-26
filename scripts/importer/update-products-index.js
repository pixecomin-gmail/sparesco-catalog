// scripts/importer/update-products-index.js

const fs = require("fs");
const CONSTANTS = require("./constants");

function readIndex() {
  if (!fs.existsSync(CONSTANTS.PRODUCTS_INDEX_FILE)) {
    return [];
  }

  try {
    return JSON.parse(fs.readFileSync(CONSTANTS.PRODUCTS_INDEX_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeIndex(index) {
  fs.writeFileSync(
    CONSTANTS.PRODUCTS_INDEX_FILE,
    JSON.stringify(index, null, 2),
    "utf8"
  );
}

function getLowestPrice(variants) {
  const prices = (variants || [])
    .map((variant) => Number(variant.price || 0))
    .filter((price) => price > 0);

  return prices.length ? Math.min(...prices) : 0;
}

function update(products) {
  const existing = readIndex();

  const map = new Map();

  for (const item of existing) {
    map.set(String(item.handle).toLowerCase(), item);
  }

  let newProducts = 0;
  let updatedProducts = 0;

  for (const product of products) {
    const key = product.handle.toLowerCase();
    const firstVariant = product.variants[0] || {};

    const record = {
      handle: product.handle,
      title: product.title,
      category: product.category,
      collection: product.collection,
      collectionHandle: product.collectionHandle,
      image: product.images[0] || "",
      partNumber: firstVariant.partNumber || "",
      vendor: firstVariant.vendor || "",
      variantCount: product.variants.length,
      price: getLowestPrice(product.variants),
    };

    if (map.has(key)) {
      updatedProducts++;
    } else {
      newProducts++;
    }

    map.set(key, record);
  }

  const final = Array.from(map.values()).sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  writeIndex(final);

  return {
    products: final,
    stats: {
      newProducts,
      updatedProducts,
    },
  };
}

module.exports = {
  update,
};