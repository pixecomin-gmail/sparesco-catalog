const path = require("path");
const sharp = require("sharp");

const config = require("./config");
const { openDb } = require("./db");
const { uploadBuffer } = require("./r2-client");
const { slugify, sleep } = require("./utils");
const { heading, bar } = require("./progress");

const THUMB_WIDTH = Number(
  process.env.THUMBNAIL_WIDTH || 320
);

const THUMB_HEIGHT = Number(
  process.env.THUMBNAIL_HEIGHT || 320
);

const THUMB_QUALITY = Number(
  process.env.THUMBNAIL_QUALITY || 76
);

const CONCURRENCY = Math.max(
  1,
  Number(process.env.THUMBNAIL_CONCURRENCY || 8)
);

const PUBLIC_R2_BASE = String(
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL || ""
).replace(/\/$/, "");

function ensureThumbnailTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS thumbnail_jobs (
      source_key TEXT PRIMARY KEY,
      thumbnail_key TEXT NOT NULL,
      collection_handle TEXT NOT NULL,
      source_filename TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      completed_at TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_thumbnail_jobs_status
      ON thumbnail_jobs(status);
  `);
}

function thumbnailFilename(sourceFilename) {
  const parsed = path.posix.parse(
    String(sourceFilename || "").replace(/\\/g, "/")
  );

  return `${parsed.name}.webp`;
}

function getSourceKey(product) {
  const collectionHandle = slugify(
    product.imageFolder || product.collection
  );

  const sourceFilename =
    Array.isArray(product.images) &&
    product.images.length
      ? String(product.images[0] || "").trim()
      : "";

  if (
    !collectionHandle ||
    !sourceFilename ||
    sourceFilename.startsWith("http")
  ) {
    return null;
  }

  return {
    collectionHandle,
    sourceFilename,
    sourceKey:
      `catalog/images/${collectionHandle}/${sourceFilename}`,
    thumbnailKey:
      `catalog/thumbs/${collectionHandle}/` +
      thumbnailFilename(sourceFilename),
  };
}

async function mapLimit(
  items,
  concurrency,
  worker
) {
  let cursor = 0;

  async function run() {
    while (true) {
      const index = cursor++;

      if (index >= items.length) {
        return;
      }

      await worker(items[index], index);
    }
  }

  await Promise.all(
    Array.from(
      {
        length: Math.min(
          concurrency,
          items.length
        ),
      },
      () => run()
    )
  );
}

async function fetchOriginal(sourceKey) {
  if (!PUBLIC_R2_BASE) {
    throw new Error(
      "Missing NEXT_PUBLIC_R2_PUBLIC_URL"
    );
  }

  const url =
    `${PUBLIC_R2_BASE}/${sourceKey}`;

  let lastError;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(45000),
      });

      if (response.status === 404) {
        throw new Error(
          `Original R2 image not found: ${sourceKey}`
        );
      }

      if (!response.ok) {
        throw new Error(
          `Original R2 image request failed ${response.status}`
        );
      }

      return Buffer.from(
        await response.arrayBuffer()
      );
    } catch (error) {
      lastError = error;

      const message =
        error?.message || String(error);

      const permanent =
        message.includes("not found");

      if (
        permanent ||
        attempt === 5
      ) {
        break;
      }

      await sleep(
        Math.min(
          10000,
          attempt * 1500
        )
      );
    }
  }

  throw lastError;
}

async function makeThumbnail(buffer) {
  return sharp(buffer, {
    failOn: "none",
    limitInputPixels: false,
  })
    .rotate()
    .resize({
      width: THUMB_WIDTH,
      height: THUMB_HEIGHT,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: THUMB_QUALITY,
      effort: 4,
    })
    .toBuffer();
}

async function main() {
  heading("BUILD THUMBNAILS ONLY");

  if (!PUBLIC_R2_BASE) {
    throw new Error(
      "Missing NEXT_PUBLIC_R2_PUBLIC_URL"
    );
  }

  const db = openDb();

  ensureThumbnailTables(db);

  db.prepare(`
    UPDATE thumbnail_jobs
    SET status = 'pending'
    WHERE status = 'processing'
  `).run();

  const upsertJob = db.prepare(`
    INSERT INTO thumbnail_jobs (
      source_key,
      thumbnail_key,
      collection_handle,
      source_filename,
      status,
      attempts,
      last_error,
      completed_at,
      updated_at
    )
    VALUES (
      @source_key,
      @thumbnail_key,
      @collection_handle,
      @source_filename,
      'pending',
      0,
      NULL,
      NULL,
      @updated_at
    )
    ON CONFLICT(source_key) DO NOTHING
  `);

  const rows = db.prepare(`
    SELECT product_json
    FROM products
    WHERE status = 'completed'
    ORDER BY handle
  `).all();

  let discovered = 0;
  let skippedNoImage = 0;

  const insertJobs = db.transaction(
    (products) => {
      const now =
        new Date().toISOString();

      for (const row of products) {
        const product =
          JSON.parse(row.product_json);

        const job =
          getSourceKey(product);

        if (!job) {
          skippedNoImage++;
          continue;
        }

        const result =
          upsertJob.run({
            source_key:
              job.sourceKey,
            thumbnail_key:
              job.thumbnailKey,
            collection_handle:
              job.collectionHandle,
            source_filename:
              job.sourceFilename,
            updated_at:
              now,
          });

        discovered += Number(
          result.changes || 0
        );
      }
    }
  );

  insertJobs(rows);

  const pending = db.prepare(`
    SELECT
      source_key,
      thumbnail_key,
      collection_handle,
      source_filename,
      attempts
    FROM thumbnail_jobs
    WHERE status = 'pending'
    ORDER BY source_key
  `).all();

  const totalJobs = Number(
    db.prepare(`
      SELECT COUNT(*) AS count
      FROM thumbnail_jobs
    `).get().count || 0
  );

  const completedBefore = Number(
    db.prepare(`
      SELECT COUNT(*) AS count
      FROM thumbnail_jobs
      WHERE status = 'completed'
    `).get().count || 0
  );

  console.log(
    `Products checked: ${rows.length}`
  );
  console.log(
    `Unique thumbnail jobs: ${totalJobs}`
  );
  console.log(
    `New jobs added: ${discovered}`
  );
  console.log(
    `Already completed: ${completedBefore}`
  );
  console.log(
    `Pending now: ${pending.length}`
  );
  console.log(
    `Products with no usable first image: ${skippedNoImage}`
  );
  console.log(
    `Concurrency: ${CONCURRENCY}`
  );

  if (!pending.length) {
    console.log("");
    console.log(
      "No pending thumbnails."
    );

    db.close();
    return;
  }

  const markProcessing = db.prepare(`
    UPDATE thumbnail_jobs
    SET
      status = 'processing',
      attempts = attempts + 1,
      last_error = NULL,
      updated_at = ?
    WHERE source_key = ?
  `);

  const markCompleted = db.prepare(`
    UPDATE thumbnail_jobs
    SET
      status = 'completed',
      last_error = NULL,
      completed_at = ?,
      updated_at = ?
    WHERE source_key = ?
  `);

  const markPending = db.prepare(`
    UPDATE thumbnail_jobs
    SET
      status = 'pending',
      last_error = ?,
      updated_at = ?
    WHERE source_key = ?
  `);

  const markFailed = db.prepare(`
    UPDATE thumbnail_jobs
    SET
      status = 'failed',
      last_error = ?,
      updated_at = ?
    WHERE source_key = ?
  `);

  let completed = 0;
  let failed = 0;
  let stopping = false;

  process.on("SIGINT", () => {
    stopping = true;

    console.log(
      "\nStopping safely after active thumbnails finish..."
    );
  });

  await mapLimit(
    pending,
    CONCURRENCY,
    async (job) => {
      if (stopping) {
        return;
      }

      markProcessing.run(
        new Date().toISOString(),
        job.source_key
      );

      try {
        const original =
          await fetchOriginal(
            job.source_key
          );

        const thumbnail =
          await makeThumbnail(
            original
          );

        await uploadBuffer(
          job.thumbnail_key,
          thumbnail,
          "image/webp"
        );

        const now =
          new Date().toISOString();

        markCompleted.run(
          now,
          now,
          job.source_key
        );

        completed++;
      } catch (error) {
        const attempts =
          Number(job.attempts || 0) + 1;

        const message =
          error?.message ||
          String(error);

        if (attempts < 3) {
          markPending.run(
            message,
            new Date().toISOString(),
            job.source_key
          );
        } else {
          markFailed.run(
            message,
            new Date().toISOString(),
            job.source_key
          );

          failed++;
        }
      }

      bar(
        "Thumbnails",
        completed + failed,
        pending.length,
        `completed ${completed}, failed ${failed}`
      );
    }
  );

  db.prepare(`
    UPDATE thumbnail_jobs
    SET status = 'pending'
    WHERE status = 'processing'
  `).run();

  const finalStats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(
        CASE WHEN status = 'completed'
        THEN 1 ELSE 0 END
      ) AS completed,
      SUM(
        CASE WHEN status = 'pending'
        THEN 1 ELSE 0 END
      ) AS pending,
      SUM(
        CASE WHEN status = 'failed'
        THEN 1 ELSE 0 END
      ) AS failed
    FROM thumbnail_jobs
  `).get();

  console.log("");
  console.log(
    `Total thumbnail jobs: ${finalStats.total}`
  );
  console.log(
    `Completed: ${finalStats.completed}`
  );
  console.log(
    `Pending: ${finalStats.pending}`
  );
  console.log(
    `Failed: ${finalStats.failed}`
  );
  console.log("");
  console.log(
    "Original R2 images were not changed."
  );

  db.close();
}

main().catch((error) => {
  console.error("");
  console.error(
    "THUMBNAIL BUILD FAILED"
  );
  console.error(error);
  process.exit(1);
});
