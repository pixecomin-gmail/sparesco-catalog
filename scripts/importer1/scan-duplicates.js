const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const config = require("./config");
const { readExcelFiles } = require("./excel-reader");
const { buildProducts } = require("./product-builder");
const { canonicalize, unique } = require("./utils");
const {
  loadRegistryForCanonicalKeys,
  getRegistryEntry,
} = require("./duplicate-registry");
const { heading, bar } = require("./progress");

function ensureReportsDir() {
  if (!fs.existsSync(config.REPORTS_DIR)) {
    fs.mkdirSync(config.REPORTS_DIR, { recursive: true });
  }
}

function getFolders() {
  return fs
    .readdirSync(config.IMPORTS_DIR, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .filter((item) => item.name.toLowerCase() !== "reports")
    .map((item) => path.join(config.IMPORTS_DIR, item.name))
    .filter((folder) =>
      fs.readdirSync(folder).some((file) =>
        file.toLowerCase().endsWith(".xlsx")
      )
    )
    .sort((a, b) => a.localeCompare(b));
}

function getExcelFiles(folder) {
  return fs
    .readdirSync(folder)
    .filter((file) => file.toLowerCase().endsWith(".xlsx"))
    .map((file) => path.join(folder, file))
    .sort((a, b) => a.localeCompare(b));
}

function firstSource(product) {
  return product?.sources?.[0] || {};
}

function difference(incoming, existing) {
  const existingSet = new Set(existing || []);
  return (incoming || []).filter((tag) => !existingSet.has(tag));
}

function writeWorkbook(rows) {
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

async function main() {
  heading("SCAN DUPLICATE CANDIDATES");

  const folders = getFolders();
  const candidates = [];

  for (let folderIndex = 0; folderIndex < folders.length; folderIndex++) {
    const folder = folders[folderIndex];
    const collectionName = path.basename(folder);
    const files = getExcelFiles(folder);

    console.log(
      `Collection ${folderIndex + 1}/${folders.length}: ${collectionName}`
    );

    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const file = files[fileIndex];

      console.log(
        `  File ${fileIndex + 1}/${files.length}: ${path.basename(file)}`
      );

      const rows = readExcelFiles([file]);
      const products = buildProducts(rows, collectionName);

      for (const product of products) {
        candidates.push(product);
      }
    }
  }

  const canonicalKeys = [
    ...new Set(
      candidates
        .map((product) =>
          canonicalize(product.canonicalKey || product.handle)
        )
        .filter(Boolean)
    ),
  ];

  console.log("");
  console.log("Loading Cloudflare duplicate registry...");

  const cloudRegistry =
    await loadRegistryForCanonicalKeys(canonicalKeys);

  const firstCurrentByCanonical = new Map();
  const reportRows = [];
  const seen = new Set();

  for (let index = 0; index < candidates.length; index++) {
    const incoming = candidates[index];
    const canonicalKey = canonicalize(
      incoming.canonicalKey || incoming.handle
    );

    const incomingSource = firstSource(incoming);
    const cloudEntry = getRegistryEntry(
      cloudRegistry,
      canonicalKey
    );

    if (cloudEntry) {
      const cloudSource = cloudEntry.sources?.[0] || {};
      const existingTags = unique(cloudEntry.tags || []);
      const incomingTags = unique(incoming.tags || []);
      const tagsAdded = difference(incomingTags, existingTags);
      const finalTags = unique([...existingTags, ...incomingTags]);

      const reportKey = [
        "cloud",
        canonicalKey,
        incomingSource.collectionHandle,
        incomingSource.excelFile,
        incomingSource.sourceRow,
      ].join("|");

      if (!seen.has(reportKey)) {
        seen.add(reportKey);

        reportRows.push({
          "Canonical Key": canonicalKey,
          "Duplicate Type": "ALREADY IN CLOUDFLARE",
          "Kept Published Handle": cloudEntry.publishedHandle || "",
          "Incoming Handle": incoming.handle,
          "First Collection":
            cloudSource.collectionName ||
            cloudSource.collectionHandle ||
            "",
          "First Excel": cloudSource.excelFile || "",
          "First Row": cloudSource.sourceRow || "",
          "Later Collection":
            incomingSource.collectionName ||
            incomingSource.collectionHandle ||
            "",
          "Later Excel": incomingSource.excelFile || "",
          "Later Row": incomingSource.sourceRow || "",
          "Existing Tags": existingTags.join(", "),
          "Incoming Tags": incomingTags.join(", "),
          "Tags Added Automatically": tagsAdded.join(", "),
          "Final Tags": finalTags.join(", "),
          "Automatic Action": "MERGE TAGS ONLY",
          "Ignored Duplicate Data":
            "title, description, specifications, variants, images, vendor, price",
          "Review Required": "YES",
        });
      }
    }

    const firstCurrent =
      firstCurrentByCanonical.get(canonicalKey);

    if (!firstCurrent) {
      firstCurrentByCanonical.set(canonicalKey, incoming);
    } else {
      const first = firstSource(firstCurrent);
      const later = firstSource(incoming);

      const sameOccurrence =
        first.collectionHandle === later.collectionHandle &&
        first.excelFile === later.excelFile;

      if (!sameOccurrence) {
        const existingTags = unique(firstCurrent.tags || []);
        const incomingTags = unique(incoming.tags || []);
        const tagsAdded = difference(incomingTags, existingTags);
        const finalTags = unique([...existingTags, ...incomingTags]);

        const duplicateType =
          first.collectionHandle === later.collectionHandle
            ? "INTERNAL DUPLICATE"
            : "CROSS COLLECTION DUPLICATE";

        const reportKey = [
          "current",
          canonicalKey,
          first.collectionHandle,
          first.excelFile,
          later.collectionHandle,
          later.excelFile,
        ].join("|");

        if (!seen.has(reportKey)) {
          seen.add(reportKey);

          reportRows.push({
            "Canonical Key": canonicalKey,
            "Duplicate Type": duplicateType,
            "Kept Published Handle": firstCurrent.handle,
            "Incoming Handle": incoming.handle,
            "First Collection":
              first.collectionName ||
              first.collectionHandle ||
              "",
            "First Excel": first.excelFile || "",
            "First Row": first.sourceRow || "",
            "Later Collection":
              later.collectionName ||
              later.collectionHandle ||
              "",
            "Later Excel": later.excelFile || "",
            "Later Row": later.sourceRow || "",
            "Existing Tags": existingTags.join(", "),
            "Incoming Tags": incomingTags.join(", "),
            "Tags Added Automatically": tagsAdded.join(", "),
            "Final Tags": finalTags.join(", "),
            "Automatic Action": "MERGE TAGS ONLY",
            "Ignored Duplicate Data":
              "title, description, specifications, variants, images, vendor, price",
            "Review Required": "YES",
          });
        }

        firstCurrent.tags = finalTags;
      }
    }

    bar("Scanning products", index + 1, candidates.length);
  }

  const filePath = writeWorkbook(reportRows);

  console.log("");
  console.log(`Products checked: ${candidates.length}`);
  console.log(`Canonical keys checked: ${canonicalKeys.length}`);
  console.log(`Duplicate candidates: ${reportRows.length}`);
  console.log(`Report: ${filePath}`);
}

main().catch((error) => {
  console.error("");
  console.error("DUPLICATE SCAN FAILED");
  console.error(error);
  process.exit(1);
});
