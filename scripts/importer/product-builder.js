const { clean, slugify, canonicalize, unique } = require("./utils");
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

function cleanTitle(title) {
  return clean(title)
    .split("| Replaces")[0]
    .split("| replaces")[0]
    .trim();
}

function buildProducts(rows, collectionName) {
  const collectionHandle = slugify(collectionName);
  const map = new Map();

  for (const row of rows) {
    const rawHandle = getValue(row, ["Handle"]);

    const partNumber = getValue(row, [
      "Variant Metafield: custom.part_number [single_line_text_field]",
    ]);

    const handleSource = rawHandle || partNumber;
    const canonicalSource = rawHandle || partNumber;
    const handle = slugify(handleSource);

    if (!handle) continue;

    const option1Value = getValue(row, ["Option1 Value"]);
    const originalImage = getValue(row, ["Variant Image", "Image Src"]);

    if (!map.has(handle)) {
      map.set(handle, {
        handle,
        canonicalKey: canonicalize(canonicalSource),
        title: getValue(row, ["Title"]) || partNumber || handle,
        collection: collectionHandle,
        category: slugify(
          getValue(row, ["Category"]) || collectionName
        ),
        imageFolder: collectionHandle,
        tags: splitTags(getValue(row, ["Tags"])),
        images: [],
        variants: [],
        sources: [],
      });
    }

    const product = map.get(handle);

    product.sources.push({
      collectionHandle,
      collectionName,
      excelFile: row.__excelFile,
      sourceRow: row.__sourceRow,
      rawHandle,
      rawPartNumber: partNumber,
      canonicalKey: canonicalize(canonicalSource),
    });

    product.variants.push({
      title: cleanTitle(option1Value) || partNumber || product.title,
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
    });
  }

  for (const product of map.values()) {
    product.tags = unique([
      collectionHandle,
      product.category,
      ...product.tags,
    ])
      .map(slugify)
      .filter(Boolean);
  }

  return Array.from(map.values());
}

module.exports = { buildProducts };
