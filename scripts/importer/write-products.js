const fs = require("fs");
const path = require("path");
const CONSTANTS = require("./constants");

function ensureFolder(folder) {
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
}

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function clean(value) {
  return String(value || "").trim();
}

function isR2Url(value) {
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
  return publicUrl && clean(value).includes(publicUrl);
}

function unique(values) {
  return [...new Set((values || []).map(clean).filter(Boolean))];
}

function mergeArray(a, b) {
  return unique([...(a || []), ...(b || [])]);
}

function preferNew(oldValue, newValue) {
  return clean(newValue) ? newValue : oldValue;
}

function variantKey(variant) {
  return [
    clean(variant.sku),
    clean(variant.partNumber),
    clean(variant.title),
  ]
    .filter(Boolean)
    .join("__")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function mergeVariant(existing, incoming, stats) {
  const existingImage = existing.image;

  const merged = {
    ...existing,
    title: preferNew(existing.title, incoming.title),
    sku: preferNew(existing.sku, incoming.sku),
    option1Value: preferNew(existing.option1Value, incoming.option1Value),
    image: isR2Url(existingImage) ? existingImage : preferNew(existingImage, incoming.image),
    vendor: preferNew(existing.vendor, incoming.vendor),
    price: incoming.price || existing.price || 0,
    partNumber: preferNew(existing.partNumber, incoming.partNumber),
    hsCode: preferNew(existing.hsCode, incoming.hsCode),
    countryOfOrigin: preferNew(existing.countryOfOrigin, incoming.countryOfOrigin),
    description: preferNew(existing.description, incoming.description),
    specifications: mergeArray(existing.specifications, incoming.specifications),
    unitWeight: preferNew(existing.unitWeight, incoming.unitWeight),
    shippingVolume: preferNew(existing.shippingVolume, incoming.shippingVolume),
  };

  if (isR2Url(existingImage)) {
    merged.__skipImageUpload = true;
  }

  stats.updatedVariants++;

  return merged;
}

function mergeProduct(existing, incoming, stats) {
  if (!existing) {
    stats.newProducts++;
    stats.newVariants += incoming.variants.length;
    return incoming;
  }

  stats.updatedProducts++;

  const merged = {
    ...existing,
    handle: existing.handle || incoming.handle,
    title: preferNew(existing.title, incoming.title),
    collection: preferNew(existing.collection, incoming.collection),
    collectionHandle: preferNew(existing.collectionHandle, incoming.collectionHandle),
    category: preferNew(existing.category, incoming.category),
    tags: mergeArray(existing.tags, incoming.tags),
    images: mergeArray(existing.images, incoming.images),
    variants: [],
  };

  const variantMap = new Map();

  for (const variant of existing.variants || []) {
    const key = variantKey(variant);
    if (key) variantMap.set(key, variant);
  }

  for (const variant of incoming.variants || []) {
    const key = variantKey(variant);

    if (key && variantMap.has(key)) {
      variantMap.set(key, mergeVariant(variantMap.get(key), variant, stats));
    } else {
      variantMap.set(key || `${Date.now()}-${Math.random()}`, variant);
      stats.newVariants++;
    }
  }

  merged.variants = Array.from(variantMap.values());

  merged.images = mergeArray(
    merged.images,
    merged.variants.map((variant) => variant.image)
  );

  return merged;
}

function writeProduct(product) {
  ensureFolder(CONSTANTS.PUBLIC_PRODUCTS_DIR);

  const cleanProduct = JSON.parse(JSON.stringify(product));

  for (const variant of cleanProduct.variants || []) {
    delete variant.__skipImageUpload;
  }

  const json = JSON.stringify(cleanProduct, null, 2);

  fs.writeFileSync(
    path.join(CONSTANTS.PUBLIC_PRODUCTS_DIR, `${cleanProduct.handle}.json`),
    json,
    "utf8"
  );
}

function mergeOnly(products) {
  const stats = {
    newProducts: 0,
    updatedProducts: 0,
    newVariants: 0,
    updatedVariants: 0,
    written: 0,
  };

  const mergedProducts = [];

  for (const incoming of products) {
    const file = path.join(CONSTANTS.PUBLIC_PRODUCTS_DIR, `${incoming.handle}.json`);
    const existing = readJson(file);
    const merged = mergeProduct(existing, incoming, stats);
    mergedProducts.push(merged);
  }

  return {
    products: mergedProducts,
    stats,
  };
}

function writeMerged(products) {
  let written = 0;

  for (const product of products) {
    writeProduct(product);
    written++;
  }

  return written;
}

module.exports = {
  mergeOnly,
  writeMerged,
};