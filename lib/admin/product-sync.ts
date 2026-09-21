type R2ObjectLike = {
  text(): Promise<string>;
};

export type R2BucketLike = {
  get(key: string): Promise<R2ObjectLike | null>;

  put(
    key: string,
    value: string,
    options?: {
      httpMetadata?: {
        contentType?: string;
        cacheControl?: string;
      };
    }
  ): Promise<unknown>;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function slugify(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function titleFromHandle(value: unknown) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function compact(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function lowestPrice(variants: any[]) {
  const prices = (variants || [])
    .map((variant) => Number(variant?.price || 0))
    .filter((price) => price > 0);

  return prices.length ? Math.min(...prices) : 0;
}

function prefixOf(value: unknown) {
  const normalized = compact(value);

  return normalized.length >= 2
    ? normalized.slice(0, 2)
    : "";
}

export function summarizeProduct(product: any) {
  const firstVariant = product.variants?.[0] || {};

  return {
    handle: product.handle,
    title: product.title,
    collection: product.collection,

    collectionTitle:
      titleFromHandle(product.collection),

    category: product.category,

    categoryTitle:
      titleFromHandle(product.category),

    imageFolder:
      product.imageFolder ||
      product.collection ||
      "",

    tags: unique(product.tags || [])
      .map(slugify)
      .filter(Boolean),

    image: product.images?.[0] || "",

    partNumber:
      firstVariant.partNumber || "",

    vendor:
      firstVariant.vendor || "",

    variantCount:
      product.variants?.length || 0,

    price:
      lowestPrice(product.variants || []),
  };
}

/*
 * Exact Search V2 structure used by
 * scripts/importer/publish-search-v2.js
 */
function buildSearchV2(product: any) {
  const variants = product.variants || [];
  const firstVariant = variants[0] || {};

  const searchValues = unique([
    product.handle,
    product.title,
    product.collection,
    product.category,
    ...(product.tags || []),

    ...variants.flatMap((variant: any) => [
      variant.title,
      variant.partNumber,
      variant.vendor,
      variant.option1Value,
    ]),
  ]);

  return {
    prefixes: unique(
      searchValues
        .map(prefixOf)
        .filter(Boolean)
    ),

    item: {
      h: product.handle,
      t: product.title,
      c: product.collection,

      ct:
        titleFromHandle(
          product.collection
        ),

      p:
        firstVariant.partNumber || "",

      v:
        firstVariant.vendor || "",

      i:
        product.images?.[0] || "",

      vc:
        variants.length,

      pr:
        lowestPrice(variants),

      x:
        searchValues
          .map(compact)
          .filter(Boolean)
          .join(" "),
    },
  };
}

async function readJson(
  bucket: R2BucketLike,
  key: string
): Promise<any | null> {
  const object = await bucket.get(key);

  if (!object) return null;

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

function replaceProductInArray(
  data: unknown,
  handle: string,
  replacement: any
) {
  if (!Array.isArray(data)) {
    return {
      changed: false,
      data,
    };
  }

  let changed = false;

  const updated =
    data.map((item) => {
      if (
        item &&
        typeof item === "object" &&
        String(
          (item as any).handle || ""
        ).toLowerCase() ===
          handle.toLowerCase()
      ) {
        changed = true;

        return {
          ...(item as any),
          ...replacement,
        };
      }

      return item;
    });

  return {
    changed,
    data: updated,
  };
}

async function updateArrayFile(
  bucket: R2BucketLike,
  key: string,
  handle: string,
  summary: any
) {
  const data =
    await readJson(bucket, key);

  if (!data) return false;

  const result =
    replaceProductInArray(
      data,
      handle,
      summary
    );

  if (!result.changed) {
    return false;
  }

  await writeJson(
    bucket,
    key,
    result.data
  );

  return true;
}

function pageNumber(index: number) {
  return String(index + 1)
    .padStart(4, "0");
}

/*
 * --------------------------------------------------
 * CATALOGUE / COLLECTION / HOMEPAGE
 * --------------------------------------------------
 */
async function syncSummaryFiles(
  bucket: R2BucketLike,
  product: any
) {
  const handle =
    String(product.handle || "")
      .trim()
      .toLowerCase();

  const summary =
    summarizeProduct(product);

  const updatedFiles: string[] = [];

  /*
   * Catalogue pages
   */
  const catalogMeta =
    await readJson(
      bucket,
      "catalog/indexes/catalog-meta.json"
    );

  const catalogTotalPages =
    Number(
      catalogMeta?.totalPages || 0
    );

  for (
    let index = 0;
    index < catalogTotalPages;
    index++
  ) {
    const key =
      `catalog/indexes/catalog-pages/` +
      `${pageNumber(index)}.json`;

    const changed =
      await updateArrayFile(
        bucket,
        key,
        handle,
        summary
      );

    if (changed) {
      updatedFiles.push(key);
      break;
    }
  }

  /*
   * Collection/category pages
   */
  const categoryMeta =
    await readJson(
      bucket,
      "catalog/indexes/category-meta.json"
    );

  for (
    const tag of summary.tags || []
  ) {
    const totalPages =
      Number(
        categoryMeta?.[tag]
          ?.totalPages || 0
      );

    for (
      let index = 0;
      index < totalPages;
      index++
    ) {
      const key =
        `catalog/indexes/category-pages/` +
        `${tag}/` +
        `${pageNumber(index)}.json`;

      const changed =
        await updateArrayFile(
          bucket,
          key,
          handle,
          summary
        );

      if (changed) {
        updatedFiles.push(key);
        break;
      }
    }
  }

  /*
   * Featured products.
   * Product is replaced only if it
   * already exists in this list.
   */
  const featuredKey =
    "catalog/featured-products/" +
    "featured-products.json";

  if (
    await updateArrayFile(
      bucket,
      featuredKey,
      handle,
      summary
    )
  ) {
    updatedFiles.push(
      featuredKey
    );
  }

  /*
   * Popular products.
   */
  const popularKey =
    "catalog/popular-products/" +
    "popular-products.json";

  if (
    await updateArrayFile(
      bucket,
      popularKey,
      handle,
      summary
    )
  ) {
    updatedFiles.push(
      popularKey
    );
  }

  return {
    summary,
    updatedFiles,
  };
}

/*
 * --------------------------------------------------
 * SEARCH V2
 * --------------------------------------------------
 *
 * A product can exist in several 2-character shards.
 *
 * We therefore:
 *
 * 1. Calculate OLD prefixes.
 * 2. Calculate NEW prefixes.
 * 3. Take the union.
 * 4. Remove the product from every affected shard.
 * 5. Add the updated item back only to NEW shards.
 */
async function syncSearchV2(
  bucket: R2BucketLike,
  existingProduct: any,
  updatedProduct: any
) {
  const oldSearch =
    buildSearchV2(existingProduct);

  const newSearch =
    buildSearchV2(updatedProduct);

  const affectedPrefixes =
    unique([
      ...oldSearch.prefixes,
      ...newSearch.prefixes,
    ]);

  const newPrefixSet =
    new Set(newSearch.prefixes);

  const handle =
    String(updatedProduct.handle || "")
      .trim()
      .toLowerCase();

  const updatedFiles: string[] = [];

  for (
    const prefix of affectedPrefixes
  ) {
    const key =
      `catalog/search-v2/` +
      `${prefix}.json`;

    const current =
      await readJson(bucket, key);

    /*
     * Some NEW prefixes may not have
     * existed before.
     */
    const shard =
      Array.isArray(current)
        ? current
        : [];

    /*
     * Always remove the old copy.
     */
    const withoutProduct =
      shard.filter(
        (item: any) =>
          String(item?.h || "")
            .trim()
            .toLowerCase() !==
          handle
      );

    /*
     * Put updated product back only
     * when this is still one of its
     * current prefixes.
     */
    if (
      newPrefixSet.has(prefix)
    ) {
      withoutProduct.push(
        newSearch.item
      );
    }

    /*
     * Keep shard deterministic.
     */
    withoutProduct.sort(
      (a: any, b: any) =>
        String(a?.t || "")
          .localeCompare(
            String(b?.t || "")
          )
    );

    await writeJson(
      bucket,
      key,
      withoutProduct
    );

    updatedFiles.push(key);
  }

  return {
    updatedFiles,
  };
}

/*
 * --------------------------------------------------
 * PUBLIC SYNC FUNCTION
 * --------------------------------------------------
 */
export async function syncExistingProduct(
  bucket: R2BucketLike,
  existingProduct: any,
  updatedProduct: any
) {
  const summaryResult =
    await syncSummaryFiles(
      bucket,
      updatedProduct
    );

  const searchResult =
    await syncSearchV2(
      bucket,
      existingProduct,
      updatedProduct
    );

  return {
    summary:
      summaryResult.summary,

    updatedFiles: unique([
      ...summaryResult.updatedFiles,
      ...searchResult.updatedFiles,
    ]),
  };
}