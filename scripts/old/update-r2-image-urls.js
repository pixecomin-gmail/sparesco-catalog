const fs = require("fs");
const path = require("path");

const R2_BASE_URL = "https://pub-f66ad83430274d9284d9172bc855e8cd.r2.dev";

const COLLECTIONS = [
  { title: "Air Filters", handle: "air-filters" },
  { title: "Argo Hytos", handle: "argo-hytos" },
  { title: "Compressed Air Filters", handle: "compressed-air-filters" },
  { title: "Domnick Hunter", handle: "domnick-hunter" },
  { title: "Donaldson", handle: "donaldson" },
  { title: "Eppensteiner", handle: "eppensteiner" },
];

const ROOT = process.cwd();
const PRODUCTS_DIR = path.join(ROOT, "data", "products");
const INDEX_FILE = path.join(ROOT, "data", "products-index.json");

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];

    if (c === '"' && line[i + 1] === '"') {
      cur += '"';
      i++;
    } else if (c === '"') {
      quoted = !quoted;
    } else if (c === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }

  out.push(cur);
  return out;
}

function readImageReport(collection) {
  const reportFile = path.join(
    ROOT,
    "imports",
    collection.title,
    "reports",
    "image_download_report.csv"
  );

  if (!fs.existsSync(reportFile)) {
    throw new Error(`Missing report: ${reportFile}`);
  }

  const csv = fs.readFileSync(reportFile, "utf8");
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);

  const urlIndex = headers.indexOf("url");
  const filenameIndex = headers.indexOf("filename");

  if (urlIndex === -1 || filenameIndex === -1) {
    throw new Error(`Missing url/filename columns in ${reportFile}`);
  }

  const map = new Map();

  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const oldUrl = cols[urlIndex];
    const filename = cols[filenameIndex];

    if (!oldUrl || !filename) continue;

    map.set(oldUrl, `${R2_BASE_URL}/${collection.handle}/${filename}`);
  }

  return map;
}

function replaceImage(value, map) {
  if (typeof value !== "string") return value;
  return map.get(value) || value;
}

function updateProductJson(filePath, map) {
  const product = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let changed = false;

  if (Array.isArray(product.images)) {
    const nextImages = product.images.map((img) => replaceImage(img, map));
    if (JSON.stringify(nextImages) !== JSON.stringify(product.images)) {
      product.images = nextImages;
      changed = true;
    }
  }

  if (Array.isArray(product.variants)) {
    for (const variant of product.variants) {
      const nextImage = replaceImage(variant.image, map);
      if (nextImage !== variant.image) {
        variant.image = nextImage;
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(product, null, 2));
  }

  return changed;
}

function updateIndex(map) {
  if (!fs.existsSync(INDEX_FILE)) return 0;

  const items = JSON.parse(fs.readFileSync(INDEX_FILE, "utf8"));
  let changedCount = 0;

  for (const item of items) {
    if (item.handle === "sa18278") {
    console.log("INDEX IMAGE:", item.image);
    console.log("FOUND:", map.has(item.image));
    }

    const nextImage = replaceImage(item.image, map);
    if (nextImage !== item.image) {
      item.image = nextImage;
      changedCount++;
    }
  }

  if (changedCount > 0) {
    fs.writeFileSync(INDEX_FILE, JSON.stringify(items, null, 2));
  }

  return changedCount;
}

function main() {
  const productFiles = fs
    .readdirSync(PRODUCTS_DIR)
    .filter((file) => file.endsWith(".json"));

  let totalMapped = 0;
  let totalProductFilesChanged = 0;
  let totalIndexChanged = 0;

  for (const collection of COLLECTIONS) {
    const map = readImageReport(collection);

    console.log(`Collection: ${collection.title}`);
    console.log(`Mapped URLs: ${map.size}`);

    totalMapped += map.size;

    for (const file of productFiles) {
      const filePath = path.join(PRODUCTS_DIR, file);
      if (updateProductJson(filePath, map)) {
        totalProductFilesChanged++;
      }
    }

    totalIndexChanged += updateIndex(map);
  }

  console.log("DONE");
  console.log(`Total mapped URLs: ${totalMapped}`);
  console.log(`Product files changed: ${totalProductFilesChanged}`);
  console.log(`Index items changed: ${totalIndexChanged}`);
}

main();