const { readJson, uploadJson } = require("./r2-client");
const { slugify, unique } = require("./utils");

function registryShard(handle) {
  const first = slugify(handle)[0];
  if (!first) return "other";
  if (first >= "0" && first <= "9") return first;
  if (first >= "a" && first <= "z") return first;
  return "other";
}

function registryKey(shard) {
  return `catalog/handles/${shard}.json`;
}

async function safeReadRegistry(shard) {
  try {
    const data = await readJson(registryKey(shard));
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

async function loadRegistryForHandles(handles) {
  const shards = [...new Set((handles || []).map(registryShard))];
  const registryByShard = new Map();

  await Promise.all(
    shards.map(async (shard) => {
      registryByShard.set(shard, await safeReadRegistry(shard));
    })
  );

  return registryByShard;
}

function getRegistryEntry(registryByShard, handle) {
  const safeHandle = slugify(handle);
  return registryByShard.get(registryShard(safeHandle))?.[safeHandle] || null;
}

function belongsToCollection(entry, collectionHandle) {
  return (entry?.sources || []).some(
    (source) => source.collectionHandle === collectionHandle
  );
}

async function commitRegistryProducts(items, collectionHandle) {
  if (!items.length) return;

  const registryByShard = await loadRegistryForHandles(
    items.map((item) => item.product.handle)
  );
  const changedShards = new Set();

  for (const item of items) {
    const product = item.product;
    const handle = slugify(product.handle);
    const shard = registryShard(handle);
    const shardData = registryByShard.get(shard) || {};
    const existing = shardData[handle] || {};
    const incomingSource = {
      collectionHandle,
      excelFile: item.source?.excelFile || "",
      sourceRow: item.source?.sourceRow || "",
    };

    const sourceMap = new Map();
    for (const source of [...(existing.sources || []), incomingSource]) {
      const key = `${source.collectionHandle}|${source.excelFile}`;
      sourceMap.set(key, source);
    }

    shardData[handle] = {
      handle,
      sources: Array.from(sourceMap.values()),
      tags: unique(product.tags || []).map(slugify).filter(Boolean),
      updatedAt: new Date().toISOString(),
    };

    registryByShard.set(shard, shardData);
    changedShards.add(shard);
  }

  for (const shard of changedShards) {
    await uploadJson(registryKey(shard), registryByShard.get(shard));
  }
}

module.exports = {
  registryShard,
  loadRegistryForHandles,
  getRegistryEntry,
  belongsToCollection,
  commitRegistryProducts,
};
