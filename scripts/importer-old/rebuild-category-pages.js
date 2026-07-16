const { readJson, uploadJson } = require("./r2-client");
const { slugify } = require("./utils");

const PAGE_SIZE = 24;

async function main() {
  console.log("Reading catalog-index from R2...");

  const catalog = await readJson("catalog/indexes/catalog-index.json");

  console.log(`Catalog loaded: ${catalog.length}`);

  const groups = new Map();

  for (const product of catalog) {
    for (const tag of product.tags || []) {
      const handle = slugify(tag);
      if (!handle) continue;

      if (!groups.has(handle)) groups.set(handle, []);
      groups.get(handle).push(product);
    }
  }

  const meta = {};

  for (const [handle, items] of groups.entries()) {
    const totalPages = Math.ceil(items.length / PAGE_SIZE);

    meta[handle] = {
      totalProducts: items.length,
      pageSize: PAGE_SIZE,
      totalPages,
    };

    for (let i = 0; i < totalPages; i++) {
      const pageNo = String(i + 1).padStart(4, "0");
      const page = items.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE);

      await uploadJson(
        `catalog/indexes/category-pages/${handle}/${pageNo}.json`,
        page
      );

      console.log(`${handle}: ${pageNo}/${String(totalPages).padStart(4, "0")}`);
    }
  }

  await uploadJson("catalog/indexes/category-meta.json", meta);

  console.log("DONE");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});