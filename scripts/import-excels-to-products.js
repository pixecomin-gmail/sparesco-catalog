const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const root = process.cwd();

const importsDir = path.join(root, "imports");

const publicDataDir = path.join(root, "public", "data");

const productsDir = path.join(publicDataDir, "products");
const collectionProductsDir = path.join(publicDataDir, "collection-products");

const COL = {
  handle: "Handle",
  title: "Title",
  tags: "Tags",
  imageSrc: "Image Src",
  variantImage: "Variant Image",
  option1Value: "Option1 Value",
  sku: "Variant SKU",
  price: "Variant Price",
  hsCode: "Variant Metafield: custom.hs_code [single_line_text_field]",
  country: "Variant Metafield: custom.country_of_origin [single_line_text_field]",
  description: "Variant Metafield: custom.brand_description [multi_line_text_field]",
  specification: "Variant Metafield: custom.specification [list.single_line_text_field]",
  partNumber: "Variant Metafield: custom.part_number [single_line_text_field]",
  unitWeight: "Variant Metafield: custom.unit_weight [single_line_text_field]",
  shippingVolume: "Variant Metafield: custom.shipping_volume [single_line_text_field]",
  vendor: "Variant Metafield: custom.vendor [single_line_text_field]",
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function emptyDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  ensureDir(dir);
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeProductHandle(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeForCompare(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
}

function clean(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "number") return String(value);
  const text = String(value).trim();
  return text.toLowerCase() === "nan" ? "" : text;
}

function splitValue(value) {
  const text = clean(value);
  if (!text) return [];

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanNumber(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function variantQualityScore(variant) {
  let score = 0;

  if (variant.image) score += 5;
  if (variant.price > 0) score += 5;
  if (variant.description) score += variant.description.length;
  if (variant.specifications?.length) score += variant.specifications.length * 10;
  if (variant.hsCode) score += 2;
  if (variant.countryOfOrigin) score += 2;
  if (variant.unitWeight) score += 2;
  if (variant.shippingVolume) score += 2;

  return score;
}

function readExcel(filePath, collectionName, collectionHandle, productsMap, duplicateRows) {
  console.log(`Reading: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  rows.forEach((row, rowIndex) => {
    const originalHandle = clean(row[COL.handle]);
    if (!originalHandle) return;

    const handle = normalizeProductHandle(originalHandle);
    if (!handle) return;

    const productTitle = clean(row[COL.title]) || originalHandle;
    const image = clean(row[COL.variantImage]) || clean(row[COL.imageSrc]);

    const sku = clean(row[COL.sku]);
    const partNumber = clean(row[COL.partNumber]) || sku || productTitle;

    const variantTitle =
      clean(row[COL.option1Value]) || clean(row[COL.description]) || partNumber;

    const variant = {
      title: variantTitle,
      sku: sku || `${handle}-${normalizeForCompare(partNumber || variantTitle)}`,
      image,
      vendor: clean(row[COL.vendor]),
      price: cleanNumber(row[COL.price]),
      partNumber,
      hsCode: clean(row[COL.hsCode]),
      countryOfOrigin: clean(row[COL.country]),
      description: clean(row[COL.description]),
      specifications: splitValue(row[COL.specification]),
      unitWeight: clean(row[COL.unitWeight]),
      shippingVolume: clean(row[COL.shippingVolume]),
    };

    if (!productsMap.has(handle)) {
      productsMap.set(handle, {
        handle,
        title: productTitle,
        collection: collectionName,
        collectionHandle,
        category: collectionName,
        tags: splitValue(row[COL.tags]),
        images: [],
        variants: [],
        _variantKeys: new Map(),
        _sourceHandles: new Set([originalHandle]),
      });
    }

    const product = productsMap.get(handle);

    if (!product._sourceHandles.has(originalHandle)) {
      duplicateRows.push({
        "Duplicate Type": "Handle Normalized",
        "Original Handle": originalHandle,
        "Normalized Handle": handle,
        "Existing Product Title": product.title,
        "Incoming Product Title": productTitle,
        "Part Number": partNumber,
        "Variant Title": variantTitle,
        "Excel File": filePath,
        "Excel Row": rowIndex + 2,
        Action: "Merged into same product",
      });

      product._sourceHandles.add(originalHandle);
    } else {
      return;
    }

    if (image && !product.images.includes(image)) {
      product.images.push(image);
    }

    const variantKey = [
      normalizeForCompare(sku),
      normalizeForCompare(partNumber),
      normalizeForCompare(variantTitle),
    ].join("__");

    if (product._variantKeys.has(variantKey)) {
      const existingIndex = product._variantKeys.get(variantKey);
      const existingVariant = product.variants[existingIndex];

      duplicateRows.push({
        "Duplicate Type": "Duplicate Variant",
        "Original Handle": originalHandle,
        "Normalized Handle": handle,
        "Existing Product Title": product.title,
        "Incoming Product Title": productTitle,
        "Part Number": partNumber,
        "Variant Title": variantTitle,
        "Excel File": filePath,
        "Excel Row": rowIndex + 2,
        Action: "Duplicate variant skipped or replaced if better",
      });

      if (variantQualityScore(variant) > variantQualityScore(existingVariant)) {
        product.variants[existingIndex] = variant;
      }

      return;
    }

    product._variantKeys.set(variantKey, product.variants.length);
    product.variants.push(variant);
  });
}

emptyDir(productsDir);
emptyDir(collectionProductsDir);
ensureDir(publicDataDir);

const productsMap = new Map();
const collectionsMap = new Map();
const duplicateRows = [];

const COLLECTIONS = [
  "Hengst",
];

const collectionFolders = fs
  .readdirSync(importsDir, { withFileTypes: true })
  .filter(
    (item) =>
      item.isDirectory() &&
      COLLECTIONS.includes(item.name)
  );

collectionFolders.forEach((folder) => {
  const collectionName = folder.name;
  const collectionHandle = slugify(collectionName);
  const collectionPath = path.join(importsDir, collectionName);

  collectionsMap.set(collectionHandle, {
    title: collectionName,
    handle: collectionHandle,
    count: 0,
  });

  const excelPath = path.join(collectionPath, "excel");
  const actualExcelPath = fs.existsSync(excelPath) ? excelPath : collectionPath;

  const excelFiles = fs
    .readdirSync(actualExcelPath)
    .filter((file) => file.toLowerCase().endsWith(".xlsx"));

  excelFiles.forEach((file) => {
    readExcel(
      path.join(actualExcelPath, file),
      collectionName,
      collectionHandle,
      productsMap,
      duplicateRows
    );
  });
});

const products = Array.from(productsMap.values()).map((product) => {
  delete product._variantKeys;
  delete product._sourceHandles;
  return product;
});

products.forEach((product) => {
  writeJson(path.join(productsDir, `${product.handle}.json`), product);
});

const productsIndex = products.map((product) => {
  const firstVariant = product.variants[0];

  const prices = product.variants
    .map((variant) => Number(variant.price || 0))
    .filter((price) => price > 0);

  const lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;

  return {
    handle: product.handle,
    title: product.title,
    category: product.category,
    collection: product.collection,
    collectionHandle: product.collectionHandle,
    image: product.images[0] || "",
    partNumber: firstVariant?.partNumber || product.title,
    vendor: firstVariant?.vendor || "",
    variantCount: product.variants.length,
    price: lowestPrice,
  };
});

productsIndex.forEach((product) => {
  const collection = collectionsMap.get(product.collectionHandle);
  if (collection) collection.count += 1;
});

const searchIndex = productsIndex.map((product) => ({
  handle: product.handle,
  title: product.title,
  partNumber: product.partNumber,
  vendor: product.vendor,
  category: product.category,
  collection: product.collection,
  collectionHandle: product.collectionHandle,
  image: product.image,
  price: product.price,
  variantCount: product.variantCount,
}));

const collectionGroups = new Map();

productsIndex.forEach((product) => {
  if (!collectionGroups.has(product.collectionHandle)) {
    collectionGroups.set(product.collectionHandle, []);
  }

  collectionGroups.get(product.collectionHandle).push(product);
});

collectionGroups.forEach((items, collectionHandle) => {
  writeJson(path.join(collectionProductsDir, `${collectionHandle}.json`), items);
});

const collections = Array.from(collectionsMap.values()).sort((a, b) =>
  a.title.localeCompare(b.title)
);

writeJson(path.join(publicDataDir, "products-index.json"), productsIndex);
writeJson(path.join(publicDataDir, "search-index.json"), searchIndex);
writeJson(path.join(publicDataDir, "collections.json"), collections);

const duplicateReportPath = path.join(
  publicDataDir,
  "duplicate-products-report.xlsx"
);

const duplicateWorkbook = XLSX.utils.book_new();
const duplicateSheet = XLSX.utils.json_to_sheet(
  duplicateRows.length
    ? duplicateRows
    : [
        {
          "Duplicate Type": "No duplicates found",
          "Original Handle": "",
          "Normalized Handle": "",
          "Existing Product Title": "",
          "Incoming Product Title": "",
          "Part Number": "",
          "Variant Title": "",
          "Excel File": "",
          "Excel Row": "",
          Action: "",
        },
      ]
);

XLSX.utils.book_append_sheet(
  duplicateWorkbook,
  duplicateSheet,
  "Duplicate Report"
);

XLSX.writeFile(duplicateWorkbook, duplicateReportPath);

console.log(`Generated ${products.length} product files`);
console.log(`Generated ${collectionGroups.size} collection product files`);
console.log(`Generated products-index.json`);
console.log(`Generated search-index.json`);
console.log(`Generated collections.json`);
console.log(`Generated duplicate report: ${duplicateReportPath}`);
console.log(`Duplicate rows found: ${duplicateRows.length}`);