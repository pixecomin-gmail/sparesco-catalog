const fs = require("fs");
const CONSTANTS = require("./constants");
const logger = require("./logger");
const config = require("./config");

function validateEnvironment() {
  const env = config.getEnvironment();

  const missing = [];

  if (!env.accountId) missing.push("R2_ACCOUNT_ID");
  if (!env.accessKey) missing.push("R2_ACCESS_KEY_ID");
  if (!env.secretKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!env.bucket) missing.push("R2_BUCKET");
  if (!env.publicUrl) missing.push("NEXT_PUBLIC_R2_PUBLIC_URL");

  if (missing.length) {
    logger.error("Missing environment variables:");
    missing.forEach((item) => logger.error("  - " + item));
    process.exit(1);
  }

  logger.success("Environment OK");
}

function validateFolders() {
  const folders = [
    CONSTANTS.IMPORTS_DIR,
    CONSTANTS.DATA_PRODUCTS_DIR,
    CONSTANTS.PUBLIC_PRODUCTS_DIR,
  ];

  const missing = folders.filter((folder) => !fs.existsSync(folder));

  if (missing.length) {
    logger.error("Missing folders:");
    missing.forEach((folder) => logger.error("  - " + folder));
    process.exit(1);
  }

  logger.success("Folders OK");
}

function validateCollections() {
  const collections = config.getCollections();

  if (!collections.length) {
    logger.error("No collections found inside imports/");
    process.exit(1);
  }

  logger.success(`${collections.length} collection(s) found`);

  return collections;
}

module.exports = {
  validateEnvironment,
  validateFolders,
  validateCollections,
};