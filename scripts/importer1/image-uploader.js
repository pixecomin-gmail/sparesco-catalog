const config = require("./config");

const {
  uploadBuffer,
  listKeys,
} = require("./r2-client");

const {
  imageKey,
  shortHash,
  slugify,
  sleep,
} = require("./utils");

async function mapLimit(items, concurrency, worker) {
  if (!items.length) return [];

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
    Array.from(
      {
        length: Math.min(concurrency, items.length),
      },
      () => run()
    )
  );

  return results;
}

function extensionFromUrl(url, contentType) {
  const cleanUrl = String(url || "")
    .split("?")[0]
    .toLowerCase();

  if (cleanUrl.endsWith(".png")) return ".png";
  if (cleanUrl.endsWith(".webp")) return ".webp";
  if (cleanUrl.endsWith(".gif")) return ".gif";
  if (cleanUrl.endsWith(".avif")) return ".avif";

  if (
    cleanUrl.endsWith(".jpg") ||
    cleanUrl.endsWith(".jpeg")
  ) {
    return ".jpg";
  }

  if (contentType?.includes("png")) return ".png";
  if (contentType?.includes("webp")) return ".webp";
  if (contentType?.includes("gif")) return ".gif";
  if (contentType?.includes("avif")) return ".avif";

  return ".jpg";
}

async function downloadImage(url) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(
          `Image download failed ${response.status}`
        );
      }

      return {
        buffer: Buffer.from(await response.arrayBuffer()),
        contentType:
          response.headers.get("content-type") ||
          "image/jpeg",
      };
    } catch (error) {
      lastError = error;

      if (attempt < 3) {
        await sleep(attempt * 1000);
      }
    }
  }

  throw lastError;
}

async function loadExistingImageKeys(collectionHandles) {
  const result = new Map();

  for (let index = 0; index < collectionHandles.length; index++) {
    const handle = slugify(collectionHandles[index]);
    const keys = await listKeys(`catalog/images/${handle}/`);

    result.set(handle, new Set(keys));

    console.log(
      `Images ${index + 1}/${collectionHandles.length}: ` +
        `${handle} (${keys.length} existing)`
    );
  }

  return result;
}

async function uploadProductImages(product, existingByCollection) {
  const folder = slugify(
    product.imageFolder || product.collection
  );

  const existingKeys =
    existingByCollection.get(folder) || new Set();

  existingByCollection.set(folder, existingKeys);

  const urls = [
    ...new Set(
      (product.variants || [])
        .map((variant) =>
          String(variant.image || "").trim()
        )
        .filter((url) => url.startsWith("http"))
    ),
  ];

  const resolved = new Map();
  const failures = [];

  await mapLimit(
    urls,
    config.CONCURRENCY.images,
    async (url) => {
      try {
        const file = await downloadImage(url);
        const ext = extensionFromUrl(
          url,
          file.contentType
        );

        const filename =
          `${product.handle}-${shortHash(url)}${ext}`;

        const key = imageKey(folder, filename);

        if (!existingKeys.has(key)) {
          await uploadBuffer(
            key,
            file.buffer,
            file.contentType
          );

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
    }
  );

  for (const variant of product.variants || []) {
    const original = String(variant.image || "").trim();

    if (resolved.has(original)) {
      variant.image = resolved.get(original);
    }
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
