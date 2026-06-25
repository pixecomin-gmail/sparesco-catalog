/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const XLSX = require("xlsx");
const {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} = require("@aws-sdk/client-s3");

require("dotenv").config({ path: ".env.local" });

const collectionName = process.argv[2];

if (!collectionName) {
  console.error('Usage: node scripts/add-collection.js "Hengst"');
  process.exit(1);
}

const ROOT = process.cwd();
const IMPORT_DIR = path.join(ROOT, "imports", collectionName);
const EXCEL_DIR = path.join(IMPORT_DIR, "excel");

const DATA_PRODUCTS_DIR = path.join(ROOT, "data", "products");
const PUBLIC_PRODUCTS_DIR = path.join(ROOT, "public", "data", "products");
const PRODUCTS_INDEX_PATH = path.join(ROOT, "data", "products-index.json");
const COLLECTIONS_PATH = path.join(ROOT, "data", "collections.json");

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET;
const R2_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

if (
  !R2_ACCOUNT_ID ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_BUCKET_NAME ||
  !R2_PUBLIC_BASE_URL
) {
  console.error("Missing R2 env values in .env.local");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getCell(row, name) {
  return row[name] === undefined || row[name] === null ? "" : row[name];
}

function parseNumber(value) {
  const n = Number(String(value || "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseSpecs(value) {
  if (!value) return [];

  const raw = String(value).trim();

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(cleanText).filter(Boolean);
  } catch {}

  return raw
    .replace(/^\[|\]$/g, "")
    .split(/\n|","|", "|,/)
    .map((item) => cleanText(item.replace(/^"|"$/g, "")))
    .filter(Boolean);
}

function extFromUrl(url, contentType) {
  const cleanUrl = String(url).split("?")[0].toLowerCase();

  if (cleanUrl.endsWith(".png")) return ".png";
  if (cleanUrl.endsWith(".webp")) return ".webp";
  if (cleanUrl.endsWith(".gif")) return ".gif";
  if (cleanUrl.endsWith(".avif")) return ".avif";
  if (cleanUrl.endsWith(".jpeg")) return ".jpg";
  if (cleanUrl.endsWith(".jpg")) return ".jpg";

  if (contentType && contentType.includes("png")) return ".png";
  if (contentType && contentType.includes("webp")) return ".webp";
  if (contentType && contentType.includes("gif")) return ".gif";

  return ".jpg";
}

async function objectExists(key) {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

async function uploadImageToR2(imageUrl, collectionSlug, handle, position) {
  if (!imageUrl || !String(imageUrl).startsWith("http")) return "";

  const hash = crypto.createHash("md5").update(String(imageUrl)).digest("hex").slice(0, 12);
  const tempKey = `${collectionSlug}/${handle}-${position}-${hash}`;

  const res = await fetch(imageUrl);

  if (!res.ok) {
    console.warn(`Image failed: ${imageUrl}`);
    return "";
  }

  const contentType = res.headers.get("content-type") || "image/jpeg";
  const ext = extFromUrl(imageUrl, contentType);
  const key = `${tempKey}${ext}`;

  const publicUrl = `${R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;

  if (await objectExists(key)) {
    return publicUrl;
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return publicUrl;
}

function findExcelFile() {
  const folder = fs.existsSync(EXCEL_DIR) ? EXCEL_DIR : IMPORT_DIR;

  const files = fs
    .readdirSync(folder)
    .filter((file) => file.toLowerCase().endsWith(".xlsx"));

  if (!files.length) {
    throw new Error(`No Excel file found in ${folder}`);
  }

  return path.join(folder, files[0]);
}

function existingHandles() {
  const set = new Set();

  if (!fs.existsSync(DATA_PRODUCTS_DIR)) return set;

  for (const file of fs.readdirSync(DATA_PRODUCTS_DIR)) {
    if (!file.endsWith(".json")) continue;

    try {
      const product = readJson(path.join(DATA_PRODUCTS_DIR, file), null);
      if (product?.handle) set.add(product.handle);
    } catch {}
  }

  return set;
}

async function main() {
  ensureDir(DATA_PRODUCTS_DIR);
  ensureDir(PUBLIC_PRODUCTS_DIR);

  const collectionSlug = slugify(collectionName);
  const excelFile = findExcelFile();

  console.log(`Collection: ${collectionName}`);
  console.log(`Excel: ${excelFile}`);

  const workbook = XLSX.readFile(excelFile);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const productsByHandle = new Map();

  for (const row of rows) {
    const handle = slugify(getCell(row, "Handle"));
    if (!handle) continue;

    if (!productsByHandle.has(handle)) {
      productsByHandle.set(handle, {
        handle,
        title: cleanText(getCell(row, "Title")) || handle.toUpperCase(),
        collection: collectionName,
        collectionHandle: collectionSlug,
        category:
          cleanText(getCell(row, "Category")) ||
          cleanText(getCell(row, "Type")) ||
          collectionName,
        tags: String(getCell(row, "Tags"))
          .split(",")
          .map(cleanText)
          .filter(Boolean),
        images: [],
        variants: [],
      });
    }

    const product = productsByHandle.get(handle);

    const variantImage =
      cleanText(getCell(row, "Variant Image")) ||
      cleanText(getCell(row, "Image Src"));

    const variant = {
      title:
        cleanText(getCell(row, "Option1 Value")) ||
        cleanText(getCell(row, "Title")) ||
        product.title,
      sku: cleanText(getCell(row, "Variant SKU")),
      image: variantImage,
      vendor:
        cleanText(getCell(row, "Variant Metafield: custom.vendor [single_line_text_field]")) ||
        cleanText(getCell(row, "Vendor")),
      price: parseNumber(getCell(row, "Variant Price")),
      partNumber: cleanText(
        getCell(row, "Variant Metafield: custom.part_number [single_line_text_field]")
      ),
      hsCode: cleanText(
        getCell(row, "Variant Metafield: custom.hs_code [single_line_text_field]")
      ),
      countryOfOrigin: cleanText(
        getCell(row, "Variant Metafield: custom.country_of_origin [single_line_text_field]")
      ),
      description:
        cleanText(
          getCell(row, "Variant Metafield: custom.brand_description [multi_line_text_field]")
        ) || cleanText(getCell(row, "Body HTML")),
      specifications: parseSpecs(
        getCell(row, "Variant Metafield: custom.specification [list.single_line_text_field]")
      ),
      unitWeight: cleanText(
        getCell(row, "Variant Metafield: custom.unit_weight [single_line_text_field]")
      ),
      shippingVolume: cleanText(
        getCell(row, "Variant Metafield: custom.shipping_volume [single_line_text_field]")
      ),
    };

    const duplicateVariant = product.variants.some(
      (v) =>
        (variant.sku && v.sku === variant.sku) ||
        (variant.partNumber && v.partNumber === variant.partNumber)
    );

    if (!duplicateVariant) {
      product.variants.push(variant);
    }
  }

  const existing = existingHandles();
  const productsIndex = readJson(PRODUCTS_INDEX_PATH, []);
  const indexByHandle = new Map(productsIndex.map((p) => [p.handle, p]));

  let newProducts = 0;
  let updatedProducts = 0;
  let skippedDuplicates = 0;
  let uploadedImages = 0;

  for (const product of productsByHandle.values()) {
    const imageMap = new Map();

    for (let i = 0; i < product.variants.length; i++) {
      const variant = product.variants[i];

      if (!variant.image) continue;

      if (!imageMap.has(variant.image)) {
        const uploaded = await uploadImageToR2(
          variant.image,
          collectionSlug,
          product.handle,
          i + 1
        );

        imageMap.set(variant.image, uploaded);

        if (uploaded) uploadedImages++;
      }

      const r2Url = imageMap.get(variant.image);
      if (r2Url) {
        variant.image = r2Url;
        if (!product.images.includes(r2Url)) product.images.push(r2Url);
      }
    }

    const dataPath = path.join(DATA_PRODUCTS_DIR, `${product.handle}.json`);
    const publicPath = path.join(PUBLIC_PRODUCTS_DIR, `${product.handle}.json`);

    if (existing.has(product.handle)) {
      updatedProducts++;
    } else {
      newProducts++;
    }

    writeJson(dataPath, product);
    writeJson(publicPath, product);

    const primaryVariant = product.variants[0] || {};
    indexByHandle.set(product.handle, {
      handle: product.handle,
      title: product.title,
      category: product.category,
      collection: product.collection,
      collectionHandle: product.collectionHandle,
      image: product.images[0] || primaryVariant.image || "",
      partNumber: primaryVariant.partNumber || "",
      vendor: primaryVariant.vendor || "",
      variantCount: product.variants.length,
      price: primaryVariant.price || 0,
    });
  }

  const finalIndex = Array.from(indexByHandle.values()).sort((a, b) =>
    String(a.title).localeCompare(String(b.title))
  );

  writeJson(PRODUCTS_INDEX_PATH, finalIndex);

  const collectionsMap = new Map();

  for (const item of finalIndex) {
    const handle = item.collectionHandle || slugify(item.collection);
    const title = item.collection || handle;

    if (!collectionsMap.has(handle)) {
      collectionsMap.set(handle, {
        title,
        handle,
        count: 0,
      });
    }

    collectionsMap.get(handle).count++;
  }

  writeJson(
    COLLECTIONS_PATH,
    Array.from(collectionsMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    )
  );

  console.log("");
  console.log("DONE");
  console.log(`Rows read: ${rows.length}`);
  console.log(`Products processed: ${productsByHandle.size}`);
  console.log(`New products: ${newProducts}`);
  console.log(`Updated products: ${updatedProducts}`);
  console.log(`Duplicate variants skipped: ${skippedDuplicates}`);
  console.log(`Images uploaded/reused: ${uploadedImages}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});