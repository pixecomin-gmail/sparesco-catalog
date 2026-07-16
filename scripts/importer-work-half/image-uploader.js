const path = require("path");
const config = require("./config");
const { uploadBuffer, listKeys } = require("./r2-client");
const { imageKey, shortHash, slugify } = require("./utils");

function extensionFromUrl(url, contentType) {
  const cleanUrl = String(url || "").split("?")[0].toLowerCase();

  if (cleanUrl.endsWith(".png")) return ".png";
  if (cleanUrl.endsWith(".webp")) return ".webp";
  if (cleanUrl.endsWith(".gif")) return ".gif";
  if (cleanUrl.endsWith(".avif")) return ".avif";
  if (cleanUrl.endsWith(".jpeg") || cleanUrl.endsWith(".jpg")) return ".jpg";

  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("gif")) return ".gif";
  if (contentType?.includes("avif")) return ".avif";

  return ".jpg";
}

async function mapLimit(items, concurrency, worker) {
  let cursor = 0;
  const results = new Array(items.length);

  async function run() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, run)
  );

  return results;
}

async function loadExistingImageKeys(collectionHandles) {
  const result = new Map();

  for (const handle of collectionHandles) {
    const prefix = `catalog/images/${slugify(handle)}/`;
    const keys = await listKeys(prefix);
    result.set(slugify(handle), new Set(keys));
    console.log(`Existing images ${handle}: ${keys.length}`);
  }

  return result;
}

async function downloadImage(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Image download failed ${response.status}`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || "image/jpeg",
  };
}

async function uploadProductImages(product, existingByCollection) {
  const folder = slugify(product.imageFolder || product.collection);
  const existingKeys = existingByCollection.get(folder) || new Set();
  existingByCollection.set(folder, existingKeys);

  const urls = [
    ...new Set(
      (product.variants || [])
        .map((variant) => String(variant.image || "").trim())
        .filter((url) => url.startsWith("http"))
    ),
  ];

  const resolved = new Map();
  const failures = [];

  await mapLimit(urls, config.CONCURRENCY.images, async (url) => {
    try {
      const file = await downloadImage(url);
      const ext = extensionFromUrl(url, file.contentType);
      const filename = `${product.handle}-${shortHash(url)}${ext}`;
      const key = imageKey(folder, filename);

      if (!existingKeys.has(key)) {
        await uploadBuffer(key, file.buffer, file.contentType);
        existingKeys.add(key);
      }

      resolved.set(url, filename);
    } catch (error) {
      failures.push({
        handle: product.handle,
        imageUrl: url,
        reason: error.message,
      });
    }
  });

  for (const variant of product.variants || []) {
    const original = String(variant.image || "").trim();
    if (resolved.has(original)) variant.image = resolved.get(original);
  }

  product.images = [
    ...new Set(
      (product.variants || [])
        .map((variant) => variant.image)
        .filter(Boolean)
    ),
  ];

  return failures;
}

module.exports = {
  mapLimit,
  loadExistingImageKeys,
  uploadProductImages,
};
