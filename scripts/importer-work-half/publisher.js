const readline = require("readline");

const { uploadJson } = require("./r2-client");
const {
  slugify,
  unique,
  titleFromHandle,
  pageNumber,
} = require("./utils");
const config = require("./config");

const PUBLISH_CONCURRENCY = Number(
  process.env.IMPORT_PUBLISH_CONCURRENCY || 15
);

function lowestPrice(variants) {
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
    tags: unique(product.tags || []).map(slugify).filter(Boolean),
    image: product.images?.[0] || "",
    partNumber: firstVariant.partNumber || "",
    vendor: firstVariant.vendor || "",
    variantCount: product.variants?.length || 0,
    price: lowestPrice(product.variants),
  };
}

function buildSearchItem(product, summary) {
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
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

function searchShard(text) {
  const first = String(text || "").trim().toLowerCase()[0];

  if (!first) return "other";
  if (first >= "0" && first <= "9") return first;
  if (first >= "a" && first <= "z") return first;

  return "other";
}

function drawProgress(label, current, total) {
  const width = 28;
  const ratio = total ? current / total : 1;
  const filled = Math.min(width, Math.round(ratio * width));

  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);

  process.stdout.write(
    `${label} [` +
      "█".repeat(filled) +
      "░".repeat(width - filled) +
      `] ${current}/${total}`
  );

  if (current >= total) process.stdout.write("\n");
}

async function runUploads(label, jobs) {
  if (!jobs.length) return;

  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= jobs.length) return;

      const job = jobs[index];
      await uploadJson(job.key, job.data);

      completed++;
      drawProgress(label, completed, jobs.length);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(PUBLISH_CONCURRENCY, jobs.length) },
      () => worker()
    )
  );
}

async function publishAll(products) {
  const startedAt = Date.now();

  console.log("");
  console.log("==================================================");
  console.log("PUBLISHING WEBSITE INDEXES");
  console.log("==================================================");
  console.log(`Products: ${products.length}`);
  console.log(`Publish concurrency: ${PUBLISH_CONCURRENCY}`);
  console.log("");

  const catalog = products
    .map(summarizeProduct)
    .sort((a, b) =>
      String(a.title || "").localeCompare(String(b.title || ""))
    );

  const catalogJobs = [
    {
      key: "catalog/indexes/catalog-index.json",
      data: catalog,
    },
  ];

  const catalogPages = Math.ceil(
    catalog.length / config.PAGE_SIZE.catalog
  );

  catalogJobs.push({
    key: "catalog/indexes/catalog-meta.json",
    data: {
      totalProducts: catalog.length,
      pageSize: config.PAGE_SIZE.catalog,
      totalPages: catalogPages,
    },
  });

  for (let i = 0; i < catalogPages; i++) {
    catalogJobs.push({
      key: `catalog/indexes/catalog-pages/${pageNumber(i)}.json`,
      data: catalog.slice(
        i * config.PAGE_SIZE.catalog,
        (i + 1) * config.PAGE_SIZE.catalog
      ),
    });
  }

  await runUploads("Catalog", catalogJobs);

  const categoryGroups = new Map();

  for (const item of catalog) {
    for (const tag of item.tags || []) {
      if (!categoryGroups.has(tag)) categoryGroups.set(tag, []);
      categoryGroups.get(tag).push(item);
    }
  }

  const categoryMeta = {};
  const collections = [];
  const categoryJobs = [];

  for (const [handle, items] of categoryGroups.entries()) {
    const totalPages = Math.ceil(
      items.length / config.PAGE_SIZE.category
    );

    categoryMeta[handle] = {
      totalProducts: items.length,
      pageSize: config.PAGE_SIZE.category,
      totalPages,
    };

    collections.push({
      title: titleFromHandle(handle),
      handle,
      count: items.length,
    });

    for (let i = 0; i < totalPages; i++) {
      categoryJobs.push({
        key:
          `catalog/indexes/category-pages/${handle}/` +
          `${pageNumber(i)}.json`,
        data: items.slice(
          i * config.PAGE_SIZE.category,
          (i + 1) * config.PAGE_SIZE.category
        ),
      });
    }
  }

  await runUploads("Collection pages", categoryJobs);

  collections.sort((a, b) => a.title.localeCompare(b.title));

  const brandCounts = new Map();

  for (const item of catalog) {
    if (!item.vendor) continue;

    brandCounts.set(
      item.vendor,
      (brandCounts.get(item.vendor) || 0) + 1
    );
  }

  const brands = Array.from(brandCounts.entries())
    .map(([title, count]) => ({
      handle: title,
      title,
      count,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  await runUploads("Metadata", [
    {
      key: "catalog/indexes/category-meta.json",
      data: categoryMeta,
    },
    {
      key: "catalog/indexes/collections.json",
      data: collections,
    },
    {
      key: "catalog/indexes/filter-index.json",
      data: { categories: collections, brands },
    },
  ]);

  const summaryByHandle = new Map(
    catalog.map((item) => [item.handle, item])
  );

  const searchIndex = products
    .map((product) =>
      buildSearchItem(
        product,
        summaryByHandle.get(product.handle)
      )
    )
    .sort((a, b) =>
      String(a.t || "").localeCompare(String(b.t || ""))
    );

  const shardMap = new Map(
    [
      ..."0123456789abcdefghijklmnopqrstuvwxyz",
      "other",
    ].map((key) => [key, []])
  );

  for (const item of searchIndex) {
    shardMap.get(searchShard(item.t || item.h)).push(item);
  }

  const searchJobs = [
    {
      key: "catalog/indexes/search-index.json",
      data: searchIndex,
    },
  ];

  for (const [key, items] of shardMap.entries()) {
    searchJobs.push({
      key: `catalog/search/${key}.json`,
      data: items,
    });
  }

  await runUploads("Search", searchJobs);

  const registryShards = new Map(
    [
      ..."0123456789abcdefghijklmnopqrstuvwxyz",
      "other",
    ].map((key) => [key, {}])
  );

  for (const product of products) {
    const first = product.handle?.[0]?.toLowerCase();

    const shard =
      first >= "0" && first <= "9"
        ? first
        : first >= "a" && first <= "z"
        ? first
        : "other";

    registryShards.get(shard)[product.handle] = {
      handle: product.handle,
      sources: product.sources || [],
      tags: unique(product.tags || [])
        .map(slugify)
        .filter(Boolean),
      updatedAt: new Date().toISOString(),
    };
  }

  const registryJobs = [];

  for (const [key, data] of registryShards.entries()) {
    registryJobs.push({
      key: `catalog/handles/${key}.json`,
      data,
    });
  }

  await runUploads("Registry", registryJobs);

  await runUploads("Statistics", [
    {
      key: "catalog/indexes/stats.json",
      data: {
        products: catalog.length,
        variants: catalog.reduce(
          (sum, item) =>
            sum + Number(item.variantCount || 0),
          0
        ),
        collections: collections.length,
      },
    },
  ]);

  console.log("");
  console.log(
    `Published ${catalog.length} products in ` +
      `${((Date.now() - startedAt) / 1000).toFixed(1)}s.`
  );
}

module.exports = { publishAll };
