const { readJson, uploadJson } = require("./r2-client");
const { slugify } = require("./utils");

const CATALOG_PAGE_SIZE = 1000;
const CATEGORY_PAGE_SIZE = 24;

function titleFromHandle(handle) {
  return String(handle || "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getLowestPrice(variants) {
  const prices = (variants || [])
    .map((variant) => Number(variant.price || 0))
    .filter((price) => price > 0);
  return prices.length ? Math.min(...prices) : 0;
}

function summarizeProduct(product) {
  const firstVariant = product.variants?.[0] || {};

  return {
    handle: product.handle,
    title: product.title,
    collection: product.collection,
    collectionTitle: titleFromHandle(product.collection),
    category: product.category,
    categoryTitle: titleFromHandle(product.category),
    imageFolder: product.imageFolder || product.collection || "",
    tags: [...new Set((product.tags || []).map(slugify).filter(Boolean))],
    image: product.images?.[0] || "",
    partNumber: firstVariant.partNumber || "",
    vendor: firstVariant.vendor || "",
    variantCount: product.variants?.length || 0,
    price: getLowestPrice(product.variants),
  };
}

function buildSearchItem(product) {
  const summary = summarizeProduct(product);
  const variantText = (product.variants || [])
    .flatMap((variant) => [
      variant.title,
      variant.partNumber,
      variant.vendor,
      variant.option1Value,
      variant.description,
    ])
    .filter(Boolean)
    .join(" ");

  return {
    h: summary.handle,
    t: summary.title,
    c: summary.collection,
    ct: summary.collectionTitle,
    tags: summary.tags,
    p: summary.partNumber,
    v: summary.vendor,
    i: summary.image,
    vc: summary.variantCount,
    pr: summary.price,
    s: [
      summary.handle,
      summary.title,
      summary.collection,
      summary.collectionTitle,
      summary.category,
      summary.categoryTitle,
      variantText,
      ...summary.tags,
    ].filter(Boolean).join(" ").toLowerCase(),
  };
}

function searchShard(text) {
  const first = String(text || "").trim().toLowerCase()[0];
  if (!first) return "other";
  if (first >= "0" && first <= "9") return first;
  if (first >= "a" && first <= "z") return first;
  return "other";
}

async function safeRead(key, fallback) {
  try {
    return await readJson(key);
  } catch {
    return fallback;
  }
}

function pageNumber(index) {
  return String(index + 1).padStart(4, "0");
}

async function createIncrementalPublisher() {
  const existingCatalog = await safeRead("catalog/indexes/catalog-index.json", []);
  const catalog = [...existingCatalog];
  const positionByHandle = new Map(catalog.map((item, index) => [item.handle, index]));
  const categoryMeta = await safeRead("catalog/indexes/category-meta.json", {});
  const searchShardCache = new Map();
  let fullIndexPublished = existingCatalog.length > 0;

  async function getCachedSearchShard(shard) {
    if (!searchShardCache.has(shard)) {
      searchShardCache.set(shard, await safeRead(`catalog/search/${shard}.json`, []));
    }
    return searchShardCache.get(shard);
  }

  function buildCollectionsAndBrands() {
    const collectionCounts = new Map();
    const brandCounts = new Map();

    for (const item of catalog) {
      for (const tag of (item.tags || []).map(slugify).filter(Boolean)) {
        collectionCounts.set(tag, (collectionCounts.get(tag) || 0) + 1);
      }
      if (item.vendor) {
        brandCounts.set(item.vendor, (brandCounts.get(item.vendor) || 0) + 1);
      }
    }

    const collections = Array.from(collectionCounts.entries())
      .map(([handle, count]) => ({ title: titleFromHandle(handle), handle, count }))
      .sort((a, b) => a.title.localeCompare(b.title));

    const brands = Array.from(brandCounts.entries())
      .map(([title, count]) => ({ handle: title, title, count }))
      .sort((a, b) => a.title.localeCompare(b.title));

    return { collections, brands };
  }

  async function publishFullIndexes() {
    const searchIndex = catalog.map((item) => ({
      h: item.handle,
      t: item.title,
      c: item.collection,
      ct: item.collectionTitle,
      tags: item.tags || [],
      p: item.partNumber || "",
      v: item.vendor || "",
      i: item.image || "",
      vc: item.variantCount || 0,
      pr: item.price || 0,
      s: [
        item.handle,
        item.title,
        item.collection,
        item.collectionTitle,
        item.category,
        item.categoryTitle,
        item.partNumber,
        item.vendor,
        ...(item.tags || []),
      ].filter(Boolean).join(" ").toLowerCase(),
    }));

    await uploadJson("catalog/indexes/catalog-index.json", catalog);
    await uploadJson("catalog/indexes/search-index.json", searchIndex);
    fullIndexPublished = true;
  }

  async function publishBatch(products, options = {}) {
    const forceFull = Boolean(options.forceFull);
    const affectedCatalogPages = new Set();
    const affectedTags = new Set();
    const affectedSearchShards = new Set();

    for (const product of products) {
      const summary = summarizeProduct(product);
      const existingPosition = positionByHandle.get(summary.handle);
      let position;

      if (existingPosition === undefined) {
        position = catalog.length;
        catalog.push(summary);
        positionByHandle.set(summary.handle, position);
      } else {
        position = existingPosition;
        const previous = catalog[position];
        for (const tag of previous.tags || []) affectedTags.add(slugify(tag));
        affectedSearchShards.add(searchShard(previous.title || previous.handle));
        catalog[position] = summary;
      }

      affectedCatalogPages.add(Math.floor(position / CATALOG_PAGE_SIZE));
      for (const tag of summary.tags) affectedTags.add(tag);

      const newShard = searchShard(summary.title || summary.handle);
      affectedSearchShards.add(newShard);

      const searchItem = buildSearchItem(product);
      const shardItems = await getCachedSearchShard(newShard);
      const searchMap = new Map(shardItems.map((item) => [item.h, item]));
      searchMap.set(searchItem.h, searchItem);
      searchShardCache.set(newShard, Array.from(searchMap.values()));
    }

    await uploadJson("catalog/indexes/catalog-meta.json", {
      totalProducts: catalog.length,
      pageSize: CATALOG_PAGE_SIZE,
      totalPages: Math.ceil(catalog.length / CATALOG_PAGE_SIZE),
    });

    for (const pageIndex of affectedCatalogPages) {
      const start = pageIndex * CATALOG_PAGE_SIZE;
      await uploadJson(
        `catalog/indexes/catalog-pages/${pageNumber(pageIndex)}.json`,
        catalog.slice(start, start + CATALOG_PAGE_SIZE)
      );
    }

    for (const tag of affectedTags) {
      if (!tag) continue;
      const items = catalog.filter((item) => (item.tags || []).map(slugify).includes(tag));
      const totalPages = Math.ceil(items.length / CATEGORY_PAGE_SIZE);

      categoryMeta[tag] = {
        totalProducts: items.length,
        pageSize: CATEGORY_PAGE_SIZE,
        totalPages,
      };

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const start = pageIndex * CATEGORY_PAGE_SIZE;
        await uploadJson(
          `catalog/indexes/category-pages/${tag}/${pageNumber(pageIndex)}.json`,
          items.slice(start, start + CATEGORY_PAGE_SIZE)
        );
      }
    }

    const { collections, brands } = buildCollectionsAndBrands();
    await uploadJson("catalog/indexes/category-meta.json", categoryMeta);
    await uploadJson("catalog/indexes/collections.json", collections);
    await uploadJson("catalog/indexes/filter-index.json", { categories: collections, brands });

    for (const shard of affectedSearchShards) {
      const items = await getCachedSearchShard(shard);
      await uploadJson(
        `catalog/search/${shard}.json`,
        [...items].sort((a, b) => String(a.t || "").localeCompare(String(b.t || "")))
      );
    }

    await uploadJson("catalog/indexes/stats.json", {
      products: catalog.length,
      variants: catalog.reduce((sum, item) => sum + Number(item.variantCount || 0), 0),
      collections: collections.length,
    });

    if (!fullIndexPublished || forceFull) {
      await publishFullIndexes();
    }
  }

  async function finalize() {
    await publishFullIndexes();
  }

  return { publishBatch, finalize };
}

module.exports = { createIncrementalPublisher };
