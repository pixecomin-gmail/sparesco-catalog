const fs = require("fs");
const path = require("path");
const readline = require("readline");
const XLSX = require("xlsx");

const config = require("./config");
const { getValue } = require("./excel-reader");
const { slugify, productKey, unique } = require("./utils");
const { readJson, uploadJson, remove } = require("./r2-client");
const {
  registryShard,
  loadRegistryForHandles,
  getRegistryEntry,
} = require("./handle-registry");

const CATALOG_PAGE_SIZE = 1000;
const CATEGORY_PAGE_SIZE = 24;
const SEARCH_SHARDS = [
  ..."0123456789abcdefghijklmnopqrstuvwxyz",
  "other",
];

function getExcelFiles(collectionFolder) {
  return fs
    .readdirSync(collectionFolder)
    .filter((file) => file.toLowerCase().endsWith(".xlsx"))
    .map((file) => path.join(collectionFolder, file))
    .sort((a, b) => a.localeCompare(b));
}

function readCurrentHandles(excelFiles) {
  const handles = new Set();

  for (const excelPath of excelFiles) {
    const workbook = XLSX.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    for (const row of rows) {
      const partNumber = getValue(row, [
        "Variant Metafield: custom.part_number [single_line_text_field]",
      ]);

      const handle = slugify(getValue(row, ["Handle"]) || partNumber);
      if (handle) handles.add(handle);
    }
  }

  return handles;
}

async function safeRead(key, fallback) {
  try {
    return await readJson(key);
  } catch {
    return fallback;
  }
}

function registryKey(shard) {
  return `catalog/handles/${shard}.json`;
}

function pageNumber(index) {
  return String(index + 1).padStart(4, "0");
}

function titleFromHandle(handle) {
  return String(handle || "")
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getSearchShard(text) {
  const first = String(text || "").trim().toLowerCase()[0];

  if (!first) return "other";
  if (first >= "0" && first <= "9") return first;
  if (first >= "a" && first <= "z") return first;

  return "other";
}

function buildSearchItem(item) {
  return {
    h: item.handle,
    t: item.title,
    c: item.collection,
    ct: item.collectionTitle || titleFromHandle(item.collection),
    tags: item.tags || [],
    p: item.partNumber || "",
    v: item.vendor || "",
    i: item.image || "",
    vc: Number(item.variantCount || 0),
    pr: Number(item.price || 0),
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
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

function parseArguments() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((arg) => arg.startsWith("--")));
  const collectionName = args
    .filter((arg) => !arg.startsWith("--"))
    .join(" ")
    .trim();

  return {
    collectionName,
    apply: flags.has("--apply"),
    yes: flags.has("--yes"),
  };
}

async function askForConfirmation(collectionName, count) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const expected = `DELETE ${collectionName}`;

  return new Promise((resolve) => {
    rl.question(
      `Type "${expected}" to apply ${count} removal(s): `,
      (answer) => {
        rl.close();
        resolve(answer.trim() === expected);
      }
    );
  });
}

async function rebuildAllDerivedIndexes(catalog, oldCatalogMeta, oldCategoryMeta) {
  const oldCatalogPages = Number(oldCatalogMeta?.totalPages || 0);
  const newCatalogPages = Math.ceil(catalog.length / CATALOG_PAGE_SIZE);

  await uploadJson("catalog/indexes/catalog-index.json", catalog);
  await uploadJson("catalog/indexes/catalog-meta.json", {
    totalProducts: catalog.length,
    pageSize: CATALOG_PAGE_SIZE,
    totalPages: newCatalogPages,
  });

  for (let pageIndex = 0; pageIndex < newCatalogPages; pageIndex++) {
    const start = pageIndex * CATALOG_PAGE_SIZE;

    await uploadJson(
      `catalog/indexes/catalog-pages/${pageNumber(pageIndex)}.json`,
      catalog.slice(start, start + CATALOG_PAGE_SIZE)
    );
  }

  for (
    let pageIndex = newCatalogPages;
    pageIndex < oldCatalogPages;
    pageIndex++
  ) {
    await uploadJson(
      `catalog/indexes/catalog-pages/${pageNumber(pageIndex)}.json`,
      []
    );
  }

  const categoryGroups = new Map();

  for (const item of catalog) {
    for (const tag of unique(item.tags || []).map(slugify).filter(Boolean)) {
      if (!categoryGroups.has(tag)) categoryGroups.set(tag, []);
      categoryGroups.get(tag).push(item);
    }
  }

  const categoryMeta = {};
  const allCategoryHandles = new Set([
    ...Object.keys(oldCategoryMeta || {}),
    ...categoryGroups.keys(),
  ]);

  for (const handle of allCategoryHandles) {
    const items = categoryGroups.get(handle) || [];
    const oldTotalPages = Number(oldCategoryMeta?.[handle]?.totalPages || 0);
    const newTotalPages = Math.ceil(items.length / CATEGORY_PAGE_SIZE);

    if (items.length) {
      categoryMeta[handle] = {
        totalProducts: items.length,
        pageSize: CATEGORY_PAGE_SIZE,
        totalPages: newTotalPages,
      };
    }

    for (let pageIndex = 0; pageIndex < newTotalPages; pageIndex++) {
      const start = pageIndex * CATEGORY_PAGE_SIZE;

      await uploadJson(
        `catalog/indexes/category-pages/${handle}/${pageNumber(pageIndex)}.json`,
        items.slice(start, start + CATEGORY_PAGE_SIZE)
      );
    }

    for (
      let pageIndex = newTotalPages;
      pageIndex < oldTotalPages;
      pageIndex++
    ) {
      await uploadJson(
        `catalog/indexes/category-pages/${handle}/${pageNumber(pageIndex)}.json`,
        []
      );
    }
  }

  const collectionCounts = new Map();
  const brandCounts = new Map();

  for (const item of catalog) {
    for (const tag of unique(item.tags || []).map(slugify).filter(Boolean)) {
      collectionCounts.set(tag, (collectionCounts.get(tag) || 0) + 1);
    }

    if (item.vendor) {
      brandCounts.set(
        item.vendor,
        (brandCounts.get(item.vendor) || 0) + 1
      );
    }
  }

  const collections = Array.from(collectionCounts.entries())
    .map(([handle, count]) => ({
      title: titleFromHandle(handle),
      handle,
      count,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  const brands = Array.from(brandCounts.entries())
    .map(([title, count]) => ({
      handle: title,
      title,
      count,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  await uploadJson("catalog/indexes/category-meta.json", categoryMeta);
  await uploadJson("catalog/indexes/collections.json", collections);
  await uploadJson("catalog/indexes/filter-index.json", {
    categories: collections,
    brands,
  });

  const searchIndex = catalog
    .map(buildSearchItem)
    .sort((a, b) => String(a.t || "").localeCompare(String(b.t || "")));

  await uploadJson("catalog/indexes/search-index.json", searchIndex);

  const searchGroups = new Map(
    SEARCH_SHARDS.map((shard) => [shard, []])
  );

  for (const item of searchIndex) {
    const shard = getSearchShard(item.t || item.h);
    searchGroups.get(shard).push(item);
  }

  for (const shard of SEARCH_SHARDS) {
    await uploadJson(`catalog/search/${shard}.json`, searchGroups.get(shard));
  }

  await uploadJson("catalog/indexes/stats.json", {
    products: catalog.length,
    variants: catalog.reduce(
      (sum, item) => sum + Number(item.variantCount || 0),
      0
    ),
    collections: collections.length,
  });
}

async function main() {
  const { collectionName, apply, yes } = parseArguments();

  if (!collectionName) {
    console.error(
      'Preview: node scripts/importer/sync-collection.js "Collection Name"'
    );
    console.error(
      'Apply:   node scripts/importer/sync-collection.js "Collection Name" --apply'
    );
    process.exit(1);
  }

  const collectionFolder = path.join(
    config.IMPORTS_DIR,
    collectionName
  );

  if (!fs.existsSync(collectionFolder)) {
    throw new Error(`Collection folder not found: ${collectionFolder}`);
  }

  const excelFiles = getExcelFiles(collectionFolder);

  if (!excelFiles.length) {
    throw new Error("No Excel files found in the collection folder.");
  }

  const collectionHandle = slugify(collectionName);
  const currentHandles = readCurrentHandles(excelFiles);
  const catalog = await safeRead("catalog/indexes/catalog-index.json", []);
  const oldCatalogMeta = await safeRead(
    "catalog/indexes/catalog-meta.json",
    {}
  );
  const oldCategoryMeta = await safeRead(
    "catalog/indexes/category-meta.json",
    {}
  );

  const candidateHandles = catalog
    .filter((item) =>
      (item.tags || []).map(slugify).includes(collectionHandle)
    )
    .map((item) => item.handle);

  const registry = await loadRegistryForHandles(candidateHandles);

  const missingHandles = candidateHandles.filter((handle) => {
    if (currentHandles.has(handle)) return false;

    const entry = getRegistryEntry(registry, handle);

    return (entry?.sources || []).some(
      (source) => source.collectionHandle === collectionHandle
    );
  });

  const previewRows = [];

  for (const handle of missingHandles) {
    const entry = getRegistryEntry(registry, handle);
    const product = await safeRead(productKey(handle), null);

    const remainingSources = (entry?.sources || []).filter(
      (source) => source.collectionHandle !== collectionHandle
    );

    const remainingTags = unique(
      (product?.tags || entry?.tags || [])
        .map(slugify)
        .filter((tag) => tag && tag !== collectionHandle)
    );

    previewRows.push({
      handle,
      action:
        remainingSources.length === 0 && remainingTags.length === 0
          ? "DELETE PRODUCT"
          : "REMOVE COLLECTION TAG",
      remainingSources: remainingSources
        .map((source) => source.collectionHandle)
        .join(", "),
      remainingTags: remainingTags.join(", "),
    });
  }

  console.log("");
  console.log(`Collection: ${collectionName}`);
  console.log(`Current Excel handles: ${currentHandles.size}`);
  console.log(`Existing registered collection handles: ${candidateHandles.length}`);
  console.log(`Missing from Excel: ${missingHandles.length}`);
  console.log("");

  if (!previewRows.length) {
    console.log("Nothing to remove.");
    return;
  }

  console.table(previewRows);

  if (!apply) {
    console.log("");
    console.log("PREVIEW ONLY — no Cloudflare R2 data was changed.");
    console.log(
      `Apply with: node scripts/importer/sync-collection.js "${collectionName}" --apply`
    );
    return;
  }

  if (!yes) {
    const confirmed = await askForConfirmation(
      collectionName,
      missingHandles.length
    );

    if (!confirmed) {
      console.log("Cancelled. No Cloudflare R2 data was changed.");
      return;
    }
  }

  const updatedProducts = new Map();
  const fullyDeletedHandles = new Set();
  const changedRegistryShards = new Map();

  for (const row of previewRows) {
    const handle = row.handle;
    const entry = getRegistryEntry(registry, handle);
    if (!entry) continue;

    const product = await safeRead(productKey(handle), null);

    const remainingSources = (entry.sources || []).filter(
      (source) => source.collectionHandle !== collectionHandle
    );

    const remainingTags = unique(
      (product?.tags || entry.tags || [])
        .map(slugify)
        .filter((tag) => tag && tag !== collectionHandle)
    );

    const shouldDeleteProduct =
      remainingSources.length === 0 && remainingTags.length === 0;

    const shard = registryShard(handle);

    if (!changedRegistryShards.has(shard)) {
      changedRegistryShards.set(
        shard,
        await safeRead(registryKey(shard), {})
      );
    }

    const shardData = changedRegistryShards.get(shard);

    if (shouldDeleteProduct) {
      delete shardData[handle];
      fullyDeletedHandles.add(handle);
      continue;
    }

    shardData[handle] = {
      ...entry,
      sources: remainingSources,
      tags: remainingTags,
      updatedAt: new Date().toISOString(),
    };

    if (product) {
      product.tags = remainingTags;

      if (slugify(product.collection) === collectionHandle) {
        product.collection =
          remainingSources[0]?.collectionHandle ||
          remainingTags[0] ||
          product.collection;
      }

      if (slugify(product.category) === collectionHandle) {
        product.category = remainingTags[0] || product.category;
      }

      updatedProducts.set(handle, product);
    }
  }

  for (const product of updatedProducts.values()) {
    await uploadJson(productKey(product.handle), product);
  }

  for (const handle of fullyDeletedHandles) {
    await remove(productKey(handle));
  }

  for (const [shard, data] of changedRegistryShards.entries()) {
    await uploadJson(registryKey(shard), data);
  }

  const nextCatalog = catalog
    .filter((item) => !fullyDeletedHandles.has(item.handle))
    .map((item) => {
      const product = updatedProducts.get(item.handle);

      if (!product) return item;

      const firstVariant = product.variants?.[0] || {};

      return {
        ...item,
        collection: product.collection,
        collectionTitle: titleFromHandle(product.collection),
        category: product.category,
        categoryTitle: titleFromHandle(product.category),
        tags: unique(product.tags || []).map(slugify).filter(Boolean),
        imageFolder: product.imageFolder || item.imageFolder || product.collection,
        image: product.images?.[0] || "",
        partNumber: firstVariant.partNumber || "",
        vendor: firstVariant.vendor || "",
        variantCount: product.variants?.length || 0,
        price: Math.min(
          ...(product.variants || [])
            .map((variant) => Number(variant.price || 0))
            .filter((price) => price > 0),
          Infinity
        ),
      };
    })
    .map((item) => ({
      ...item,
      price: Number.isFinite(item.price) ? item.price : 0,
    }));

  await rebuildAllDerivedIndexes(
    nextCatalog,
    oldCatalogMeta,
    oldCategoryMeta
  );

  console.log("");
  console.log(`Collection tags removed: ${updatedProducts.size}`);
  console.log(`Products fully deleted: ${fullyDeletedHandles.size}`);
  console.log("All catalogue, collection, filter, stats, page and search indexes rebuilt.");
  console.log("Deletion sync completed safely.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
