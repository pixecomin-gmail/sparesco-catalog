const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const config = require("./config");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeWorkbook(filePath, sheetName, rows) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{}]);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filePath);
}

function writeRunReports(data) {
  const dir = path.join(config.STATE_DIR, "reports");
  ensureDir(dir);

  writeWorkbook(path.join(dir, "duplicates.xlsx"), "Duplicates", data.duplicates || []);
  writeWorkbook(path.join(dir, "failed-images.xlsx"), "Failed Images", data.failedImages || []);
  writeWorkbook(path.join(dir, "summary.xlsx"), "Summary", data.summary || []);

  return dir;
}

module.exports = { writeRunReports };
