const { slugify } = require("./utils");

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
      const tags = product.tags || [];

      return {
        handle: product.handle,
        title: product.title,
        collection: product.collection,
        collectionTitle: titleFromHandle(product.collection),
        category: product.category,
        categoryTitle: titleFromHandle(product.category),
        imageFolder: product.imageFolder || product.collection || "",
        tags,
        image: product.images?.[0] || "",
        partNumber: firstVariant.partNumber || "",
        vendor: firstVariant.vendor || "",
        variantCount: product.variants?.length || 0,
        price: getLowestPrice(product.variants),
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

function buildCatalogPages(index, pageSize = 24) {
  const pages = [];

  for (let i = 0; i < index.length; i += pageSize) {
    pages.push(index.slice(i, i + pageSize));
  }

  return pages;
}

function buildCatalogMeta(index, pageSize = 24) {
  return {
    totalProducts: index.length,
    pageSize,
    totalPages: Math.ceil(index.length / pageSize),
  };
}

function buildSearchIndex(products) {
  return products
    .map((product) => {
      const variants = product.variants || [];
      const tags = product.tags || [];

      const variantText = variants
        .flatMap((variant) => [
          variant.title,
          variant.partNumber,
          variant.vendor,
          variant.sku,
          variant.option1Value,
          variant.description,
        ])
        .filter(Boolean)
        .join(" ");

      const firstVariant = variants[0] || {};

      return {
        h: product.handle,
        t: product.title,
        c: product.collection,
        ct: titleFromHandle(product.collection),
        tags,
        p: firstVariant.partNumber || "",
        v: firstVariant.vendor || "",
        i: product.images?.[0] || "",
        vc: variants.length,
        pr: getLowestPrice(variants),
        s: [
          product.handle,
          product.title,
          product.collection,
          titleFromHandle(product.collection),
          product.category,
          titleFromHandle(product.category),
          variantText,
          ...tags,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      };
    })
    .sort((a, b) => a.t.localeCompare(b.t));
}

function buildCollections(products) {
  const map = new Map();

  for (const product of products) {
    const handles = [...new Set((product.tags || []).map(slugify).filter(Boolean))];

    for (const handle of handles) {

      if (!map.has(handle)) {
        map.set(handle, {
          title: titleFromHandle(handle),
          handle,
          count: 0,
        });
      }

      map.get(handle).count++;
    }
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
  buildCatalogPages,
  buildCatalogMeta,
  buildSearchIndex,
  buildCollections,
  buildStats,
};