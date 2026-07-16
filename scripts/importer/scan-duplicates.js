const fs = require("fs");
const path = require("path");

const config = require("./config");
const { readExcelFiles } = require("./excel-reader");
const { buildProducts } = require("./product-builder");
const {
  canonicalize,
  unique,
} = require("./utils");

const {
  loadRegistryForCanonicalKeys,
  getRegistryEntry,
} = require("./duplicate-registry");

const {
  writeDuplicateReport,
} = require("./duplicate-report");

const { heading, bar } = require("./progress");

function getFolders() {
  return fs
    .readdirSync(config.IMPORTS_DIR, {
      withFileTypes: true,
    })
    .filter((item) => item.isDirectory())
    .filter((item) => item.name.toLowerCase() !== "reports")
    .map((item) => path.join(config.IMPORTS_DIR, item.name))
    .filter((folder) =>
      fs
        .readdirSync(folder)
        .some((file) =>
          file.toLowerCase().endsWith(".xlsx")
        )
    )
    .sort((a, b) => a.localeCompare(b));
}

function getExcelFiles(folder) {
  return fs
    .readdirSync(folder)
    .filter((file) =>
      file.toLowerCase().endsWith(".xlsx")
    )
    .map((file) => path.join(folder, file))
    .sort((a, b) => a.localeCompare(b));
}

function normalizeSource(source) {
  return {
    collectionHandle: String(
      source?.collectionHandle || ""
    ).toLowerCase(),

    excelFile: String(
      source?.excelFile || ""
    ).toLowerCase(),
  };
}

function sameSource(left, right) {
  const a = normalizeSource(left);
  const b = normalizeSource(right);

  return (
    a.collectionHandle === b.collectionHandle &&
    a.excelFile === b.excelFile
  );
}

function cloudContainsAnySource(
  cloudEntry,
  incomingProduct
) {
  const cloudSources =
    cloudEntry?.sources || [];

  const incomingSources =
    incomingProduct?.sources || [];

  return incomingSources.some(
    (incomingSource) =>
      cloudSources.some(
        (cloudSource) =>
          sameSource(
            cloudSource,
            incomingSource
          )
      )
  );
}

function firstSource(product) {
  return product?.sources?.[0] || {};
}

function difference(incoming, existing) {
  const existingSet = new Set(existing || []);

  return (incoming || []).filter(
    (tag) => !existingSet.has(tag)
  );
}

function makeRow({
  canonicalKey,
  duplicateType,
  keptHandle,
  incomingHandle,
  first,
  later,
  existingTags,
  incomingTags,
}) {
  const tagsAdded = difference(
    incomingTags,
    existingTags
  );

  const finalTags = unique([
    ...existingTags,
    ...incomingTags,
  ]);

  return {
    "Canonical Key": canonicalKey,
    "Duplicate Type": duplicateType,
    "Kept Published Handle": keptHandle,
    "Incoming Handle": incomingHandle,

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
  };
}

async function main() {
  heading("SCAN DUPLICATE CANDIDATES");

  const folders = getFolders();
  const candidates = [];

  for (
    let folderIndex = 0;
    folderIndex < folders.length;
    folderIndex++
  ) {
    const folder = folders[folderIndex];
    const collectionName =
      path.basename(folder);

    const files = getExcelFiles(folder);

    console.log(
      `Collection ${folderIndex + 1}/${folders.length}: ` +
        collectionName
    );

    for (
      let fileIndex = 0;
      fileIndex < files.length;
      fileIndex++
    ) {
      const file = files[fileIndex];

      console.log(
        `  File ${fileIndex + 1}/${files.length}: ` +
          path.basename(file)
      );

      const rows = readExcelFiles([file]);

      const products = buildProducts(
        rows,
        collectionName
      );

      candidates.push(...products);
    }
  }

  const canonicalKeys = [
    ...new Set(
      candidates
        .map((product) =>
          canonicalize(
            product.canonicalKey ||
              product.handle
          )
        )
        .filter(Boolean)
    ),
  ];

  console.log("");
  console.log(
    "Loading Cloudflare duplicate registry..."
  );

  const cloudRegistry =
    await loadRegistryForCanonicalKeys(
      canonicalKeys
    );

  const firstCurrentByCanonical =
    new Map();

  const reportRows = [];
  const seen = new Set();

  for (
    let index = 0;
    index < candidates.length;
    index++
  ) {
    const incoming = candidates[index];

    const canonicalKey =
      canonicalize(
        incoming.canonicalKey ||
          incoming.handle
      );

    const incomingSource =
      firstSource(incoming);

    const cloudEntry =
      getRegistryEntry(
        cloudRegistry,
        canonicalKey
      );

    /*
     * Ignore already-published products from the same
     * collection + Excel source.
     */
    if (
      cloudEntry &&
      !cloudContainsAnySource(
        cloudEntry,
        incoming
      )
    ) {
      const cloudSource =
        cloudEntry.sources?.[0] || {};

      const reportKey = [
        "cloud",
        canonicalKey,
        incomingSource.collectionHandle,
        incomingSource.excelFile,
      ].join("|");

      if (!seen.has(reportKey)) {
        seen.add(reportKey);

        reportRows.push(
          makeRow({
            canonicalKey,
            duplicateType:
              "NEW SOURCE MATCHES CLOUDFLARE",
            keptHandle:
              cloudEntry.publishedHandle || "",
            incomingHandle:
              incoming.handle,
            first: cloudSource,
            later: incomingSource,
            existingTags:
              unique(cloudEntry.tags || []),
            incomingTags:
              unique(incoming.tags || []),
          })
        );
      }
    }

    const firstCurrent =
      firstCurrentByCanonical.get(
        canonicalKey
      );

    if (!firstCurrent) {
      firstCurrentByCanonical.set(
        canonicalKey,
        incoming
      );
    } else {
      const first =
        firstSource(firstCurrent);

      const later =
        firstSource(incoming);

      if (!sameSource(first, later)) {
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

          reportRows.push(
            makeRow({
              canonicalKey,

              duplicateType:
                first.collectionHandle ===
                later.collectionHandle
                  ? "INTERNAL DUPLICATE"
                  : "CROSS COLLECTION DUPLICATE",

              keptHandle:
                firstCurrent.handle,

              incomingHandle:
                incoming.handle,

              first,
              later,

              existingTags:
                unique(firstCurrent.tags || []),

              incomingTags:
                unique(incoming.tags || []),
            })
          );
        }

        firstCurrent.tags = unique([
          ...(firstCurrent.tags || []),
          ...(incoming.tags || []),
        ]);
      }
    }

    bar(
      "Scanning products",
      index + 1,
      candidates.length
    );
  }

  const filePath =
    writeDuplicateReport(reportRows);

  console.log("");
  console.log(
    `Products checked: ${candidates.length}`
  );
  console.log(
    `Canonical keys checked: ${canonicalKeys.length}`
  );
  console.log(
    `Duplicate candidates: ${reportRows.length}`
  );
  console.log(`Report: ${filePath}`);
}

main().catch((error) => {
  console.error("");
  console.error(
    "DUPLICATE SCAN FAILED"
  );
  console.error(error);
  process.exit(1);
});
