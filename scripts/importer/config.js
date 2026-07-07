const path = require("path");
require("dotenv").config({ path: ".env.local" });

const ROOT = process.cwd();

module.exports = {
  ROOT,

  IMPORTS_DIR: path.join(ROOT, "imports"),

  REPORTS_DIR: path.join(ROOT, "imports"),

  R2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
    publicUrl: process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
  },

  CATALOG: {
    ROOT: "catalog",
    PRODUCTS: "catalog/products",
    IMAGES: "catalog/images",
    INDEXES: "catalog/indexes",
    REPORTS: "catalog/reports",
  },

  INDEX_FILES: {
    CATALOG: "catalog-index.json",
    COLLECTIONS: "collections.json",
    STATS: "stats.json",
  },
};