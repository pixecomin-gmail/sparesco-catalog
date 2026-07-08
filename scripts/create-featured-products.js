const fs = require("fs");
const path = require("path");
const { uploadJson } = require("./importer/r2-client");

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

if (!R2_BASE) {
  console.error("❌ Missing NEXT_PUBLIC_R2_PUBLIC_URL");
  process.exit(1);
}

async function main() {
  const handlesPath = path.join(process.cwd(), "data", "featured-handles.json");

  if (!fs.existsSync(handlesPath)) {
    console.error("❌ Missing data/featured-handles.json");
    process.exit(1);
  }

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

  const finalProducts = featured.slice(0, 12);

  fs.writeFileSync(
    path.join(process.cwd(), "featured-products.json"),
    JSON.stringify(finalProducts, null, 2)
  );

  await uploadJson(
    "catalog/featured-products/featured-products.json",
    finalProducts
  );

  console.log("");
  console.log("✅ Uploaded to R2: catalog/featured-products/featured-products.json");
  console.log(`✅ Total featured products: ${finalProducts.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});