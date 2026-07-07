const { readJson, uploadJson } = require("./r2-client");

function titleFromHandle(handle) {
  return String(handle || "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function main() {
  console.log("Reading existing catalog-index.json...");

  const products = await readJson("catalog/indexes/catalog-index.json");

  console.log(`Products found: ${products.length}`);
  console.log("Building search-index.json...");

  const searchIndex = products.map((p) => ({
    h: p.handle,
    t: p.title,
    c: p.collection,
    ct: p.collectionTitle || titleFromHandle(p.collection),
    p: p.partNumber || "",
    v: p.vendor || "",
    i: p.image || "",
    vc: p.variantCount || 0,
    pr: p.price || 0,
    s: [
      p.handle,
      p.title,
      p.collection,
      p.collectionTitle,
      p.category,
      p.categoryTitle,
      p.partNumber,
      p.vendor,
      ...(p.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  }));

  await uploadJson("catalog/indexes/search-index.json", searchIndex);

  console.log("DONE: search-index.json uploaded");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});