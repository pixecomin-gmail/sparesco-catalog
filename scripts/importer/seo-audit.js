const {
  readJson,
} = require("./r2-client");

async function main() {
  console.log("");
  console.log("SPARESCO FAST SEO AUDIT");
  console.log("=======================");
  console.log("");

  console.log("Reading catalogue index...");

  const catalog = await readJson(
    "catalog/indexes/catalog-index.json"
  );

  console.log(
    `Products: ${catalog.length.toLocaleString()}`
  );

  let vendor = 0;
  let partNumber = 0;
  let image = 0;
  let price = 0;
  let multipleVariants = 0;

  const collections = new Map();

  for (const product of catalog) {
    if (product.vendor) vendor++;
    if (product.partNumber) partNumber++;
    if (product.image) image++;
    if (Number(product.price || 0) > 0)
      price++;

    if (
      Number(product.variantCount || 0) > 1
    ) {
      multipleVariants++;
    }

    const collection =
      product.collection || "unknown";

    if (!collections.has(collection)) {
      collections.set(collection, {
        total: 0,
        vendor: 0,
        partNumber: 0,
        image: 0,
        multipleVariants: 0,
      });
    }

    const c = collections.get(collection);

    c.total++;

    if (product.vendor) c.vendor++;
    if (product.partNumber) c.partNumber++;
    if (product.image) c.image++;

    if (
      Number(product.variantCount || 0) > 1
    ) {
      c.multipleVariants++;
    }
  }

  function percent(value) {
    return (
      ((value / catalog.length) * 100)
        .toFixed(1) + "%"
    );
  }

  console.log("");
  console.log("CATALOGUE SUMMARY");
  console.log("-----------------");

  console.log(
    `Vendor present:       ${vendor.toLocaleString()} (${percent(vendor)})`
  );

  console.log(
    `Part number present:  ${partNumber.toLocaleString()} (${percent(partNumber)})`
  );

  console.log(
    `Image present:        ${image.toLocaleString()} (${percent(image)})`
  );

  console.log(
    `Price present:        ${price.toLocaleString()} (${percent(price)})`
  );

  console.log(
    `Multiple variants:    ${multipleVariants.toLocaleString()} (${percent(multipleVariants)})`
  );

  console.log("");
  console.log("TOP COLLECTIONS");
  console.log("---------------");

  const topCollections =
    [...collections.entries()]
      .sort(
        (a, b) =>
          b[1].total - a[1].total
      )
      .slice(0, 20);

  for (
    const [name, data]
    of topCollections
  ) {
    console.log(
      `${name.padEnd(25)} ${String(
        data.total
      ).padStart(8)} products`
    );
  }

  console.log("");
  console.log(
    "Fast catalogue audit complete."
  );
}

main().catch((error) => {
  console.error("");
  console.error("SEO AUDIT FAILED");
  console.error(error);
  process.exit(1);
});