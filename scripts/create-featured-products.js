const fs = require("fs");
const path = require("path");
const { uploadJson } = require("./importer-v2/r2-client");

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

if (!R2_BASE) {
  console.error("❌ Missing NEXT_PUBLIC_R2_PUBLIC_URL");
  process.exit(1);
}

async function main() {
  const handlesPath = path.join(__dirname, "../data/featured-handles.json");
  const handles = JSON.parse(fs.readFileSync(handlesPath, "utf8"));

  const indexUrl = `${R2_BASE.replace(
    /\/$/,
    ""
  )}/catalog/indexes/catalog-index.json`;

  const res = await fetch(indexUrl);

  if (!res.ok) {
    console.error("❌ Could not fetch catalog-index.json", res.status);
    process.exit(1);
  }

  const catalog = await res.json();
  const products = Array.isArray(catalog) ? catalog : catalog.products || [];

  const productMap = new Map(products.map((product) => [product.handle, product]));

  const featured = [];

  for (const handle of handles) {
    const product = productMap.get(handle);

    if (!product) {
      console.log(`❌ Missing: ${handle}`);
      continue;
    }

    featured.push(product);
    console.log(`✅ Added: ${handle}`);
  }

  const outputPath = path.join(__dirname, "../featured-products.json");

  fs.writeFileSync(outputPath, JSON.stringify(featured.slice(0, 12), null, 2));

  await uploadJson(
    "catalog/featured-products/featured-products.json",
    featured.slice(0, 12)
  );

  console.log("");
  console.log(`✅ Saved locally: featured-products.json`);
  console.log(`✅ Uploaded to R2: catalog/featured-products/featured-products.json`);
  console.log(`✅ Total featured products: ${featured.length}`);
}

main();