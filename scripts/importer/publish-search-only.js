const config = require("./config");
const { openDb } = require("./db");
const { uploadJson } = require("./r2-client");
const { slugify, unique, canonicalize, registryShard, registryKey } = require("./utils");
const { bar, heading } = require("./progress");

function searchShard(text) {
  const first = String(text || "").trim().toLowerCase()[0];
  if (!first) return "other";
  if (first >= "0" && first <= "9") return first;
  if (first >= "a" && first <= "z") return first;
  return "other";
}

function lowestPrice(variants) {
  const prices = (variants || [])
    .map((variant) => Number(variant.price || 0))
    .filter((price) => price > 0);

  return prices.length ? Math.min(...prices) : 0;
}

function makeSearchItem(product) {
  const firstVariant = product.variants?.[0] || {};
  const variantText = (product.variants || [])
    .flatMap((variant) => [
      variant.title,
      variant.partNumber,
      variant.vendor,
      variant.option1Value,
    ])
    .filter(Boolean)
    .join(" ");

  return {
    h: product.handle,
    t: product.title,
    c: product.collection,
    ct: product.collectionTitle || "",
    tags: unique(product.tags || []).map(slugify).filter(Boolean),
    p: firstVariant.partNumber || "",
    v: firstVariant.vendor || "",
    i: product.images?.[0] || "",
    vc: product.variants?.length || 0,
    pr: lowestPrice(product.variants),
    s: [
      product.handle,
      product.title,
      product.collection,
      product.category,
      variantText,
      ...(product.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

async function uploadJobs(label, jobs) {
  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= jobs.length) return;

      const job = jobs[index];
      await uploadJson(job.key, job.data);

      completed++;
      bar(label, completed, jobs.length);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(config.CONCURRENCY.publish || 12, jobs.length) },
      () => worker()
    )
  );
}

async function main() {
  heading("PUBLISH SEARCH + REGISTRIES ONLY");

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

  const searchShards = new Map(
    [..."0123456789abcdefghijklmnopqrstuvwxyz", "other"].map((key) => [key, []])
  );

  const handleRegistry = new Map(
    [..."0123456789abcdefghijklmnopqrstuvwxyz", "other"].map((key) => [key, {}])
  );

  const duplicateRegistry = new Map(
    [..."0123456789abcdefghijklmnopqrstuvwxyz", "other"].map((key) => [key, {}])
  );

  let processed = 0;
  let variantCount = 0;

  const statement = db.prepare(
    "SELECT product_json FROM products WHERE status = 'completed' ORDER BY handle"
  );

  for (const row of statement.iterate()) {
    const product = JSON.parse(row.product_json);
    const searchItem = makeSearchItem(product);

    searchShards
      .get(searchShard(searchItem.t || searchItem.h))
      .push(searchItem);

    const first = String(product.handle || "").toLowerCase()[0];
    const handleShard =
      first >= "0" && first <= "9"
        ? first
        : first >= "a" && first <= "z"
        ? first
        : "other";

    handleRegistry.get(handleShard)[product.handle] = {
      handle: product.handle,
      sources: product.sources || [],
      tags: unique(product.tags || []).map(slugify).filter(Boolean),
      updatedAt: new Date().toISOString(),
    };

    const canonicalKey = canonicalize(product.canonicalKey || product.handle);
    duplicateRegistry.get(registryShard(canonicalKey))[canonicalKey] = {
      canonicalKey,
      publishedHandle: product.handle,
      title: product.title,
      tags: unique(product.tags || []),
      collections: unique(
        (product.sources || []).map((source) => source.collectionHandle)
      ),
      sources: product.sources || [],
      updatedAt: new Date().toISOString(),
    };

    variantCount += product.variants?.length || 0;
    processed++;

    if (processed % 1000 === 0 || processed === total) {
      bar("Building indexes", processed, total);
    }
  }

  await uploadJobs(
    "Search shards",
    Array.from(searchShards.entries()).map(([key, data]) => ({
      key: `catalog/search/${key}.json`,
      data,
    }))
  );

  await uploadJobs(
    "Handle registry",
    Array.from(handleRegistry.entries()).map(([key, data]) => ({
      key: `catalog/handles/${key}.json`,
      data,
    }))
  );

  await uploadJobs(
    "Duplicate registry",
    Array.from(duplicateRegistry.entries()).map(([key, data]) => ({
      key: registryKey(key),
      data,
    }))
  );

  await uploadJobs("Statistics", [
    {
      key: "catalog/indexes/stats.json",
      data: {
        products: total,
        variants: variantCount,
      },
    },
  ]);

  db.close();

  console.log("");
  console.log(`Search and registries published for ${total} products.`);
}

main().catch((error) => {
  console.error("");
  console.error("SEARCH PUBLISH FAILED");
  console.error(error);
  process.exit(1);
});
