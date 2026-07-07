const {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const config = require("./config");

function validateR2() {
  const missing = [];

  if (!config.R2.accountId) missing.push("R2_ACCOUNT_ID");
  if (!config.R2.accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!config.R2.secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!config.R2.bucket) missing.push("R2_BUCKET");
  if (!config.R2.publicUrl) missing.push("NEXT_PUBLIC_R2_PUBLIC_URL");

  if (missing.length) {
    throw new Error("Missing env variables: " + missing.join(", "));
  }
}

validateR2();

const client = new S3Client({
  region: "auto",
  endpoint: `https://${config.R2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.R2.accessKeyId,
    secretAccessKey: config.R2.secretAccessKey,
  },
});

async function exists(key) {
  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: config.R2.bucket,
        Key: key,
      })
    );

    return true;
  } catch {
    return false;
  }
}

async function uploadJson(key, data) {
  await client.send(
    new PutObjectCommand({
      Bucket: config.R2.bucket,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: "application/json",
      CacheControl: "public, max-age=300",
    })
  );
}

async function uploadBuffer(key, buffer, contentType) {
  await client.send(
    new PutObjectCommand({
      Bucket: config.R2.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType || "application/octet-stream",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

async function readJson(key) {
  const response = await client.send(
    new GetObjectCommand({
      Bucket: config.R2.bucket,
      Key: key,
    })
  );

  const text = await response.Body.transformToString();
  return JSON.parse(text);
}

async function remove(key) {
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.R2.bucket,
      Key: key,
    })
  );
}

function publicUrl(key) {
  return `${config.R2.publicUrl.replace(/\/$/, "")}/${key}`;
}

module.exports = {
  exists,
  uploadJson,
  uploadBuffer,
  readJson,
  remove,
  publicUrl,
};