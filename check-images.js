const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync(".import-state/catalog-import.sqlite");

const rows = db
  .prepare("SELECT product_json FROM products WHERE status = 'completed'")
  .all();

let noImages = 0;
let oneImage = 0;
let multiImage = 0;

for (const row of rows) {
  const product = JSON.parse(row.product_json);

  const images = Array.isArray(product.images)
    ? product.images.filter(Boolean)
    : [];

  if (images.length === 0) {
    noImages++;
  } else if (images.length === 1) {
    oneImage++;
  } else {
    multiImage++;
  }
}

console.log({
  totalProducts: rows.length,
  productsWithoutImages: noImages,
  productsWithOneImage: oneImage,
  productsWithMultipleImages: multiImage,
});

db.close();