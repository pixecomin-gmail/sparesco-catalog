const fs = require("fs");
const path = require("path");
const { uploadJson } = require("./importer/r2-client");

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

if (!R2_BASE) {
  console.error("❌ Missing NEXT_PUBLIC_R2_PUBLIC_URL");
  process.exit(1);
}

async function main() {
  const handlesPath = path.join(process.cwd(), "data", "popular-handles.json");

  if (!fs.existsSync(handlesPath)) {
    console.error("❌ Missing data/popular-handles.json");
    process.exit(1);
  }

  const rawHandles = JSON.parse(fs.readFileSync(handlesPath, "utf8"));

  const handles = rawHandles.map((item) =>
    typeof item === "string" ? item : item.handle
  );

  const indexUrl = `${R2_BASE.replace(
    /\/$/,
    ""
  )}/catalog/indexes/catalog-index.json`;

  const res = await fetch(indexUrl, {
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("❌ Could not fetch catalog-index.json", res.status);
    process.exit(1);
  }

  const catalog = await res.json();
  const products = Array.isArray(catalog) ? catalog : catalog.products || [];
  const productMap = new Map(products.map((product) => [product.handle, product]));

  const popular = [];

  for (const handle of handles) {
    const product = productMap.get(handle);

    if (!product) {
      console.log(`❌ Missing: ${handle}`);
      continue;
    }

    popular.push(product);
    console.log(`✅ Added: ${handle}`);
  }

  const finalProducts = popular.slice(0, 5);

  fs.writeFileSync(
    path.join(process.cwd(), "popular-products.json"),
    JSON.stringify(finalProducts, null, 2)
  );

  await uploadJson(
    "catalog/popular-products/popular-products.json",
    finalProducts
  );

  console.log("");
  console.log("✅ Uploaded to R2: catalog/popular-products/popular-products.json");
  console.log(`✅ Total popular products: ${finalProducts.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});