const fs = require("fs");
const path = require("path");

const config = require("./config");
const { importCollection } = require("./import-collection");
const { uploadJson } = require("./r2-client");
const {
  buildCatalogIndex,
  buildCatalogPages,
  buildCatalogMeta,
  buildSearchIndex,
  buildCollections,
  buildStats,
} = require("./catalog-builder");
const progress = require("./progress");
const { slugify } = require("./utils");

const PAGE_SIZE = 24;
const FEATURED_LIMIT = 12;

function getCollectionFolders() {
  return fs
    .readdirSync(config.IMPORTS_DIR, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => path.join(config.IMPORTS_DIR, item.name))
    .sort();
}

function mergeProductsByHandle(products) {
  const map = new Map();

  for (const product of products) {
    if (!map.has(product.handle)) {
      map.set(product.handle, product);
      continue;
    }

    const existing = map.get(product.handle);

    existing.tags = [...new Set([...(existing.tags || []), ...(product.tags || [])])];
    existing.images = [...new Set([...(existing.images || []), ...(product.images || [])])];

    const variantMap = new Map();

    for (const variant of existing.variants || []) {
      const key =
        String(variant.partNumber || variant.option1Value || variant.title || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "");

      if (key) variantMap.set(key, variant);
    }

    for (const variant of product.variants || []) {
      const key =
        String(variant.partNumber || variant.option1Value || variant.title || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "");

      if (!key || !variantMap.has(key)) {
        existing.variants.push(variant);
      }
    }
  }

  return Array.from(map.values());
}

function buildCategoryPages(catalogIndex) {
  const groups = new Map();

  for (const product of catalogIndex) {
    const handles = [
      ...new Set((product.tags || []).map(slugify).filter(Boolean)),
    ];

    for (const handle of handles) {
      if (!groups.has(handle)) {
        groups.set(handle, []);
      }

      groups.get(handle).push(product);
    }
  }

  return groups;
}

function buildCategoryMeta(categoryPages) {
  const meta = {};

  for (const [handle, products] of categoryPages.entries()) {
    meta[handle] = {
      totalProducts: products.length,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(products.length / PAGE_SIZE),
    };
  }

  return meta;
}

function buildFilterIndex(catalogIndex) {
  const categories = new Map();
  const brands = new Map();

  for (const product of catalogIndex) {
    const handles = [
      ...new Set((product.tags || []).map(slugify).filter(Boolean)),
    ];

    for (const handle of handles) {
      categories.set(handle, {
        handle,
        title: handle
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        count: (categories.get(handle)?.count || 0) + 1,
      });
    }

    if (product.vendor) {
      brands.set(product.vendor, {
        handle: product.vendor,
        title: product.vendor,
        count: (brands.get(product.vendor)?.count || 0) + 1,
      });
    }
  }

  return {
    categories: Array.from(categories.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    ),
    brands: Array.from(brands.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    ),
  };
}

function getShardKey(text) {
  const first = String(text || "").trim().toLowerCase()[0];

  if (!first) return "other";
  if (first >= "0" && first <= "9") return first;
  if (first >= "a" && first <= "z") return first;

  return "other";
}

function buildSearchShards(searchIndex) {
  const shards = new Map();

  for (const item of searchIndex) {
    const key = getShardKey(item.t || item.h);

    if (!shards.has(key)) {
      shards.set(key, []);
    }

    shards.get(key).push(item);
  }

  return shards;
}

async function main() {
  progress.title("SPARESCO IMPORTER");

  const folders = getCollectionFolders();
  const allProducts = [];

  progress.info(`Collections found: ${folders.length}`);

  for (let i = 0; i < folders.length; i++) {
    const products = await importCollection(folders[i], i + 1, folders.length);
    allProducts.push(...products);
  }

  progress.section("Building indexes");

  const uniqueProducts = mergeProductsByHandle(allProducts);

  progress.info(`Total built products: ${allProducts.length}`);
  progress.info(`Unique products: ${uniqueProducts.length}`);
  progress.info(
    `Duplicate products merged: ${allProducts.length - uniqueProducts.length}`
  );

  const catalogIndex = buildCatalogIndex(uniqueProducts);
  const catalogPages = buildCatalogPages(catalogIndex, PAGE_SIZE);
  const catalogMeta = buildCatalogMeta(catalogIndex, PAGE_SIZE);
  const searchIndex = buildSearchIndex(uniqueProducts);
  const collections = buildCollections(uniqueProducts);
  const stats = buildStats(uniqueProducts, collections);
  const filterIndex = buildFilterIndex(catalogIndex);
  const categoryPages = buildCategoryPages(catalogIndex);
  const categoryMeta = buildCategoryMeta(categoryPages);
  const searchShards = buildSearchShards(searchIndex);
  const featuredProducts = catalogIndex.slice(0, FEATURED_LIMIT);

  await uploadJson("catalog/indexes/catalog-index.json", catalogIndex);
  await uploadJson("catalog/indexes/catalog-meta.json", catalogMeta);

  for (let i = 0; i < catalogPages.length; i++) {
    const pageNumber = String(i + 1).padStart(4, "0");

    await uploadJson(
      `catalog/indexes/catalog-pages/${pageNumber}.json`,
      catalogPages[i]
    );
  }

  for (const [handle, products] of categoryPages.entries()) {
    const pages = buildCatalogPages(products, PAGE_SIZE);

    for (let i = 0; i < pages.length; i++) {
      const pageNumber = String(i + 1).padStart(4, "0");

      await uploadJson(
        `catalog/indexes/category-pages/${handle}/${pageNumber}.json`,
        pages[i]
      );
    }
  }

  for (const [key, items] of searchShards.entries()) {
    await uploadJson(`catalog/search/${key}.json`, items);
  }

  await uploadJson("catalog/indexes/category-meta.json", categoryMeta);
  await uploadJson("catalog/indexes/filter-index.json", filterIndex);
  await uploadJson("catalog/indexes/search-index.json", searchIndex);
  await uploadJson("catalog/indexes/collections.json", collections);
  await uploadJson("catalog/indexes/stats.json", stats);
  await uploadJson(
    "catalog/featured-products/featured-products.json",
    featuredProducts
  );

  progress.success("Indexes uploaded");
  console.log(stats);
}

main().catch((error) => {
  progress.error(error.message);
  console.error(error);
  process.exit(1);
});