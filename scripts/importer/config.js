const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local", quiet: true });

const CONSTANTS = require("./constants");

function ensureFolder(folder) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
}

function initializeFolders() {
  ensureFolder(CONSTANTS.REPORTS_DIR);
  ensureFolder(CONSTANTS.LOGS_DIR);
}

function getEnvironment() {
  return {
    accountId: process.env[CONSTANTS.R2.ACCOUNT_ID],
    accessKey: process.env[CONSTANTS.R2.ACCESS_KEY],
    secretKey: process.env[CONSTANTS.R2.SECRET_KEY],
    bucket: process.env[CONSTANTS.R2.BUCKET],
    publicUrl: process.env[CONSTANTS.R2.PUBLIC_URL],
  };
}

function getCollections() {
  if (!fs.existsSync(CONSTANTS.IMPORTS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(CONSTANTS.IMPORTS_DIR, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((folder) => {
      const folderPath = path.join(CONSTANTS.IMPORTS_DIR, folder.name);

      const excelFiles = fs
        .readdirSync(folderPath)
        .filter((file) => file.toLowerCase().endsWith(".xlsx"))
        .sort();

      if (!excelFiles.length) return null;

      return {
        name: folder.name,
        folder: folderPath,
        excelFiles,
        excelPaths: excelFiles.map((file) => path.join(folderPath, file)),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = {
  initializeFolders,
  getEnvironment,
  getCollections,
};