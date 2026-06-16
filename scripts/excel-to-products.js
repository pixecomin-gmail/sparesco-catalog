const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const inputFile = path.join(process.cwd(), "air_filters_1.xlsx");
const outputFile = path.join(process.cwd(), "data", "products.json");

if (!fs.existsSync(inputFile)) {
  console.error("Excel file not found:");
  console.error(inputFile);
  process.exit(1);
}

const workbook = XLSX.readFile(inputFile);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

const productsMap = new Map();

function splitValue(value) {
  if (!value) return [];

  const text = String(value).trim();

  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

rows.forEach((row) => {
  const handle = row["Handle"];
  if (!handle) return;

  if (!productsMap.has(handle)) {
    productsMap.set(handle, {
      handle,
      title: row["Title"] || handle,
      bodyHtml: row["Body HTML"] || "",
      vendor: row["Vendor"] || row["Variant Metafield: custom.vendor"] || "",
      type: row["Type"] || "",
      category: row["Type"] || "",
      tags: splitValue(row["Tags"]),
      images: [],
      sku: row["Variant SKU"] || "",
      price: Number(row["Variant Price"] || 0),
      partNumber: row["Variant Metafield: custom.part_number"] || row["Variant SKU"] || "",
      hsCode: row["Variant Metafield: custom.hs_code"] || "",
      countryOfOrigin: row["Variant Metafield: custom.country_of_origin"] || "",
      brandDescription: row["Variant Metafield: custom.brand_description"] || "",
      unitWeight: row["Variant Metafield: custom.unit_weight"] || "",
      shippingVolume: row["Variant Metafield: custom.shipping_volume"] || "",
      specifications: splitValue(row["Variant Metafield: custom.specification"]),
    });
  }

  const product = productsMap.get(handle);
  const image = row["Image Src"];

  if (image && !product.images.includes(image)) {
    product.images.push(image);
  }
});

const products = Array.from(productsMap.values());

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(products, null, 2), "utf8");

console.log(`Generated ${products.length} products`);
console.log(`Saved to ${outputFile}`);