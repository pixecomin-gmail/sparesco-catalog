const fs = require("fs");
const path = require("path");
const {
  S3Client,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

require("dotenv").config({ path: ".env.local" });

const ROOT = process.cwd();
const PRODUCTS_DIR = path.join(ROOT, "public", "data", "products");
const CONCURRENCY = 50;

const env = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKey: process.env.R2_ACCESS_KEY_ID,
  secretKey: process.env.R2_SECRET_ACCESS_KEY,
  bucket: process.env.R2_BUCKET,
};

for (const [key, value] of Object.entries(env)) {
  if (!value) {
    console.error(`Missing ${key}`);
    process.exit(1);
  }
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.accessKey,
    secretAccessKey: env.secretKey,
  },
});

async function uploadFile(file) {
  const filePath = path.join(PRODUCTS_DIR, file);
  const body = fs.readFileSync(filePath);

  await client.send(
    new PutObjectCommand({
      Bucket: env.bucket,
      Key: `data/products/${file}`,
      Body: body,
      ContentType: "application/json",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

async function main() {
  const files = fs
    .readdirSync(PRODUCTS_DIR)
    .filter((file) => file.endsWith(".json"));

  console.log(`Uploading ${files.length} product JSON files to R2...`);
  console.log(`Concurrency: ${CONCURRENCY}`);

  let completed = 0;
  let failed = 0;
  let index = 0;

  async function worker() {
    while (index < files.length) {
      const file = files[index++];

      try {
        await uploadFile(file);
      } catch (error) {
        failed++;
        console.error(`Failed: ${file} - ${error.message}`);
      }

      completed++;

      if (completed % 100 === 0 || completed === files.length) {
        console.log(`${completed}/${files.length} uploaded | failed: ${failed}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker())
  );

  console.log("Done.");
  console.log(`Uploaded: ${completed - failed}`);
  console.log(`Failed: ${failed}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});