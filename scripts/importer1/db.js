const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");
const config = require("./config");

function openDb() {
  if (!fs.existsSync(config.STATE_DIR)) {
    fs.mkdirSync(config.STATE_DIR, { recursive: true });
  }

  const db = new DatabaseSync(config.DB_PATH);

  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec("PRAGMA temp_store = MEMORY");

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      handle TEXT PRIMARY KEY,
      canonical_key TEXT NOT NULL,
      product_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      attempts INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      uploaded_at TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collections (
      handle TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      excel_files INTEGER NOT NULL,
      row_count INTEGER NOT NULL,
      product_count INTEGER NOT NULL,
      prepared_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS failed_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      handle TEXT NOT NULL,
      image_url TEXT,
      reason TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_status
      ON products(status);

    CREATE INDEX IF NOT EXISTS idx_products_canonical
      ON products(canonical_key);
  `);

  db.transaction = function transaction(callback) {
    return (...args) => {
      db.exec("BEGIN IMMEDIATE");

      try {
        const result = callback(...args);
        db.exec("COMMIT");
        return result;
      } catch (error) {
        try {
          db.exec("ROLLBACK");
        } catch {}

        throw error;
      }
    };
  };

  return db;
}

module.exports = { openDb };
