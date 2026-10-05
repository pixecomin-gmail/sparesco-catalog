import {
  syncExistingProduct,
  type R2BucketLike,
} from "@/lib/admin/product-sync";

import {
  normalizeAdminProduct,
  productKeys,
  validateAdminProduct,
} from "@/lib/admin/product-normalize";

export type AdminCollection = {
  title: string;
  handle: string;
  count: number;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

export function collectionHandle(
  value: unknown
) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function readJson(
  bucket: R2BucketLike,
  key: string
): Promise<any | null> {
  const object =
    await bucket.get(key);

  if (!object) {
    return null;
  }

  return JSON.parse(
    await object.text()
  );
}

async function writeJson(
  bucket: R2BucketLike,
  key: string,
  data: unknown
) {
  await bucket.put(
    key,
    JSON.stringify(data),
    {
      httpMetadata: {
        contentType:
          "application/json",

        cacheControl:
          "public, max-age=300",
      },
    }
  );
}

export async function createCollection(
  bucket: R2BucketLike,
  input: {
    title?: unknown;
    handle?: unknown;
    description?: unknown;
    seoTitle?: unknown;
    seoDescription?: unknown;
  }
) {
  const title =
    clean(input.title);

  if (!title) {
    throw new Error(
      "Collection title is required."
    );
  }

  const handle =
    collectionHandle(
      input.handle || title
    );

  if (!handle) {
    throw new Error(
      "Collection handle is required."
    );
  }

  const collectionsKey =
    "catalog/indexes/collections.json";

  const categoryMetaKey =
    "catalog/indexes/category-meta.json";

  const filterIndexKey =
    "catalog/indexes/filter-index.json";

  const statsKey =
    "catalog/indexes/stats.json";

  const detailsKey =
    "catalog/indexes/collection-details.json";

  const [
    collectionsRaw,
    categoryMetaRaw,
    filterIndexRaw,
    statsRaw,
    detailsRaw,
  ] = await Promise.all([
    readJson(
      bucket,
      collectionsKey
    ),
    readJson(
      bucket,
      categoryMetaKey
    ),
    readJson(
      bucket,
      filterIndexKey
    ),
    readJson(
      bucket,
      statsKey
    ),
    readJson(
      bucket,
      detailsKey
    ),
  ]);

  const collections =
    Array.isArray(collectionsRaw)
      ? [...collectionsRaw]
      : [];

  const alreadyExists =
    collections.some(
      (item: any) =>
        collectionHandle(
          item?.handle
        ) === handle
    );

  if (alreadyExists) {
    throw new Error(
      `Collection "${handle}" already exists.`
    );
  }

  const categoryMeta =
    categoryMetaRaw &&
    typeof categoryMetaRaw ===
      "object"
      ? {
          ...categoryMetaRaw,
        }
      : {};

  const filterIndex =
    filterIndexRaw &&
    typeof filterIndexRaw ===
      "object"
      ? {
          ...filterIndexRaw,
        }
      : {};

  const stats =
    statsRaw &&
    typeof statsRaw === "object"
      ? {
          ...statsRaw,
        }
      : {};

  const details =
    detailsRaw &&
    typeof detailsRaw === "object"
      ? {
          ...detailsRaw,
        }
      : {};

  const collection = {
    title,
    handle,
    count: 0,
  };

  collections.push(
    collection
  );

  collections.sort(
    (a: any, b: any) =>
      String(
        a?.title || ""
      ).localeCompare(
        String(
          b?.title || ""
        )
      )
  );

  categoryMeta[handle] = {
    totalProducts: 0,
    pageSize: 24,
    totalPages: 0,
  };

  details[handle] = {
    title,
    handle,

    description:
      clean(
        input.description
      ),

    seoTitle:
      clean(input.seoTitle),

    seoDescription:
      clean(
        input.seoDescription
      ),

    createdAt:
      new Date()
        .toISOString(),

    updatedAt:
      new Date()
        .toISOString(),
  };

  await Promise.all([
    writeJson(
      bucket,
      collectionsKey,
      collections
    ),

    writeJson(
      bucket,
      categoryMetaKey,
      categoryMeta
    ),

    writeJson(
      bucket,
      filterIndexKey,
      {
        ...filterIndex,

        categories:
          collections,
      }
    ),

    writeJson(
      bucket,
      statsKey,
      {
        ...stats,

        collections:
          collections.length,
      }
    ),

    writeJson(
      bucket,
      detailsKey,
      details
    ),
  ]);

  return {
    collection: {
      ...collection,
      ...details[handle],
    },

    updatedFiles: [
      collectionsKey,
      categoryMetaKey,
      filterIndexKey,
      statsKey,
      detailsKey,
    ],
  };
}

export async function getCollection(
  bucket: R2BucketLike,
  rawHandle: string
) {
  const handle =
    collectionHandle(rawHandle);

  if (!handle) {
    throw new Error(
      "Collection handle is required."
    );
  }

  const [
    collectionsRaw,
    categoryMetaRaw,
    detailsRaw,
  ] = await Promise.all([
    readJson(
      bucket,
      "catalog/indexes/collections.json"
    ),

    readJson(
      bucket,
      "catalog/indexes/category-meta.json"
    ),

    readJson(
      bucket,
      "catalog/indexes/collection-details.json"
    ),
  ]);

  const collections =
    Array.isArray(collectionsRaw)
      ? collectionsRaw
      : [];

  const collection =
    collections.find(
      (item: any) =>
        collectionHandle(
          item?.handle
        ) === handle
    );

  if (!collection) {
    return null;
  }

  const categoryMeta =
    categoryMetaRaw &&
    typeof categoryMetaRaw === "object"
      ? categoryMetaRaw
      : {};

  const details =
    detailsRaw &&
    typeof detailsRaw === "object"
      ? detailsRaw
      : {};

  const detail =
    details?.[handle] &&
    typeof details[handle] ===
      "object"
      ? details[handle]
      : {};

  const meta =
    categoryMeta?.[handle] &&
    typeof categoryMeta[handle] ===
      "object"
      ? categoryMeta[handle]
      : {};

  return {
    title:
      clean(
        detail?.title
      ) ||
      clean(
        collection?.title
      ) ||
      handle,

    handle,

    count:
      Number(
        collection?.count ??
          meta?.totalProducts ??
          0
      ),

    description:
      clean(
        detail?.description
      ),

    seoTitle:
      clean(
        detail?.seoTitle
      ),

    seoDescription:
      clean(
        detail?.seoDescription
      ),

    createdAt:
      clean(
        detail?.createdAt
      ),

    updatedAt:
      clean(
        detail?.updatedAt
      ),

    pageSize:
      Number(
        meta?.pageSize || 24
      ),

    totalPages:
      Number(
        meta?.totalPages || 0
      ),
  };
}

export async function getCollectionProducts(
  bucket: R2BucketLike,
  rawHandle: string
) {
  const handle =
    collectionHandle(rawHandle);

  if (!handle) {
    throw new Error(
      "Collection handle is required."
    );
  }

  const categoryMeta =
    (await readJson(
      bucket,
      "catalog/indexes/category-meta.json"
    )) || {};

  const meta =
    categoryMeta?.[handle];

  if (!meta) {
    return [];
  }

  const totalPages =
    Number(
      meta?.totalPages || 0
    );

  if (!totalPages) {
    return [];
  }

  const pages =
    await Promise.all(
      Array.from(
        {
          length:
            totalPages,
        },
        (_, index) => {
          const page =
            String(
              index + 1
            ).padStart(
              4,
              "0"
            );

          return readJson(
            bucket,
            `catalog/indexes/category-pages/${handle}/${page}.json`
          );
        }
      )
    );

  return pages
    .flatMap((page) =>
      Array.isArray(page)
        ? page
        : []
    )
    .filter(Boolean);
}

async function findProductObject(
  bucket: R2BucketLike,
  rawHandle: string
) {
  const handle =
    clean(rawHandle)
      .toLowerCase();

  if (!handle) {
    return null;
  }

  const keys =
    productKeys(handle);

  for (const key of keys) {
    const object =
      await bucket.get(key);

    if (object) {
      return {
        handle,
        key,
        object,
      };
    }
  }

  return null;
}

function normalizeTag(
  value: unknown
) {
  return clean(value)
    .toLowerCase();
}

function productTags(
  product: any
) {
  const raw =
    product?.tags;

  if (Array.isArray(raw)) {
    return raw
      .map((tag) =>
        clean(tag)
      )
      .filter(Boolean);
  }

  if (
    typeof raw === "string"
  ) {
    return raw
      .split(",")
      .map((tag) =>
        tag.trim()
      )
      .filter(Boolean);
  }

  return [];
}

async function saveProductTags(
  bucket: R2BucketLike,
  rawProductHandle: string,
  nextTags: string[]
) {
  const found =
    await findProductObject(
      bucket,
      rawProductHandle
    );

  if (!found) {
    throw new Error(
      `Product "${rawProductHandle}" not found.`
    );
  }

  const existing =
    JSON.parse(
      await found.object.text()
    );

  const merged = {
    ...existing,

    tags:
      nextTags,
  };

  const product =
    normalizeAdminProduct(
      merged,
      {
        existing,
      }
    );

  /*
   * Product identity must remain
   * unchanged when collection
   * membership changes.
   */
  product.handle =
    found.handle;

  product.canonicalKey =
    existing.canonicalKey ||
    found.handle;

  product.sources =
    existing.sources ||
    product.sources ||
    [];

  const validationError =
    validateAdminProduct(
      product
    );

  if (validationError) {
    throw new Error(
      validationError
    );
  }

  /*
   * Same safe ordering used by the
   * existing Admin Product PUT route:
   *
   * 1. synchronize indexes
   * 2. only then replace master JSON
   */
  const syncResult =
    await syncExistingProduct(
      bucket,
      existing,
      product
    );

  await bucket.put(
    found.key,
    JSON.stringify(product),
    {
      httpMetadata: {
        contentType:
          "application/json",

        cacheControl:
          "public, max-age=300",
      },
    }
  );

  return {
    product,
    synchronizedFiles:
      syncResult.updatedFiles,
  };
}

export async function addProductToCollection(
  bucket: R2BucketLike,
  rawCollectionHandle: string,
  rawProductHandle: string
) {
  const collection =
    collectionHandle(
      rawCollectionHandle
    );

  if (!collection) {
    throw new Error(
      "Collection handle is required."
    );
  }

  const found =
    await findProductObject(
      bucket,
      rawProductHandle
    );

  if (!found) {
    throw new Error(
      `Product "${rawProductHandle}" not found.`
    );
  }

  const existing =
    JSON.parse(
      await found.object.text()
    );

  const tags =
    productTags(existing);

  const alreadyExists =
    tags.some(
      (tag) =>
        normalizeTag(tag) ===
        normalizeTag(collection)
    );

  if (alreadyExists) {
    return {
      changed: false,
      message:
        "Product is already in this collection.",
    };
  }

  const result =
    await saveProductTags(
      bucket,
      found.handle,
      [
        ...tags,
        collection,
      ]
    );

  return {
    changed: true,

    message:
      "Product added to collection.",

    ...result,
  };
}

export async function removeProductFromCollection(
  bucket: R2BucketLike,
  rawCollectionHandle: string,
  rawProductHandle: string
) {
  const collection =
    collectionHandle(
      rawCollectionHandle
    );

  if (!collection) {
    throw new Error(
      "Collection handle is required."
    );
  }

  const found =
    await findProductObject(
      bucket,
      rawProductHandle
    );

  if (!found) {
    throw new Error(
      `Product "${rawProductHandle}" not found.`
    );
  }

  const existing =
    JSON.parse(
      await found.object.text()
    );

  const tags =
    productTags(existing);

  const nextTags =
    tags.filter(
      (tag) =>
        normalizeTag(tag) !==
        normalizeTag(collection)
    );

  if (
    nextTags.length ===
    tags.length
  ) {
    return {
      changed: false,
      message:
        "Product is not in this collection.",
    };
  }

  /*
   * The current Sparesco product
   * synchronization model requires
   * products to retain at least one
   * collection/tag.
   *
   * Do not silently invent an
   * "Uncategorized" collection.
   */
  if (
    nextTags.length === 0
  ) {
    throw new Error(
      "This is the product's only collection. Add it to another collection before removing it from this one."
    );
  }

  const result =
    await saveProductTags(
      bucket,
      found.handle,
      nextTags
    );

  return {
    changed: true,

    message:
      "Product removed from collection.",

    ...result,
  };
}

export async function updateCollectionDetails(
  bucket: R2BucketLike,
  rawHandle: string,
  input: {
    title?: unknown;
    description?: unknown;
    seoTitle?: unknown;
    seoDescription?: unknown;
  }
) {
  const handle =
    collectionHandle(
      rawHandle
    );

  if (!handle) {
    throw new Error(
      "Collection handle is required."
    );
  }

  const title =
    clean(input.title);

  if (!title) {
    throw new Error(
      "Collection title is required."
    );
  }

  const collectionsKey =
    "catalog/indexes/collections.json";

  const detailsKey =
    "catalog/indexes/collection-details.json";

  const [
    collectionsRaw,
    detailsRaw,
  ] = await Promise.all([
    readJson(
      bucket,
      collectionsKey
    ),

    readJson(
      bucket,
      detailsKey
    ),
  ]);

  const collections =
    Array.isArray(
      collectionsRaw
    )
      ? [...collectionsRaw]
      : [];

  const index =
    collections.findIndex(
      (item: any) =>
        collectionHandle(
          item?.handle
        ) === handle
    );

  if (index < 0) {
    throw new Error(
      "Collection not found."
    );
  }

  const existingCollection =
    collections[index];

  /*
   * Preserve the handle and product
   * count. This operation edits only
   * collection metadata.
   */
  collections[index] = {
    ...existingCollection,
    title,
    handle,
    count:
      Number(
        existingCollection?.count ||
          0
      ),
  };

  collections.sort(
    (a: any, b: any) =>
      String(
        a?.title || ""
      ).localeCompare(
        String(
          b?.title || ""
        )
      )
  );

  const details =
    detailsRaw &&
    typeof detailsRaw ===
      "object"
      ? {
          ...detailsRaw,
        }
      : {};

  const existingDetails =
    details?.[handle] &&
    typeof details[handle] ===
      "object"
      ? details[handle]
      : {};

  details[handle] = {
    ...existingDetails,

    title,
    handle,

    description:
      clean(
        input.description
      ),

    seoTitle:
      clean(
        input.seoTitle
      ),

    seoDescription:
      clean(
        input.seoDescription
      ),

    createdAt:
      clean(
        existingDetails
          ?.createdAt
      ) ||
      new Date()
        .toISOString(),

    updatedAt:
      new Date()
        .toISOString(),
  };

  await Promise.all([
    writeJson(
      bucket,
      collectionsKey,
      collections
    ),

    writeJson(
      bucket,
      detailsKey,
      details
    ),
  ]);

  return {
    collection: {
      ...collections[index],
      ...details[handle],
    },

    updatedFiles: [
      collectionsKey,
      detailsKey,
    ],
  };
}

export async function migrateCollectionProduct(
  bucket: R2BucketLike,
  rawOldHandle: string,
  rawNewHandle: string,
  rawProductHandle: string
) {
  const oldHandle =
    collectionHandle(
      rawOldHandle
    );

  const newHandle =
    collectionHandle(
      rawNewHandle
    );

  const productHandle =
    clean(
      rawProductHandle
    ).toLowerCase();

  if (
    !oldHandle ||
    !newHandle
  ) {
    throw new Error(
      "Old and new collection handles are required."
    );
  }

  if (!productHandle) {
    throw new Error(
      "Product handle is required."
    );
  }

  if (
    oldHandle ===
    newHandle
  ) {
    return {
      changed: false,
      message:
        "Collection handle has not changed.",
    };
  }

  const found =
    await findProductObject(
      bucket,
      productHandle
    );

  if (!found) {
    throw new Error(
      `Product "${productHandle}" not found.`
    );
  }

  const existing =
    JSON.parse(
      await found.object.text()
    );

  const tags =
    productTags(
      existing
    );

  const hasOldHandle =
    tags.some(
      (tag) =>
        normalizeTag(tag) ===
        oldHandle
    );

  if (!hasOldHandle) {
    return {
      changed: false,
      message:
        "Product is no longer in the old collection.",
    };
  }

  /*
   * Replace the old collection rather
   * than removing it first.
   *
   * This guarantees the product always
   * retains at least one collection/tag
   * during migration.
   */
  const nextTags =
    Array.from(
      new Set(
        tags
          .map((tag) =>
            normalizeTag(tag) ===
            oldHandle
              ? newHandle
              : tag
          )
          .filter(Boolean)
      )
    );

  const result =
    await saveProductTags(
      bucket,
      productHandle,
      nextTags
    );

  return {
    changed: true,

    message:
      "Product collection handle migrated.",

    ...result,
  };
}

export async function prepareCollectionMigration(
  bucket: R2BucketLike,
  rawOldHandle: string,
  rawNewHandle: string
) {
  const oldHandle =
    collectionHandle(
      rawOldHandle
    );

  const newHandle =
    collectionHandle(
      rawNewHandle
    );

  if (
    !oldHandle ||
    !newHandle
  ) {
    throw new Error(
      "Old and new collection handles are required."
    );
  }

  if (
    oldHandle ===
    newHandle
  ) {
    throw new Error(
      "New collection handle must be different."
    );
  }

  const existingOld =
    await getCollection(
      bucket,
      oldHandle
    );

  if (!existingOld) {
    throw new Error(
      "Collection not found."
    );
  }

  const existingNew =
    await getCollection(
      bucket,
      newHandle
    );

  if (existingNew) {
    throw new Error(
      `Collection "${newHandle}" already exists.`
    );
  }

  const products =
    await getCollectionProducts(
      bucket,
      oldHandle
    );

  /*
   * Create the destination collection
   * before moving products into it.
   *
   * Preserve the collection's current
   * title, description and SEO fields.
   */
  await createCollection(
    bucket,
    {
      title:
        existingOld.title,

      handle:
        newHandle,

      description:
        existingOld.description,

      seoTitle:
        existingOld.seoTitle,

      seoDescription:
        existingOld.seoDescription,
    }
  );

  const productHandles =
    Array.from(
      new Set(
        products
          .map((product: any) =>
            clean(
              product?.handle ??
                product?.h
            ).toLowerCase()
          )
          .filter(Boolean)
      )
    );

  return {
    success: true,

    oldHandle,
    newHandle,

    totalProducts:
      productHandles.length,

    productHandles,
  };
}

export async function finalizeCollectionMigration(
  bucket: R2BucketLike,
  rawOldHandle: string,
  rawNewHandle: string
) {
  const oldHandle =
    collectionHandle(
      rawOldHandle
    );

  const newHandle =
    collectionHandle(
      rawNewHandle
    );

  if (
    !oldHandle ||
    !newHandle
  ) {
    throw new Error(
      "Old and new collection handles are required."
    );
  }

  if (
    oldHandle ===
    newHandle
  ) {
    throw new Error(
      "Collection handle has not changed."
    );
  }

  const oldCollection =
    await getCollection(
      bucket,
      oldHandle
    );

  const newCollection =
    await getCollection(
      bucket,
      newHandle
    );

  if (!newCollection) {
    throw new Error(
      "Destination collection does not exist."
    );
  }

  /*
   * Do not finalize while the old
   * collection still contains products.
   */
  if (
    oldCollection &&
    Number(
      oldCollection.count || 0
    ) > 0
  ) {
    throw new Error(
      `Migration is incomplete. ${oldCollection.count} product(s) still remain in "${oldHandle}".`
    );
  }

  const collectionsKey =
    "catalog/indexes/collections.json";

  const categoryMetaKey =
    "catalog/indexes/category-meta.json";

  const filterIndexKey =
    "catalog/indexes/filter-index.json";

  const detailsKey =
    "catalog/indexes/collection-details.json";

  const statsKey =
    "catalog/indexes/stats.json";

  const [
    collectionsRaw,
    categoryMetaRaw,
    filterIndexRaw,
    detailsRaw,
    statsRaw,
  ] = await Promise.all([
    readJson(
      bucket,
      collectionsKey
    ),

    readJson(
      bucket,
      categoryMetaKey
    ),

    readJson(
      bucket,
      filterIndexKey
    ),

    readJson(
      bucket,
      detailsKey
    ),

    readJson(
      bucket,
      statsKey
    ),
  ]);

  const collections =
    Array.isArray(
      collectionsRaw
    )
      ? collectionsRaw.filter(
          (item: any) =>
            collectionHandle(
              item?.handle
            ) !== oldHandle
        )
      : [];

  const categoryMeta =
    categoryMetaRaw &&
    typeof categoryMetaRaw ===
      "object"
      ? {
          ...categoryMetaRaw,
        }
      : {};

  const filterIndex =
    filterIndexRaw &&
    typeof filterIndexRaw ===
      "object"
      ? {
          ...filterIndexRaw,
        }
      : {};

  const details =
    detailsRaw &&
    typeof detailsRaw ===
      "object"
      ? {
          ...detailsRaw,
        }
      : {};

  const stats =
    statsRaw &&
    typeof statsRaw ===
      "object"
      ? {
          ...statsRaw,
        }
      : {};

  delete categoryMeta[
    oldHandle
  ];

  delete details[
    oldHandle
  ];

  await Promise.all([
    writeJson(
      bucket,
      collectionsKey,
      collections
    ),

    writeJson(
      bucket,
      categoryMetaKey,
      categoryMeta
    ),

    writeJson(
      bucket,
      filterIndexKey,
      {
        ...filterIndex,
        categories:
          collections,
      }
    ),

    writeJson(
      bucket,
      detailsKey,
      details
    ),

    writeJson(
      bucket,
      statsKey,
      {
        ...stats,
        collections:
          collections.length,
      }
    ),
  ]);

  /*
   * Only create the public redirect
   * after the old collection has been
   * completely migrated and removed.
   */
  const redirectResult =
    await setCollectionRedirect(
      bucket,
      oldHandle,
      newHandle
    );

  return {
    success: true,

    oldHandle,
    newHandle,

    redirect:
      `${oldHandle} -> ${newHandle}`,

    updatedFiles: [
      collectionsKey,
      categoryMetaKey,
      filterIndexKey,
      detailsKey,
      statsKey,
      ...(
        redirectResult.updatedFiles ||
        []
      ),
    ],
  };
}

export async function getCollectionRedirects(
  bucket: R2BucketLike
) {
  const raw =
    await readJson(
      bucket,
      "catalog/indexes/collection-redirects.json"
    );

  if (
    !raw ||
    typeof raw !== "object" ||
    Array.isArray(raw)
  ) {
    return {} as Record<
      string,
      string
    >;
  }

  return raw as Record<
    string,
    string
  >;
}

export async function setCollectionRedirect(
  bucket: R2BucketLike,
  rawOldHandle: string,
  rawNewHandle: string
) {
  const oldHandle =
    collectionHandle(
      rawOldHandle
    );

  const newHandle =
    collectionHandle(
      rawNewHandle
    );

  if (
    !oldHandle ||
    !newHandle
  ) {
    throw new Error(
      "Old and new collection handles are required."
    );
  }

  if (
    oldHandle === newHandle
  ) {
    return {
      changed: false,
      redirects:
        await getCollectionRedirects(
          bucket
        ),
    };
  }

  const redirects =
    await getCollectionRedirects(
      bucket
    );

  /*
   * Flatten existing redirect chains.
   *
   * Example:
   * A -> B
   *
   * then B -> C
   *
   * becomes:
   * A -> C
   * B -> C
   */
  for (
    const [
      source,
      destination,
    ] of Object.entries(
      redirects
    )
  ) {
    if (
      destination ===
      oldHandle
    ) {
      redirects[source] =
        newHandle;
    }
  }

  redirects[oldHandle] =
    newHandle;

  /*
   * A new live handle must never
   * continue redirecting elsewhere.
   */
  delete redirects[
    newHandle
  ];

  const key =
    "catalog/indexes/collection-redirects.json";

  await writeJson(
    bucket,
    key,
    redirects
  );

  return {
    changed: true,
    redirects,
    updatedFiles: [
      key,
    ],
  };
}

export async function deleteCollection(
  bucket: R2BucketLike,
  rawHandle: string
) {
  const handle =
    collectionHandle(rawHandle);

  if (!handle) {
    throw new Error(
      "Collection handle is required."
    );
  }

  if (handle === "uncategorized") {
    throw new Error(
      'The "Uncategorized" collection cannot be deleted.'
    );
  }

  const collection =
    await getCollection(
      bucket,
      handle
    );

  if (!collection) {
    throw new Error(
      "Collection not found."
    );
  }

  /*
   * Make sure Uncategorized exists
   * before touching any products.
   */
  let uncategorized =
    await getCollection(
      bucket,
      "uncategorized"
    );

  if (!uncategorized) {
    await createCollection(
      bucket,
      {
        title:
          "Uncategorized",

        handle:
          "uncategorized",

        description: "",

        seoTitle:
          "Uncategorized",

        seoDescription: "",
      }
    );

    uncategorized =
      await getCollection(
        bucket,
        "uncategorized"
      );
  }

  if (!uncategorized) {
    throw new Error(
      'Unable to create the "Uncategorized" collection.'
    );
  }

  /*
   * Read the products before changing
   * the collection indexes.
   */
  const products =
    await getCollectionProducts(
      bucket,
      handle
    );

  const productHandles =
    Array.from(
      new Set(
        products
          .map((product: any) =>
            clean(
              product?.handle ??
                product?.h
            ).toLowerCase()
          )
          .filter(Boolean)
      )
    );

  let movedToUncategorized = 0;
  let removedFromCollection = 0;

  /*
   * Update every product first.
   *
   * If this was the product's only
   * collection, replace it with
   * Uncategorized.
   *
   * Otherwise just remove the
   * collection being deleted.
   */
  for (
    const productHandle
    of productHandles
  ) {
    const found =
      await findProductObject(
        bucket,
        productHandle
      );

    if (!found) {
      throw new Error(
        `Product "${productHandle}" not found. Collection deletion stopped.`
      );
    }

    const existing =
      JSON.parse(
        await found.object.text()
      );

    const tags =
      productTags(existing);

    const remainingTags =
      tags.filter(
        (tag) =>
          normalizeTag(tag) !==
          handle
      );

    /*
     * Product may already have been
     * synchronized if a previous
     * deletion attempt was interrupted.
     */
    if (
      remainingTags.length ===
      tags.length
    ) {
      continue;
    }

    const nextTags =
      remainingTags.length > 0
        ? remainingTags
        : ["uncategorized"];

    await saveProductTags(
      bucket,
      productHandle,
      nextTags
    );

    if (
      remainingTags.length === 0
    ) {
      movedToUncategorized += 1;
    } else {
      removedFromCollection += 1;
    }
  }

  /*
   * Product synchronization should now
   * have emptied the collection.
   *
   * Verify that before deleting its
   * metadata.
   */
  const remainingCollection =
    await getCollection(
      bucket,
      handle
    );

  if (
    remainingCollection &&
    Number(
      remainingCollection.count || 0
    ) > 0
  ) {
    throw new Error(
      `Collection deletion is incomplete. ${remainingCollection.count} product(s) still remain in "${handle}".`
    );
  }

  const collectionsKey =
    "catalog/indexes/collections.json";

  const categoryMetaKey =
    "catalog/indexes/category-meta.json";

  const filterIndexKey =
    "catalog/indexes/filter-index.json";

  const detailsKey =
    "catalog/indexes/collection-details.json";

  const statsKey =
    "catalog/indexes/stats.json";

  const [
    collectionsRaw,
    categoryMetaRaw,
    filterIndexRaw,
    detailsRaw,
    statsRaw,
  ] = await Promise.all([
    readJson(
      bucket,
      collectionsKey
    ),

    readJson(
      bucket,
      categoryMetaKey
    ),

    readJson(
      bucket,
      filterIndexKey
    ),

    readJson(
      bucket,
      detailsKey
    ),

    readJson(
      bucket,
      statsKey
    ),
  ]);

  const collections =
    Array.isArray(
      collectionsRaw
    )
      ? collectionsRaw.filter(
          (item: any) =>
            collectionHandle(
              item?.handle
            ) !== handle
        )
      : [];

  const categoryMeta =
    categoryMetaRaw &&
    typeof categoryMetaRaw ===
      "object"
      ? {
          ...categoryMetaRaw,
        }
      : {};

  const filterIndex =
    filterIndexRaw &&
    typeof filterIndexRaw ===
      "object"
      ? {
          ...filterIndexRaw,
        }
      : {};

  const details =
    detailsRaw &&
    typeof detailsRaw ===
      "object"
      ? {
          ...detailsRaw,
        }
      : {};

  const stats =
    statsRaw &&
    typeof statsRaw ===
      "object"
      ? {
          ...statsRaw,
        }
      : {};

  delete categoryMeta[
    handle
  ];

  delete details[
    handle
  ];

  await Promise.all([
    writeJson(
      bucket,
      collectionsKey,
      collections
    ),

    writeJson(
      bucket,
      categoryMetaKey,
      categoryMeta
    ),

    writeJson(
      bucket,
      filterIndexKey,
      {
        ...filterIndex,

        categories:
          collections,
      }
    ),

    writeJson(
      bucket,
      detailsKey,
      details
    ),

    writeJson(
      bucket,
      statsKey,
      {
        ...stats,

        collections:
          collections.length,
      }
    ),
  ]);

  /*
   * If this handle previously redirected
   * somewhere, remove that stale redirect
   * because the collection has now been
   * deliberately deleted.
   */
  const redirects =
    await getCollectionRedirects(
      bucket
    );

  if (
    Object.prototype.hasOwnProperty.call(
      redirects,
      handle
    )
  ) {
    delete redirects[
      handle
    ];

    await writeJson(
      bucket,
      "catalog/indexes/collection-redirects.json",
      redirects
    );
  }

  return {
    success: true,

    deletedHandle:
      handle,

    productsProcessed:
      productHandles.length,

    movedToUncategorized,

    removedFromCollection,

    message:
      "Collection deleted. Products were preserved.",
  };
}