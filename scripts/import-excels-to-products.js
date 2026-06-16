const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const importsDir = path.join(process.cwd(), "imports");
const dataDir = path.join(process.cwd(), "data");
const productsDir = path.join(dataDir, "products");

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(productsDir, { recursive: true });

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

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clean(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "number") return String(value);
  const text = String(value).trim();
  return text === "nan" ? "" : text;
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

function readExcel(filePath, collectionName, collectionHandle, productsMap) {
  console.log(`Reading: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  rows.forEach((row) => {
    const handle = clean(row[COL.handle]);
    if (!handle) return;

    const productTitle = clean(row[COL.title]) || handle;
    const image = clean(row[COL.variantImage]) || clean(row[COL.imageSrc]);

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
      });
    }

    const product = productsMap.get(handle);

    if (image && !product.images.includes(image)) {
      product.images.push(image);
    }

    const sku = clean(row[COL.sku]);
    const partNumber = clean(row[COL.partNumber]) || sku || productTitle;

    const variantTitle =
      clean(row[COL.option1Value]) || clean(row[COL.description]) || partNumber;

    const variant = {
      title: variantTitle,
      sku,
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

    const alreadyExists = product.variants.some(
      (item) => item.sku === variant.sku
    );

    if (!alreadyExists) {
      product.variants.push(variant);
    }
  });
}

const productsMap = new Map();
const collectionsMap = new Map();

const collectionFolders = fs
  .readdirSync(importsDir, { withFileTypes: true })
  .filter((item) => item.isDirectory());

collectionFolders.forEach((folder) => {
  const collectionName = folder.name;
  const collectionHandle = slugify(collectionName);
  const collectionPath = path.join(importsDir, collectionName);

  collectionsMap.set(collectionHandle, {
    title: collectionName,
    handle: collectionHandle,
    count: 0,
  });

  const excelFiles = fs
    .readdirSync(collectionPath)
    .filter((file) => file.toLowerCase().endsWith(".xlsx"));

  excelFiles.forEach((file) => {
    readExcel(
      path.join(collectionPath, file),
      collectionName,
      collectionHandle,
      productsMap
    );
  });
});

const products = Array.from(productsMap.values());

products.forEach((product) => {
  const productPath = path.join(productsDir, `${product.handle}.json`);
  fs.writeFileSync(productPath, JSON.stringify(product, null, 2), "utf8");
});

const productsIndex = products.map((product) => {
  const firstVariant = product.variants[0];

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
  };
});

productsIndex.forEach((product) => {
  const collection = collectionsMap.get(product.collectionHandle);
  if (collection) collection.count += 1;
});

fs.writeFileSync(
  path.join(dataDir, "products-index.json"),
  JSON.stringify(productsIndex, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(dataDir, "collections.json"),
  JSON.stringify(Array.from(collectionsMap.values()), null, 2),
  "utf8"
);

console.log(`Generated ${products.length} grouped product files`);
console.log(`Generated products-index.json`);
console.log(`Generated collections.json`);