const fs = require("fs");
const path = require("path");
const config = require("./config");

function ensureStateDir() {
  if (!fs.existsSync(config.STATE_DIR)) {
    fs.mkdirSync(config.STATE_DIR, { recursive: true });
  }
}

function checkpointPath() {
  ensureStateDir();
  return path.join(config.STATE_DIR, "bulk-import-checkpoint.json");
}

function loadCheckpoint() {
  const file = checkpointPath();
  if (!fs.existsSync(file)) {
    return { version: 1, completedHandles: [], updatedAt: null };
  }

  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  return {
    version: 1,
    completedHandles: Array.isArray(parsed.completedHandles)
      ? parsed.completedHandles
      : [],
    updatedAt: parsed.updatedAt || null,
  };
}

function saveCheckpoint(checkpoint) {
  const file = checkpointPath();
  const temp = `${file}.tmp`;
  const payload = {
    version: 1,
    completedHandles: [...new Set(checkpoint.completedHandles || [])],
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(temp, JSON.stringify(payload, null, 2));
  fs.renameSync(temp, file);
}

function clearCheckpoint() {
  const file = checkpointPath();
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

module.exports = { loadCheckpoint, saveCheckpoint, clearCheckpoint };
