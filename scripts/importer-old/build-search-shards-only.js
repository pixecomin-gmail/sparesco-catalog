const { readJson, uploadJson } = require("./r2-client");

function getShardKey(text) {
  const first = String(text || "").trim().toLowerCase()[0];

  if (!first) return "other";
  if (first >= "0" && first <= "9") return first;
  if (first >= "a" && first <= "z") return first;

  return "other";
}

async function main() {
  console.log("Reading search-index.json...");

  const items = await readJson("catalog/indexes/search-index.json");
  const shards = new Map();

  for (const item of items) {
    const key = getShardKey(item.t || item.h);
    if (!shards.has(key)) shards.set(key, []);
    shards.get(key).push(item);
  }

  console.log(`Shards: ${shards.size}`);

  for (const [key, shardItems] of shards.entries()) {
    await uploadJson(`catalog/search/${key}.json`, shardItems);
    console.log(`${key}: ${shardItems.length}`);
  }

  console.log("DONE");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});