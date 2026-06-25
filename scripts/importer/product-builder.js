// scripts/importer/product-builder.js

function clean(value) {
  return String(value || "").trim();
}

function slugify(value) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePrice(value) {
  const number = Number(String(value || "").replace(/,/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function splitTags(value) {
  return clean(value)
    .split(",")
    .map((item) => clean(item))
    .filter(Boolean);
}

function splitSpecifications(value) {
  const raw = clean(value);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => clean(item)).filter(Boolean);
    }
  } catch {}

  return raw
    .replace(/^\[|\]$/g, "")
    .split(/\n|\|/,)
    .map((item) => clean(item.replace(/^"|"$/g, "")))
    .filter(Boolean);
}

function build(groupedProducts, collectionName) {
  const products = [];
  const collectionHandle = slugify(collectionName);

  for (const [, product] of groupedProducts) {
    const first = product.rows[0];

    const productJson = {
      handle: slugify(first["Handle"]),
      title: clean(first["Title"]) || clean(first["Handle"]),
      collection: collectionName,
      collectionHandle,
      category: clean(first["Category"]) || collectionName,
      tags: splitTags(first["Tags"]),
      images: [],
      variants: [],
    };

    const imageSet = new Set();

    for (const row of product.rows) {
      const image = clean(row["Variant Image"] || row["Image Src"]);

      if (image && !imageSet.has(image)) {
        imageSet.add(image);
        productJson.images.push(image);
      }

      productJson.variants.push({
        title: clean(row["Title"]) || productJson.title,
        sku: clean(row["Variant SKU"]),
        option1Value: clean(row["Option1 Value"]),
        image,
        vendor:
          clean(
            row[
              "Variant Metafield: custom.vendor [single_line_text_field]"
            ]
          ) || clean(row["Vendor"]),
        price: parsePrice(row["Variant Price"]),
        partNumber: clean(
          row[
            "Variant Metafield: custom.part_number [single_line_text_field]"
          ]
        ),
        hsCode: clean(
          row[
            "Variant Metafield: custom.hs_code [single_line_text_field]"
          ]
        ),
        countryOfOrigin: clean(
          row[
            "Variant Metafield: custom.country_of_origin [single_line_text_field]"
          ]
        ),
        description:
          clean(
            row[
              "Variant Metafield: custom.brand_description [multi_line_text_field]"
            ]
          ) || clean(row["Body HTML"]),
        specifications: splitSpecifications(
          row[
            "Variant Metafield: custom.specification [list.single_line_text_field]"
          ]
        ),
        unitWeight: clean(
          row[
            "Variant Metafield: custom.unit_weight [single_line_text_field]"
          ]
        ),
        shippingVolume: clean(
          row[
            "Variant Metafield: custom.shipping_volume [single_line_text_field]"
          ]
        ),
      });
    }

    products.push(productJson);
  }

  return products;
}

module.exports = {
  build,
};