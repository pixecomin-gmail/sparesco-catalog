// scripts/importer/image-uploader.js

const crypto = require("crypto");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

let client = null;
let bucket = "";
let publicBase = "";

function initialize(env) {
  bucket = env.bucket;
  publicBase = env.publicUrl.replace(/\/$/, "");

  client = new S3Client({
    region: "auto",
    endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.accessKey,
      secretAccessKey: env.secretKey,
    },
  });
}

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

function extensionFromUrl(url, contentType) {
  const cleanUrl = String(url).split("?")[0].toLowerCase();

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

async function download(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Download failed ${response.status}`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || "image/jpeg",
  };
}

async function upload(url, collection, handle, variantKey) {
  if (!client) {
    throw new Error("Image uploader not initialized.");
  }

  const imageUrl = clean(url);

  if (!imageUrl || !imageUrl.startsWith("http")) {
    return "";
  }

  const file = await download(imageUrl);

  const hash = crypto
    .createHash("md5")
    .update(imageUrl)
    .digest("hex")
    .slice(0, 12);

  const ext = extensionFromUrl(imageUrl, file.contentType);

  const key = `${slugify(collection)}/${slugify(handle)}-${slugify(
    variantKey || hash
  )}-${hash}${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.contentType,
    })
  );

  return `${publicBase}/${key}`;
}

module.exports = {
  initialize,
  upload,
};