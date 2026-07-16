const fs = require("fs");
const path = require("path");

const config = require("./config");
const { importCollection } = require("./import-collection");
const progress = require("./progress");

function getCollectionFolders() {
  if (!fs.existsSync(config.IMPORTS_DIR)) return [];

  return fs
    .readdirSync(config.IMPORTS_DIR, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .filter((item) => item.name.toLowerCase() !== "reports")
    .map((item) => path.join(config.IMPORTS_DIR, item.name))
    .filter((folder) =>
      fs
        .readdirSync(folder)
        .some((file) => file.toLowerCase().endsWith(".xlsx"))
    )
    .sort((a, b) => a.localeCompare(b));
}

async function main() {
  progress.title("SPARESCO INCREMENTAL IMPORT");

  const folders = getCollectionFolders();

  if (!folders.length) {
    throw new Error("No collection folders with Excel files found in imports/");
  }

  progress.info(`Collections found: ${folders.length}`);

  const results = [];

  for (let index = 0; index < folders.length; index++) {
    const folder = folders[index];
    const collectionName = path.basename(folder);

    try {
      const importedProducts = await importCollection(
        folder,
        index + 1,
        folders.length
      );

      results.push({
        collection: collectionName,
        status: "COMPLETED",
        importedThisRun: importedProducts.length,
        error: "",
      });
    } catch (error) {
      results.push({
        collection: collectionName,
        status: "FAILED",
        importedThisRun: 0,
        error: error.message,
      });

      progress.error(`${collectionName}: ${error.message}`);
      progress.info("Continuing with the next collection.");
    }
  }

  progress.section("Import-all summary");

  for (const result of results) {
    console.log(
      `${result.status.padEnd(9)} ${result.collection}` +
        (result.importedThisRun
          ? ` — imported ${result.importedThisRun}`
          : "") +
        (result.error ? ` — ${result.error}` : "")
    );
  }

  const failures = results.filter((result) => result.status === "FAILED");

  if (failures.length) {
    process.exitCode = 1;
    progress.error(`${failures.length} collection(s) failed.`);
  } else {
    progress.success("All collections completed.");
  }
}

main().catch((error) => {
  progress.error(error.message);
  console.error(error);
  process.exit(1);
});
