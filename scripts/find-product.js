const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");
require("dotenv").config({ path: ".env.local" });

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

(async () => {
  const res = await client.send(
    new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET,
      Prefix: "catalog/products/",
    })
  );

  const matches = (res.Contents || []).filter((o) =>
    o.Key.includes("as02501")
  );

  console.log(matches);
})();