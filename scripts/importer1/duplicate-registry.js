const {
  canonicalize,
  registryShard,
  registryKey,
  unique,
} = require("./utils");

const {
  safeReadJson,
} = require("./r2-client");

async function loadRegistryForCanonicalKeys(keys) {
  const shards = [
    ...new Set((keys || []).map(registryShard)),
  ];

  const registryByShard = new Map();

  await Promise.all(
    shards.map(async (shard) => {
      const data = await safeReadJson(
        registryKey(shard),
        {}
      );

      registryByShard.set(
        shard,
        data && typeof data === "object" && !Array.isArray(data)
          ? data
          : {}
      );
    })
  );

  return registryByShard;
}

function getRegistryEntry(registryByShard, canonicalKey) {
  const key = canonicalize(canonicalKey);

  return (
    registryByShard.get(registryShard(key))?.[key] ||
    null
  );
}

function buildDuplicateRegistryJobs(products) {
  const shardMap = new Map(
    [
      ..."0123456789abcdefghijklmnopqrstuvwxyz",
      "other",
    ].map((shard) => [shard, {}])
  );

  const updatedAt = new Date().toISOString();

  for (const product of products) {
    const canonicalKey =
      canonicalize(product.canonicalKey || product.handle);

    const sources = product.sources || [];
    const shard = registryShard(canonicalKey);

    shardMap.get(shard)[canonicalKey] = {
      canonicalKey,
      publishedHandle: product.handle,
      title: product.title,
      tags: unique(product.tags || []),
      collections: unique(
        sources.map((source) => source.collectionHandle)
      ),
      sources,
      updatedAt,
    };
  }

  return Array.from(shardMap.entries()).map(
    ([shard, data]) => ({
      key: registryKey(shard),
      data,
    })
  );
}

module.exports = {
  loadRegistryForCanonicalKeys,
  getRegistryEntry,
  buildDuplicateRegistryJobs,
};
