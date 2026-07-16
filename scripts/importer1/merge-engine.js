const { clean, slugify, unique } = require("./utils");

function sourceKey(source) {
  return [
    slugify(source.collectionHandle),
    clean(source.excelFile).toLowerCase(),
    Number(source.sourceRow || 0),
  ].join("|");
}

/*
 * Duplicate rule:
 * - Keep the first product exactly as it is.
 * - Merge only unique tags into it.
 * - Append source metadata only for duplicate auditing/registry history.
 * - Never merge variants, images, title, description, vendor, price,
 *   specifications, category, collection, or any other product field.
 */
function mergeTagsOnly(firstProduct, duplicateProduct) {
  const beforeTags = unique(firstProduct.tags || [])
    .map(slugify)
    .filter(Boolean);

  const incomingTags = unique(duplicateProduct.tags || [])
    .map(slugify)
    .filter(Boolean);

  const beforeSet = new Set(beforeTags);
  const tagsAdded = incomingTags.filter((tag) => !beforeSet.has(tag));

  firstProduct.tags = unique([
    ...beforeTags,
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
    existingTags: beforeTags,
    incomingTags,
    tagsAdded,
    finalTags: firstProduct.tags,
  };
}

module.exports = {
  mergeTagsOnly,
};
