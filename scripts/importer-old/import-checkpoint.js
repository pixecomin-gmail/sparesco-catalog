const fs = require("fs");
const path = require("path");

const CHECKPOINT_FILE = ".import-checkpoint.json";

function getCheckpointPath(collectionFolder) {
  return path.join(collectionFolder, CHECKPOINT_FILE);
}

function loadCheckpoint(collectionFolder, collectionHandle) {
  const filePath = getCheckpointPath(collectionFolder);

  if (!fs.existsSync(filePath)) {
    return {
      version: 1,
      collectionHandle,
      completedHandles: [],
      failedHandles: [],
      updatedAt: null,
    };
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (parsed.collectionHandle !== collectionHandle) {
    throw new Error(`Checkpoint belongs to ${parsed.collectionHandle}, not ${collectionHandle}`);
  }

  return {
    version: 1,
    collectionHandle,
    completedHandles: Array.isArray(parsed.completedHandles)
      ? parsed.completedHandles
      : [],
    failedHandles: Array.isArray(parsed.failedHandles)
      ? parsed.failedHandles
      : [],
    updatedAt: parsed.updatedAt || null,
  };
}

function saveCheckpoint(collectionFolder, checkpoint) {
  const filePath = getCheckpointPath(collectionFolder);
  const temporaryPath = `${filePath}.tmp`;
  const payload = {
    ...checkpoint,
    completedHandles: [...new Set(checkpoint.completedHandles || [])],
    failedHandles: [...new Set(checkpoint.failedHandles || [])],
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(temporaryPath, JSON.stringify(payload, null, 2));
  fs.renameSync(temporaryPath, filePath);
}

function clearCheckpoint(collectionFolder) {
  const filePath = getCheckpointPath(collectionFolder);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

module.exports = {
  loadCheckpoint,
  saveCheckpoint,
  clearCheckpoint,
};
