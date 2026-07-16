const { clean, slugify, unique } = require("./utils");

function variantKey(variant) {
  return (
    clean(variant.partNumber) ||
    clean(variant.option1Value) ||
    clean(variant.title)
  )
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function sourceKey(source) {
  return [
    slugify(source.collectionHandle),
    clean(source.excelFile).toLowerCase(),
    Number(source.sourceRow || 0),
  ].join("|");
}

function mergeProducts(allProducts) {
  const merged = new Map();
  const duplicateRows = [];

  for (const incoming of allProducts) {
    const existing = merged.get(incoming.handle);

    if (!existing) {
      merged.set(incoming.handle, JSON.parse(JSON.stringify(incoming)));
      continue;
    }

    const variantMap = new Map(
      (existing.variants || [])
        .map((variant) => [variantKey(variant), variant])
        .filter(([key]) => key)
    );

    let variantsAdded = 0;

    for (const variant of incoming.variants || []) {
      const key = variantKey(variant);

      if (key && variantMap.has(key)) {
        const current = variantMap.get(key);
        if (!current.image && variant.image) current.image = variant.image;
        continue;
      }

      existing.variants.push(variant);
      if (key) variantMap.set(key, variant);
      variantsAdded++;
    }

    const sourceMap = new Map(
      (existing.sources || []).map((source) => [sourceKey(source), source])
    );

    for (const source of incoming.sources || []) {
      sourceMap.set(sourceKey(source), source);
    }

    existing.sources = Array.from(sourceMap.values());
    existing.tags = unique([...(existing.tags || []), ...(incoming.tags || [])])
      .map(slugify)
      .filter(Boolean);
    existing.images = unique([...(existing.images || []), ...(incoming.images || [])]);

    duplicateRows.push({
      handle: incoming.handle,
      keptCollection: existing.collection,
      mergedCollection: incoming.collection,
      variantsAdded,
      tagsAfterMerge: existing.tags.join(", "),
      action: "MERGED",
    });
  }

  return {
    products: Array.from(merged.values()),
    duplicates: duplicateRows,
  };
}

module.exports = { variantKey, mergeProducts };
