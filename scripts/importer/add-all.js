const config = require("./config");
const { spawnSync } = require("child_process");

const collections = config.getCollections();

for (const collection of collections) {
  console.log(`Importing ${collection.name}...`);

  spawnSync(
    "node",
    ["scripts/importer/add-collection.js"],
    {
      stdio: "inherit",
    }
  );
}