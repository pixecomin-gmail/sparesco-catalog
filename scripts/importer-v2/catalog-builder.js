function getLowestPrice(variants) {
  const prices = (variants || [])
    .map((variant) => Number(variant.price || 0))
    .filter((price) => price > 0);

  return prices.length ? Math.min(...prices) : 0;
}

function titleFromHandle(handle) {
  return String(handle || "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildCatalogIndex(products) {
  return products
    .map((product) => {
      const firstVariant = product.variants?.[0] || {};

      return {
        handle: product.handle,
        title: product.title,
        collection: product.collection,
        collectionTitle: titleFromHandle(product.collection),
        category: product.category,
        categoryTitle: titleFromHandle(product.category),
        image: product.images?.[0] || "",
        partNumber: firstVariant.partNumber || "",
        vendor: firstVariant.vendor || "",
        variantCount: product.variants?.length || 0,
        price: getLowestPrice(product.variants),
        tags: product.tags || [],
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

function buildCollections(products) {
  const map = new Map();

  for (const product of products) {
    if (!map.has(product.collection)) {
      map.set(product.collection, {
        title: titleFromHandle(product.collection),
        handle: product.collection,
        count: 0,
      });
    }

    map.get(product.collection).count++;
  }

  return Array.from(map.values()).sort((a, b) =>
    a.title.localeCompare(b.title)
  );
}

function buildStats(products, collections) {
  return {
    products: products.length,
    variants: products.reduce(
      (sum, product) => sum + (product.variants?.length || 0),
      0
    ),
    collections: collections.length,
  };
}

module.exports = {
  buildCatalogIndex,
  buildCollections,
  buildStats,
};