const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

function timestamp() {
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

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeWorkbook(filePath, sheetName, rows) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filePath);
}

function createReportFolder(collectionFolder) {
  const folder = path.join(collectionFolder, "reports", timestamp());
  ensureDir(folder);
  return folder;
}

function writeReports(reportFolder, data) {
  writeWorkbook(
    path.join(reportFolder, "duplicates.xlsx"),
    "Duplicates",
    data.duplicates || []
  );

  writeWorkbook(
    path.join(reportFolder, "variant-conflicts.xlsx"),
    "Variant Conflicts",
    data.variantConflicts || []
  );

  writeWorkbook(
    path.join(reportFolder, "merged-products.xlsx"),
    "Merged Products",
    data.mergedProducts || []
  );

  writeWorkbook(
    path.join(reportFolder, "failed-images.xlsx"),
    "Failed Images",
    data.failedImages || []
  );

  writeWorkbook(
    path.join(reportFolder, "import-summary.xlsx"),
    "Summary",
    data.summary || []
  );
}

module.exports = {
  createReportFolder,
  writeReports,
};