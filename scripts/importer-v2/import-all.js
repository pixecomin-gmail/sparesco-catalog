const fs = require("fs");
const path = require("path");

const config = require("./config");
const { importCollection } = require("./import-collection");
const { uploadJson } = require("./r2-client");
const {
  buildCatalogIndex,
  buildCollections,
  buildStats,
} = require("./catalog-builder");

function getCollectionFolders() {
  return fs
    .readdirSync(config.IMPORTS_DIR, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => path.join(config.IMPORTS_DIR, item.name))
    .sort();
}

async function main() {
  console.log("SPARESCO IMPORTER V2");
  console.log("====================");

  const folders = getCollectionFolders();
  const allProducts = [];

  for (const folder of folders) {
    const products = await importCollection(folder);
    allProducts.push(...products);
  }

  console.log("\nBuilding indexes...");

  const catalogIndex = buildCatalogIndex(allProducts);
  const collections = buildCollections(allProducts);
  const stats = buildStats(allProducts, collections);

  await uploadJson(
    `${config.CATALOG.INDEXES}/${config.INDEX_FILES.CATALOG}`,
    catalogIndex
  );

  await uploadJson(
    `${config.CATALOG.INDEXES}/${config.INDEX_FILES.COLLECTIONS}`,
    collections
  );

  await uploadJson(
    `${config.CATALOG.INDEXES}/${config.INDEX_FILES.STATS}`,
    stats
  );

  console.log("Indexes uploaded.");
  console.log(stats);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});