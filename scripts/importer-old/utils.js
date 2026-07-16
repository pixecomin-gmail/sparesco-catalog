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

module.exports = {
  clean,
  slugify,
  unique,
  productFolder,
  productKey,
  imageKey,
};