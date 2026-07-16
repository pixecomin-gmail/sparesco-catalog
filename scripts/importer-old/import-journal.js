const { readJson, uploadJson, remove } = require("./r2-client");
const { slugify } = require("./utils");

function journalKey(collectionHandle) {
  return `catalog/import-journal/${slugify(collectionHandle)}.json`;
}

async function loadJournal(collectionHandle) {
  try {
    const data = await readJson(journalKey(collectionHandle));

    return {
      version: 1,
      collectionHandle: slugify(collectionHandle),
      uploadedHandles: Array.isArray(data?.uploadedHandles)
        ? data.uploadedHandles.map(slugify).filter(Boolean)
        : [],
      publishedHandles: Array.isArray(data?.publishedHandles)
        ? data.publishedHandles.map(slugify).filter(Boolean)
        : [],
      updatedAt: data?.updatedAt || null,
    };
  } catch {
    return {
      version: 1,
      collectionHandle: slugify(collectionHandle),
      uploadedHandles: [],
      publishedHandles: [],
      updatedAt: null,
    };
  }
}

async function saveJournal(collectionHandle, journal) {
  const payload = {
    version: 1,
    collectionHandle: slugify(collectionHandle),
    uploadedHandles: [
      ...new Set((journal.uploadedHandles || []).map(slugify).filter(Boolean)),
    ],
    publishedHandles: [
      ...new Set((journal.publishedHandles || []).map(slugify).filter(Boolean)),
    ],
    updatedAt: new Date().toISOString(),
  };

  await uploadJson(journalKey(collectionHandle), payload);
  return payload;
}

async function clearJournal(collectionHandle) {
  try {
    await remove(journalKey(collectionHandle));
  } catch {
    // Missing journals are harmless.
  }
}

module.exports = {
  loadJournal,
  saveJournal,
  clearJournal,
};
