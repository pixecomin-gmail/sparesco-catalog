const { clean, slugify, unique } = require("./utils");
const { getValue } = require("./excel-reader");

function parsePrice(value) {
  const number = Number(String(value || "").replace(/,/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function splitTags(value) {
  return unique(clean(value).split(","));
}

function splitSpecifications(value) {
  const raw = clean(value);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return unique(parsed);
  } catch {}

  return unique(
    raw
      .replace(/^\[|\]$/g, "")
      .split(/\n|\|/)
      .map((item) => item.replace(/^"|"$/g, ""))
  );
}

function buildProducts(rows, collectionName) {
  const collectionHandle = slugify(collectionName);
  const map = new Map();

  for (const row of rows) {
    const handle = slugify(getValue(row, ["Handle"]));
    if (!handle) continue;

    if (!map.has(handle)) {
      map.set(handle, {
        handle,
        title: getValue(row, ["Title"]) || handle,
        collection: collectionHandle,
        category: slugify(getValue(row, ["Category"]) || collectionName),
        tags: splitTags(getValue(row, ["Tags"])),
        images: [],
        variants: [],
        __sources: [],
      });
    }

    const product = map.get(handle);

    const originalImage = getValue(row, ["Variant Image", "Image Src"]);

    const partNumber = getValue(row, [
      "Variant Metafield: custom.part_number [single_line_text_field]",
    ]);

    const option1Value = getValue(row, ["Option1 Value"]);

    product.__sources.push({
      excelFile: row.__excelFile,
      sourceRow: row.__sourceRow,
    });

    product.variants.push({
      title:
        option1Value ||
        partNumber ||
        getValue(row, ["Title"]) ||
        product.title,

      option1Value,
      image: originalImage,

      vendor: getValue(row, [
        "Variant Metafield: custom.vendor [single_line_text_field]",
        "Vendor",
      ]),

      price: parsePrice(getValue(row, ["Variant Price"])),

      partNumber,

      hsCode: getValue(row, [
        "Variant Metafield: custom.hs_code [single_line_text_field]",
      ]),

      countryOfOrigin: getValue(row, [
        "Variant Metafield: custom.country_of_origin [single_line_text_field]",
      ]),

      description: getValue(row, [
        "Variant Metafield: custom.brand_description [multi_line_text_field]",
        "Body HTML",
      ]),

      specifications: splitSpecifications(
        getValue(row, [
          "Variant Metafield: custom.specification [list.single_line_text_field]",
        ])
      ),

      unitWeight: getValue(row, [
        "Variant Metafield: custom.unit_weight [single_line_text_field]",
      ]),

      shippingVolume: getValue(row, [
        "Variant Metafield: custom.shipping_volume [single_line_text_field]",
      ]),

      __excelFile: row.__excelFile,
      __sourceRow: row.__sourceRow,
    });
  }

  for (const product of map.values()) {
    product.tags = unique([collectionHandle, product.category, ...product.tags]);
  }

  return Array.from(map.values());
}

module.exports = {
  buildProducts,
};