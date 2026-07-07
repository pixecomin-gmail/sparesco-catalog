const { readJson, uploadJson } = require("./r2-client");

const PAGE_SIZE = 1000;

async function main() {
  console.log("Reading existing catalog-index.json...");

  const catalogIndex = await readJson("catalog/indexes/catalog-index.json");

  console.log(`Products found: ${catalogIndex.length}`);

  const totalPages = Math.ceil(catalogIndex.length / PAGE_SIZE);

  console.log(`Creating ${totalPages} catalog pages...`);

  await uploadJson("catalog/indexes/catalog-meta.json", {
    totalProducts: catalogIndex.length,
    pageSize: PAGE_SIZE,
    totalPages,
  });

  for (let i = 0; i < totalPages; i++) {
    const pageNumber = String(i + 1).padStart(4, "0");
    const page = catalogIndex.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE);

    await uploadJson(
      `catalog/indexes/catalog-pages/${pageNumber}.json`,
      page
    );

    console.log(`Uploaded page ${pageNumber}/${String(totalPages).padStart(4, "0")}`);
  }

  console.log("DONE");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});