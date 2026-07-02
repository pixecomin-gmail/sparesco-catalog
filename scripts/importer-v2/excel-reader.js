const path = require("path");
const XLSX = require("xlsx");
const { clean } = require("./utils");

function readExcelFile(excelPath) {
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
  });

  return rows.map((row, index) => ({
    ...row,
    __excelFile: path.basename(excelPath),
    __sourceRow: index + 2,
  }));
}

function readExcelFiles(excelPaths) {
  return excelPaths.flatMap(readExcelFile);
}

function getValue(row, keys) {
  for (const key of keys) {
    const value = clean(row[key]);
    if (value) return value;
  }

  return "";
}

module.exports = {
  readExcelFiles,
  getValue,
};