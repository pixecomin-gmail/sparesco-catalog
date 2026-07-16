const path = require("path");
require("dotenv").config({ path: ".env.local" });

const ROOT = process.cwd();

module.exports = {
  ROOT,
  IMPORTS_DIR: path.join(ROOT, "imports"),
  STATE_DIR: path.join(ROOT, ".import-state"),
  R2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
    publicUrl: process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
  },
  CONCURRENCY: {
    products: Number(process.env.IMPORT_PRODUCT_CONCURRENCY || 15),
    images: Number(process.env.IMPORT_IMAGE_CONCURRENCY || 20),
  },
  PAGE_SIZE: {
    catalog: 1000,
    category: 24,
  },
};
