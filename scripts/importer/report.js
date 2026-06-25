// scripts/importer/report.js

const fs = require("fs");
const path = require("path");
const CONSTANTS = require("./constants");

function ensure(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function now() {
  const d = new Date();

  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0") +
    "_" +
    String(d.getHours()).padStart(2, "0") +
    "-" +
    String(d.getMinutes()).padStart(2, "0") +
    "-" +
    String(d.getSeconds()).padStart(2, "0")
  );
}

function csv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
}

function create(collection, summary, duplicates = [], failedImages = []) {
  ensure(CONSTANTS.REPORTS_DIR);

  const folder = path.join(
    CONSTANTS.REPORTS_DIR,
    `${now()}_${collection.replace(/\s+/g, "_")}`
  );

  ensure(folder);

  fs.writeFileSync(
    path.join(folder, "summary.json"),
    JSON.stringify(summary, null, 2),
    "utf8"
  );

  fs.writeFileSync(
    path.join(folder, "summary.csv"),
    csv([
      ["Metric", "Value"],
      ["Rows Found", summary.rowsFound],
      ["Products Found", summary.productsFound],
      ["Variants Found", summary.variantsFound],
      ["New Products", summary.newProducts],
      ["Updated Products", summary.updatedProducts],
      ["New Variants", summary.newVariants],
      ["Updated Variants", summary.updatedVariants],
      ["Images Uploaded", summary.imagesUploaded],
      ["Failed Images", summary.failedImages],
      ["Time Taken", summary.timeTaken],
      ["Completed At", summary.completedAt],
    ]),
    "utf8"
  );

  fs.writeFileSync(
    path.join(folder, "duplicates.csv"),
    csv([["Handle", "Variant", "Reason"], ...duplicates]),
    "utf8"
  );

  fs.writeFileSync(
    path.join(folder, "failed-images.csv"),
    csv([["Image URL", "Reason"], ...failedImages]),
    "utf8"
  );

  fs.writeFileSync(
    path.join(folder, "import.log"),
    [
      `Collection : ${collection}`,
      `Rows Found : ${summary.rowsFound}`,
      `Products Found : ${summary.productsFound}`,
      `Variants Found : ${summary.variantsFound}`,
      `New Products : ${summary.newProducts}`,
      `Updated Products : ${summary.updatedProducts}`,
      `New Variants : ${summary.newVariants}`,
      `Updated Variants : ${summary.updatedVariants}`,
      `Images Uploaded : ${summary.imagesUploaded}`,
      `Failed Images : ${summary.failedImages}`,
      `Time Taken : ${summary.timeTaken}`,
      `Completed : ${summary.completedAt}`,
    ].join("\n"),
    "utf8"
  );

  return folder;
}

module.exports = {
  create,
};