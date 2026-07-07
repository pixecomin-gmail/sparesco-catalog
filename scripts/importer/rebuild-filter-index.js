const { readJson, uploadJson } = require("./r2-client");

async function main() {
  const catalog = await readJson("catalog/indexes/catalog-index.json");

  const categories = new Map();
  const brands = new Map();

  for (const p of catalog) {
    if (p.collection) {
      const key = p.collection;
      const title = p.collectionTitle || p.collection;
      categories.set(key, {
        handle: key,
        title,
        count: (categories.get(key)?.count || 0) + 1,
      });
    }

    if (p.vendor) {
      const key = p.vendor;
      brands.set(key, {
        handle: key,
        title: key,
        count: (brands.get(key)?.count || 0) + 1,
      });
    }
  }

  await uploadJson("catalog/indexes/filter-index.json", {
    categories: Array.from(categories.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    ),
    brands: Array.from(brands.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    ),
  });

  console.log("DONE: filter-index.json uploaded");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});