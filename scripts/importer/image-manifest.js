const {
  imageManifestKey,
  slugify,
} = require("./utils");

const {
  safeReadJson,
  uploadJson,
  listKeys,
} = require("./r2-client");

async function loadManifest(collectionHandle) {
  const handle = slugify(collectionHandle);

  const saved = await safeReadJson(
    imageManifestKey(handle),
    null
  );

  if (
    saved &&
    Array.isArray(saved.keys)
  ) {
    return {
      handle,
      keys: new Set(saved.keys),
      changed: false,
      bootstrapped: false,
    };
  }

  /*
   * First run only:
   * If no manifest exists, list the collection prefix once
   * and save it. Future runs use the manifest and avoid R2 scans.
   */
  const keys = await listKeys(
    `catalog/images/${handle}/`
  );

  const manifest = {
    handle,
    keys: new Set(keys),
    changed: true,
    bootstrapped: true,
  };

  await saveManifest(manifest);

  return manifest;
}

async function saveManifest(manifest) {
  await uploadJson(
    imageManifestKey(manifest.handle),
    {
      version: 1,
      collectionHandle: manifest.handle,
      keys: Array.from(manifest.keys).sort(),
      updatedAt: new Date().toISOString(),
    }
  );

  manifest.changed = false;
}

async function loadManifests(
  collectionHandles,
  onProgress
) {
  const map = new Map();

  for (
    let index = 0;
    index < collectionHandles.length;
    index++
  ) {
    const handle = slugify(
      collectionHandles[index]
    );

    const manifest = await loadManifest(handle);
    map.set(handle, manifest);

    if (onProgress) {
      onProgress(index + 1, collectionHandles.length);
    }
  }

  return map;
}

async function saveChangedManifests(manifests) {
  const changed = Array.from(
    manifests.values()
  ).filter((manifest) => manifest.changed);

  for (const manifest of changed) {
    await saveManifest(manifest);
  }

  return changed.length;
}

module.exports = {
  loadManifest,
  saveManifest,
  loadManifests,
  saveChangedManifests,
};
