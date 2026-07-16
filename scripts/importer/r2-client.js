const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");

const config = require("./config");
const { sleep } = require("./utils");

function validateR2() {
  const missing = [];

  if (!config.R2.accountId) missing.push("R2_ACCOUNT_ID");
  if (!config.R2.accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!config.R2.secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!config.R2.bucket) missing.push("R2_BUCKET");

  if (missing.length) {
    throw new Error(
      "Missing environment variables: " + missing.join(", ")
    );
  }
}

validateR2();

const client = new S3Client({
  region: "auto",
  endpoint:
    `https://${config.R2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.R2.accessKeyId,
    secretAccessKey: config.R2.secretAccessKey,
  },
  maxAttempts: 1,
});

async function sendWithRetry(command) {
  let lastError;

  for (
    let attempt = 1;
    attempt <= config.RETRIES.request;
    attempt++
  ) {
    try {
      return await client.send(command);
    } catch (error) {
      lastError = error;

      const status = error?.$metadata?.httpStatusCode;
      const retryable = [429, 500, 502, 503, 504].includes(status);

      if (!retryable || attempt === config.RETRIES.request) {
        break;
      }

      await sleep(Math.min(10000, attempt * 1500));
    }
  }

  throw lastError;
}

async function uploadJson(key, data) {
  await sendWithRetry(
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
  await sendWithRetry(
    new PutObjectCommand({
      Bucket: config.R2.bucket,
      Key: key,
      Body: buffer,
      ContentType:
        contentType || "application/octet-stream",
      CacheControl:
        "public, max-age=31536000, immutable",
    })
  );
}

async function readJson(key) {
  const response = await sendWithRetry(
    new GetObjectCommand({
      Bucket: config.R2.bucket,
      Key: key,
    })
  );

  const text = await response.Body.transformToString();
  return JSON.parse(text);
}

async function safeReadJson(key, fallback) {
  try {
    return await readJson(key);
  } catch {
    return fallback;
  }
}

async function listKeys(prefix) {
  const keys = [];
  let continuationToken;

  do {
    const response = await sendWithRetry(
      new ListObjectsV2Command({
        Bucket: config.R2.bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      })
    );

    for (const item of response.Contents || []) {
      keys.push(item.Key);
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return keys;
}

async function removePrefix(prefix) {
  const keys = await listKeys(prefix);

  for (let index = 0; index < keys.length; index += 1000) {
    const batch = keys.slice(index, index + 1000);

    await sendWithRetry(
      new DeleteObjectsCommand({
        Bucket: config.R2.bucket,
        Delete: {
          Objects: batch.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    );
  }

  return keys.length;
}

module.exports = {
  uploadJson,
  uploadBuffer,
  readJson,
  safeReadJson,
  listKeys,
  removePrefix,
};
