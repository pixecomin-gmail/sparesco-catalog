// scripts/importer/constants.js

const path = require("path");

const ROOT = process.cwd();

module.exports = {
  // Root
  ROOT,

  // Folders
  IMPORTS_DIR: path.join(ROOT, "imports"),
  REPORTS_DIR: path.join(ROOT, "reports"),
  LOGS_DIR: path.join(ROOT, "logs"),

  PUBLIC_DIR: path.join(ROOT, "public"),
  PUBLIC_DATA_DIR: path.join(ROOT, "public", "data"),

  PUBLIC_PRODUCTS_DIR: path.join(
    ROOT,
    "public",
    "data",
    "products"
  ),

  PUBLIC_COLLECTION_PRODUCTS_DIR: path.join(
    ROOT,
    "public",
    "data",
    "collection-products"
  ),

  // Files
  PRODUCTS_INDEX_FILE: path.join(
    ROOT,
    "public",
    "data",
    "products-index.json"
  ),

  SEARCH_INDEX_FILE: path.join(
    ROOT,
    "public",
    "data",
    "search-index.json"
  ),

  COLLECTIONS_FILE: path.join(
    ROOT,
    "public",
    "data",
    "collections.json"
  ),

  // Cloudflare R2
  R2: {
    ACCOUNT_ID: "R2_ACCOUNT_ID",
    ACCESS_KEY: "R2_ACCESS_KEY_ID",
    SECRET_KEY: "R2_SECRET_ACCESS_KEY",
    BUCKET: "R2_BUCKET",
    PUBLIC_URL: "NEXT_PUBLIC_R2_PUBLIC_URL",
  },

  // Import
  MAX_IMAGE_RETRIES: 3,
  IMAGE_CONCURRENCY: 20,

  // Required Matrixify Columns
  REQUIRED_COLUMNS: [
    "Handle",
    "Title",
    "Vendor",
    "Category",
    "Tags",
    "Image Src",
    "Variant SKU",
    "Variant Image",
    "Variant Price",
    "Variant Metafield: custom.part_number [single_line_text_field]",
    "Variant Metafield: custom.hs_code [single_line_text_field]",
    "Variant Metafield: custom.country_of_origin [single_line_text_field]",
    "Variant Metafield: custom.brand_description [multi_line_text_field]",
    "Variant Metafield: custom.specification [list.single_line_text_field]",
    "Variant Metafield: custom.unit_weight [single_line_text_field]",
    "Variant Metafield: custom.shipping_volume [single_line_text_field]",
    "Variant Metafield: custom.vendor [single_line_text_field]",
  ],

  IMAGE_EXTENSIONS: [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".avif",
  ],

  REPORT_FILES: {
    SUMMARY: "summary.json",
    DUPLICATES: "duplicates.csv",
    FAILED_IMAGES: "failed-images.csv",
    LOG: "import.log",
  },
};