const config = require("./config");
const { openDb } = require("./db");
const { uploadJson } = require("./r2-client");
const { clean, slugify, unique, titleFromHandle } = require("./utils");
const { bar, heading } = require("./progress");

function compact(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function lowestPrice(variants) {
  const prices = (variants || [])
    .map((variant) => Number(variant.price || 0))
    .filter((price) => price > 0);

  return prices.length ? Math.min(...prices) : 0;
}

function prefixOf(value) {
  const normalized = compact(value);
  return normalized.length >= 2 ? normalized.slice(0, 2) : "";
}

function buildSearchItem(product) {
  const variants = product.variants || [];
  const firstVariant = variants[0] || {};

  const searchValues = unique([
    product.handle,
    product.title,
    product.collection,
    product.category,
    ...(product.tags || []),
    ...variants.flatMap((variant) => [
      variant.title,
      variant.partNumber,
      variant.vendor,
      variant.option1Value,
    ]),
  ]);

  return {
    prefixes: unique(searchValues.map(prefixOf).filter(Boolean)),
    item: {
      h: product.handle,
      t: product.title,
      c: product.collection,
      ct: titleFromHandle(product.collection),
      p: firstVariant.partNumber || "",
      v: firstVariant.vendor || "",
      i: product.images?.[0] || "",
      vc: variants.length,
      pr: lowestPrice(variants),
      x: searchValues.map(compact).filter(Boolean).join(" "),
    },
  };
}

async function uploadShardJobs(jobs) {
  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= jobs.length) return;

      const job = jobs[index];
      await uploadJson(job.key, job.data);

      completed++;
      bar("Search v2 shards", completed, jobs.length);
    }
  }

  const concurrency = Math.min(
    Number(config.CONCURRENCY.publish || 8),
    8,
    jobs.length
  );

  await Promise.all(
    Array.from({ length: concurrency }, () => worker())
  );
}

async function main() {
  heading("PUBLISH FAST SEARCH V2");

  const db = openDb();
  const total = Number(
    db.prepare(
      "SELECT COUNT(*) AS count FROM products WHERE status = 'completed'"
    ).get().count || 0
  );

  if (!total) {
    throw new Error("No completed products found in SQLite.");
  }

  console.log(`Completed products: ${total}`);

  const shards = new Map();
  let processed = 0;

  const statement = db.prepare(
    "SELECT product_json FROM products WHERE status = 'completed' ORDER BY handle"
  );

  for (const row of statement.iterate()) {
    const product = JSON.parse(row.product_json);
    const { prefixes, item } = buildSearchItem(product);

    for (const prefix of prefixes) {
      if (!shards.has(prefix)) shards.set(prefix, new Map());
      shards.get(prefix).set(product.handle, item);
    }

    processed++;

    if (processed % 1000 === 0 || processed === total) {
      bar("Building search v2", processed, total);
    }
  }

  const jobs = Array.from(shards.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([prefix, items]) => ({
      key: `catalog/search-v2/${prefix}.json`,
      data: Array.from(items.values()),
    }));

  console.log(`Two-character shards: ${jobs.length}`);
  await uploadShardJobs(jobs);

  await uploadJson("catalog/search-v2/meta.json", {
    version: 2,
    products: total,
    shards: jobs.length,
    generatedAt: new Date().toISOString(),
  });

  db.close();

  console.log("");
  console.log(`Fast search v2 published for ${total} products.`);
}

main().catch((error) => {
  console.error("");
  console.error("FAST SEARCH PUBLISH FAILED");
  console.error(error);
  process.exit(1);
});
