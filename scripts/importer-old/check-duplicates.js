const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const config = require("./config");
const { getValue } = require("./excel-reader");
const { slugify } = require("./utils");
const {
  loadRegistryForHandles,
  getRegistryEntry,
} = require("./handle-registry");

const REPORT_FILE = path.join(config.IMPORTS_DIR, "duplicate-report.xlsx");

function isGeneratedReport(fileName) {
  const name = String(fileName || "").toLowerCase();
  return (
    name === "duplicate-report.xlsx" ||
    name.startsWith("duplicate-report-") ||
    name === "duplicates.xlsx" ||
    name === "variant-conflicts.xlsx" ||
    name === "merged-products.xlsx" ||
    name === "failed-images.xlsx" ||
    name === "import-summary.xlsx"
  );
}

function findExcelFiles(root) {
  const files = [];

  function walk(folder) {
    for (const item of fs.readdirSync(folder, { withFileTypes: true })) {
      const fullPath = path.join(folder, item.name);

      if (item.isDirectory()) {
        if (item.name.toLowerCase() === "reports") continue;
        walk(fullPath);
        continue;
      }

      if (!item.name.toLowerCase().endsWith(".xlsx")) continue;
      if (isGeneratedReport(item.name)) continue;
      files.push(fullPath);
    }
  }

  if (fs.existsSync(root)) walk(root);
  return files.sort((a, b) => a.localeCompare(b));
}

function readExcelOccurrences(excelPath) {
  const workbook = XLSX.readFile(excelPath, { dense: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const relativePath = path.relative(config.IMPORTS_DIR, excelPath).replace(/\\/g, "/");
  const collectionName = relativePath.split("/")[0] || "";
  const excelFile = path.basename(excelPath);

  return rows.map((row, index) => {
    const partNumber = getValue(row, [
      "Variant Metafield: custom.part_number [single_line_text_field]",
    ]);
    const handle = slugify(getValue(row, ["Handle"]) || partNumber);
    if (!handle) return null;

    return {
      handle,
      excelFile,
      relativePath,
      collection: collectionName,
      collectionHandle: slugify(collectionName),
      sourceRow: index + 2,
    };
  }).filter(Boolean);
}

function makeSheetName() {
  const now = new Date();
  return (
    "Run_" +
    now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    "_" +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0")
  ).slice(0, 31);
}

function uniqueSheetName(workbook, desiredName) {
  let name = desiredName;
  let counter = 2;

  while (workbook.SheetNames.includes(name)) {
    const suffix = `_${counter++}`;
    name = `${desiredName.slice(0, 31 - suffix.length)}${suffix}`;
  }

  return name;
}

function appendReportSheet(rows) {
  const workbook = fs.existsSync(REPORT_FILE)
    ? XLSX.readFile(REPORT_FILE)
    : XLSX.utils.book_new();

  const runSheetName = uniqueSheetName(workbook, makeSheetName());
  const worksheet = XLSX.utils.json_to_sheet(
    rows.length ? rows : [{ Result: "No duplicate product handles found" }]
  );

  XLSX.utils.book_append_sheet(workbook, worksheet, runSheetName);
  XLSX.writeFile(workbook, REPORT_FILE);
  return runSheetName;
}

async function main() {
  const startedAt = Date.now();
  const excelFiles = findExcelFiles(config.IMPORTS_DIR);
  if (!excelFiles.length) throw new Error("No source Excel files found inside imports/");

  const occurrences = [];

  for (let index = 0; index < excelFiles.length; index++) {
    const excelPath = excelFiles[index];
    const fileOccurrences = readExcelOccurrences(excelPath);
    occurrences.push(...fileOccurrences);
    console.log(
      `Read ${index + 1}/${excelFiles.length}: ${path.relative(config.IMPORTS_DIR, excelPath)} (${fileOccurrences.length} rows with handles)`
    );
  }

  const uniqueHandles = [...new Set(occurrences.map((item) => item.handle))];
  console.log(`Loading R2 registry shards for ${uniqueHandles.length} handles...`);
  const registry = await loadRegistryForHandles(uniqueHandles);

  const firstByHandle = new Map();
  const reportedKeys = new Set();
  const duplicateRows = [];

  function addDuplicate(key, row) {
    if (reportedKeys.has(key)) return;
    reportedKeys.add(key);
    duplicateRows.push(row);
  }

  for (const item of occurrences) {
    const registryEntry = getRegistryEntry(registry, item.handle);
    const sameRegistrySource = (registryEntry?.sources || []).some(
      (source) => source.collectionHandle === item.collectionHandle && source.excelFile === item.excelFile
    );

    if (registryEntry && !sameRegistrySource) {
      addDuplicate(`r2|${item.handle}|${item.relativePath}`, {
        Handle: item.handle,
        "New Excel Path": item.relativePath,
        "New Collection Folder": item.collection,
        "New Row": item.sourceRow,
        "Existing Excel": (registryEntry.sources || []).map((source) => source.excelFile).filter(Boolean).join(", "),
        "Existing Collection": (registryEntry.sources || []).map((source) => source.collectionHandle).filter(Boolean).join(", "),
        "Existing Tags": (registryEntry.tags || []).join(", "),
        Type: "Already in R2 registry",
      });
    }

    const first = firstByHandle.get(item.handle);
    if (!first) {
      firstByHandle.set(item.handle, item);
      continue;
    }

    if (first.relativePath === item.relativePath) continue;

    addDuplicate(`excel|${item.handle}|${first.relativePath}|${item.relativePath}`, {
      Handle: item.handle,
      "First Excel Path": first.relativePath,
      "First Collection Folder": first.collection,
      "First Row": first.sourceRow,
      "Repeated Excel Path": item.relativePath,
      "Repeated Collection Folder": item.collection,
      "Repeated Row": item.sourceRow,
      Type: "Repeated across uploaded Excels",
    });
  }

  const runSheetName = appendReportSheet(duplicateRows);
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log(`Excel files checked: ${excelFiles.length}`);
  console.log(`Unique handles checked: ${uniqueHandles.length}`);
  console.log(`Duplicates found: ${duplicateRows.length}`);
  console.log(`Report workbook: ${REPORT_FILE}`);
  console.log(`New sheet appended: ${runSheetName}`);
  console.log(`Completed in: ${seconds}s`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
