const crypto = require("crypto");

function clean(value) {
  return String(value || "").trim();
}

function slugify(value) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unique(values) {
  return [...new Set((values || []).map(clean).filter(Boolean))];
}

function productFolder(handle) {
  const safeHandle = slugify(handle);
  let hash = 0;

  for (let i = 0; i < safeHandle.length; i++) {
    hash = (hash * 31 + safeHandle.charCodeAt(i)) >>> 0;
  }

  return (hash % 256).toString(16).padStart(2, "0");
}

function productKey(handle) {
  const safeHandle = slugify(handle);
  return `catalog/products/${productFolder(safeHandle)}/${safeHandle}.json`;
}

function imageKey(collectionHandle, filename) {
  return `catalog/images/${slugify(collectionHandle)}/${filename}`;
}

function shortHash(value) {
  return crypto.createHash("sha1").update(String(value || "")).digest("hex").slice(0, 12);
}

function titleFromHandle(handle) {
  return String(handle || "")
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function pageNumber(index) {
  return String(index + 1).padStart(4, "0");
}

module.exports = {
  clean,
  slugify,
  unique,
  productFolder,
  productKey,
  imageKey,
  shortHash,
  titleFromHandle,
  pageNumber,
};
