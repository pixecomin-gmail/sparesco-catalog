const { clean, slugify, unique } = require("./utils");

function sourceKey(source) {
  return [
    slugify(source.collectionHandle),
    clean(source.excelFile).toLowerCase(),
    Number(source.sourceRow || 0),
  ].join("|");
}

function mergeTagsOnly(firstProduct, duplicateProduct) {
  const existingTags = unique(firstProduct.tags || [])
    .map(slugify)
    .filter(Boolean);

  const incomingTags = unique(duplicateProduct.tags || [])
    .map(slugify)
    .filter(Boolean);

  const existingSet = new Set(existingTags);
  const tagsAdded = incomingTags.filter(
    (tag) => !existingSet.has(tag)
  );

  firstProduct.tags = unique([
    ...existingTags,
    ...incomingTags,
  ]);

  const sourceMap = new Map(
    (firstProduct.sources || []).map((source) => [
      sourceKey(source),
      source,
    ])
  );

  for (const source of duplicateProduct.sources || []) {
    sourceMap.set(sourceKey(source), source);
  }

  firstProduct.sources = Array.from(sourceMap.values());

  return {
    product: firstProduct,
    existingTags,
    incomingTags,
    tagsAdded,
    finalTags: firstProduct.tags,
  };
}

module.exports = {
  mergeTagsOnly,
};
