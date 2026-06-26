const fs = require("fs");
const path = require("path");
const CONSTANTS = require("./constants");

function productExists(handle) {
  return fs.existsSync(
    path.join(
      CONSTANTS.PUBLIC_PRODUCTS_DIR,
      `${handle}.json`
    )
  );
}

module.exports = {
  productExists,
};