const XLSX = require("xlsx");
const CONSTANTS = require("./constants");

function clean(value) {
  return String(value || "").trim();
}

function readExcel(excelPath) {
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  return XLSX.utils.sheet_to_json(sheet, {
    defval: "",
  });
}

function readExcels(excelPaths) {
  let rows = [];

  for (const excelPath of excelPaths) {
    rows = rows.concat(readExcel(excelPath));
  }

  return rows;
}

function validateColumns(rows) {
  if (!rows.length) {
    throw new Error("Excel is empty.");
  }

  const columns = Object.keys(rows[0]);

  const missing = CONSTANTS.REQUIRED_COLUMNS.filter(
    (column) => !columns.includes(column)
  );

  if (missing.length) {
    throw new Error(
      "Missing required columns:\n\n" + missing.join("\n")
    );
  }
}

function groupProducts(rows) {
  const products = new Map();

  let missingImages = 0;

  for (const row of rows) {
    const handle = clean(row["Handle"]);

    if (!handle) continue;

    if (!products.has(handle)) {
      products.set(handle, {
        handle,
        rows: [],
      });
    }

    products.get(handle).rows.push(row);

    if (!clean(row["Image Src"]) && !clean(row["Variant Image"])) {
      missingImages++;
    }
  }

  return {
    rows: rows.length,
    products: products.size,
    variants: rows.length,
    missingImages,
    groupedProducts: products,
  };
}

module.exports = {
  readExcel,
  readExcels,
  validateColumns,
  groupProducts,
};