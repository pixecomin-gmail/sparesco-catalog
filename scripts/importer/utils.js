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

function canonicalize(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function unique(values) {
  return [...new Set((values || []).map(clean).filter(Boolean))];
}

function productFolder(handle) {
  const safeHandle = slugify(handle);
  let hash = 0;

  for (let index = 0; index < safeHandle.length; index++) {
    hash = (hash * 31 + safeHandle.charCodeAt(index)) >>> 0;
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

function imageManifestKey(collectionHandle) {
  return `catalog/image-manifests/${slugify(collectionHandle)}.json`;
}

function registryShard(value) {
  const first = canonicalize(value)[0];

  if (!first) return "other";
  if (first >= "0" && first <= "9") return first;
  if (first >= "a" && first <= "z") return first;

  return "other";
}

function registryKey(shard) {
  return `catalog/duplicate-registry/${shard}.json`;
}

function shortHash(value) {
  return crypto
    .createHash("sha1")
    .update(String(value || ""))
    .digest("hex")
    .slice(0, 12);
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  clean,
  slugify,
  canonicalize,
  unique,
  productFolder,
  productKey,
  imageKey,
  imageManifestKey,
  registryShard,
  registryKey,
  shortHash,
  titleFromHandle,
  pageNumber,
  sleep,
};
