const path = require("path");
require("dotenv").config({ path: ".env.local" });

const ROOT = process.cwd();

module.exports = {
  ROOT,
  IMPORTS_DIR: path.join(ROOT, "imports"),
  STATE_DIR: path.join(ROOT, ".import-state"),
  DB_PATH: path.join(ROOT, ".import-state", "catalog-import.sqlite"),
  REPORTS_DIR: path.join(ROOT, ".import-state", "reports"),

  R2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
  },

  CONCURRENCY: {
    products: Number(process.env.IMPORT_PRODUCT_CONCURRENCY || 8),
    images: Number(process.env.IMPORT_IMAGE_CONCURRENCY || 8),
    publish: Number(process.env.IMPORT_PUBLISH_CONCURRENCY || 12),
  },

  RETRIES: {
    request: Number(process.env.IMPORT_REQUEST_RETRIES || 6),
    product: Number(process.env.IMPORT_PRODUCT_RETRIES || 3),
  },

  PAGE_SIZE: {
    catalog: 1000,
    category: 24,
  },
};
