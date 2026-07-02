const { unique, clean } = require("./utils");

function variantKey(variant) {
  return (
    clean(variant.partNumber) ||
    clean(variant.option1Value) ||
    clean(variant.title)
  )
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function cleanProduct(product) {
  const copy = JSON.parse(JSON.stringify(product));

  delete copy.__sources;

  for (const variant of copy.variants || []) {
    delete variant.__excelFile;
    delete variant.__sourceRow;
  }

  return copy;
}

function mergeProduct(existing, incoming, collectionName) {
  const duplicates = [];
  const mergedProducts = [];
  const variantConflicts = [];

  const finalProduct = {
    ...existing,
    tags: unique([...(existing.tags || []), ...(incoming.tags || [])]),
    images: unique([...(existing.images || []), ...(incoming.images || [])]),
    variants: [...(existing.variants || [])],
  };

  const existingVariantMap = new Map();

  for (const variant of finalProduct.variants) {
    const key = variantKey(variant);
    if (key) existingVariantMap.set(key, variant);
  }

  let addedVariants = 0;
  let addedImages = 0;

  for (const variant of incoming.variants || []) {
    const key = variantKey(variant);

    if (key && existingVariantMap.has(key)) {
      variantConflicts.push({
        excelFile: variant.__excelFile || "",
        sourceRow: variant.__sourceRow || "",
        handle: incoming.handle,
        partNumber: variant.partNumber || "",
        incomingCollection: incoming.collection,
        existingCollection: existing.collection,
        action: "SKIPPED",
        reason: "Variant already exists",
      });

      continue;
    }

    const cleanVariant = { ...variant };
    delete cleanVariant.__excelFile;
    delete cleanVariant.__sourceRow;

    finalProduct.variants.push(cleanVariant);
    addedVariants++;
  }

  const beforeImageCount = (existing.images || []).length;
  finalProduct.images = unique([
    ...finalProduct.images,
    ...finalProduct.variants.map((variant) => variant.image),
  ]);
  addedImages = finalProduct.images.length - beforeImageCount;

  duplicates.push({
    excelFile: incoming.__sources?.[0]?.excelFile || "",
    sourceRow: incoming.__sources?.[0]?.sourceRow || "",
    handle: incoming.handle,
    partNumber: "",
    incomingCollection: incoming.collection,
    existingCollection: existing.collection,
    action: "MERGED",
    reason: "Duplicate product handle",
  });

  mergedProducts.push({
    handle: incoming.handle,
    tagsAdded: unique(incoming.tags || []).join(", "),
    imagesAdded: addedImages,
    variantsAdded: addedVariants,
    collection: collectionName,
  });

  return {
    product: cleanProduct(finalProduct),
    duplicates,
    mergedProducts,
    variantConflicts,
  };
}

module.exports = {
  variantKey,
  cleanProduct,
  mergeProduct,
};