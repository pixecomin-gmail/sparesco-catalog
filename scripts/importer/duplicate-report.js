const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const config = require("./config");

function ensureReportsDir() {
  if (!fs.existsSync(config.REPORTS_DIR)) {
    fs.mkdirSync(config.REPORTS_DIR, {
      recursive: true,
    });
  }
}

function writeDuplicateReport(rows) {
  ensureReportsDir();

  const filePath = path.join(
    config.REPORTS_DIR,
    "duplicate-review.xlsx"
  );

  const workbook = XLSX.utils.book_new();

  const sheet = XLSX.utils.json_to_sheet(
    rows.length
      ? rows
      : [{ Result: "No duplicate candidates found" }]
  );

  XLSX.utils.book_append_sheet(
    workbook,
    sheet,
    "Duplicate Review"
  );

  XLSX.writeFile(workbook, filePath);

  return filePath;
}

module.exports = {
  writeDuplicateReport,
};
