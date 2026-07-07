const { uploadBuffer, exists } = require("./r2-client");
const { imageKey } = require("./utils");

function extensionFromUrl(url, contentType) {
  const cleanUrl = String(url || "").split("?")[0].toLowerCase();

  if (cleanUrl.endsWith(".png")) return ".png";
  if (cleanUrl.endsWith(".webp")) return ".webp";
  if (cleanUrl.endsWith(".gif")) return ".gif";
  if (cleanUrl.endsWith(".avif")) return ".avif";
  if (cleanUrl.endsWith(".jpeg")) return ".jpg";
  if (cleanUrl.endsWith(".jpg")) return ".jpg";

  if (contentType && contentType.includes("png")) return ".png";
  if (contentType && contentType.includes("webp")) return ".webp";
  if (contentType && contentType.includes("gif")) return ".gif";
  if (contentType && contentType.includes("avif")) return ".avif";

  return ".jpg";
}

async function downloadImage(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Image download failed ${response.status}`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || "image/jpeg",
  };
}

async function uploadProductImages(product) {
  let imageNumber = 1;
  const originalToFilename = new Map();
  const failedImages = [];

  const existingImages = Array.isArray(product.images)
    ? product.images.filter(Boolean)
    : [];

  for (const variant of product.variants || []) {
    const originalImage = String(variant.image || "").trim();

    if (!originalImage) {
      continue;
    }

    if (!originalImage.startsWith("http")) {
      originalToFilename.set(originalImage, originalImage);
      continue;
    }

    if (originalToFilename.has(originalImage)) {
      variant.image = originalToFilename.get(originalImage);
      continue;
    }

    try {
      const file = await downloadImage(originalImage);
      const ext = extensionFromUrl(originalImage, file.contentType);
      const filename = `${product.handle}-${imageNumber}${ext}`;
      const key = imageKey(product.collection, filename);

      if (!(await exists(key))) {
        await uploadBuffer(key, file.buffer, file.contentType);
      }

      originalToFilename.set(originalImage, filename);
      variant.image = filename;
      imageNumber++;
    } catch (error) {
      failedImages.push({
        handle: product.handle,
        imageUrl: originalImage,
        reason: error.message,
      });
    }
  }

  const variantImages = (product.variants || [])
    .map((variant) => variant.image)
    .filter(Boolean);

  product.images = [...new Set([...existingImages, ...variantImages])];

  return failedImages;
}

module.exports = {
  uploadProductImages,
};