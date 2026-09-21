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
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function compact(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function lowestPrice(variants: any[]) {
  const prices = (variants || [])
    .map((variant) =>
      Number(variant?.price || 0)
    )
    .filter((price) => price > 0);

  return prices.length
    ? Math.min(...prices)
    : 0;
}

function prefixOf(value: unknown) {
  const normalized = compact(value);

  return normalized.length >= 2
    ? normalized.slice(0, 2)
    : "";
}

function pageNumber(index: number) {
  return String(index + 1).padStart(
    4,
    "0"
  );
}

function compareTitles(
  first: unknown,
  second: unknown
) {
  return String(first || "").localeCompare(
    String(second || "")
  );
}

export function summarizeProduct(
  product: any
) {
  const firstVariant =
    product.variants?.[0] || {};

  return {
    handle: product.handle,
    title: product.title,
    collection: product.collection,

    collectionTitle:
      titleFromHandle(
        product.collection
      ),

    category: product.category,

    categoryTitle:
      titleFromHandle(
        product.category
      ),

    imageFolder:
      product.imageFolder ||
      product.collection ||
      "",

    tags:
      unique(product.tags || [])
        .map(slugify)
        .filter(Boolean),

    image:
      product.images?.[0] || "",

    partNumber:
      firstVariant.partNumber || "",

    vendor:
      firstVariant.vendor || "",

    variantCount:
      product.variants?.length || 0,

    price:
      lowestPrice(
        product.variants || []
      ),
  };
}

function buildSearchV2(product: any) {
  const variants =
    product.variants || [];

  const firstVariant =
    variants[0] || {};

  const searchValues = unique([
    product.handle,
    product.title,
    product.collection,
    product.category,
    ...(product.tags || []),

    ...variants.flatMap(
      (variant: any) => [
        variant.title,
        variant.partNumber,
        variant.vendor,
        variant.option1Value,
      ]
    ),
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
  const object =
    await bucket.get(key);

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

function replaceProduct(
  products: any[],
  handle: string,
  summary: any
) {
  let changed = false;

  const updated =
    products.map((item) => {
      if (
        String(item?.handle || "")
          .trim()
          .toLowerCase() ===
        handle
      ) {
        changed = true;

        return {
          ...item,
          ...summary,
        };
      }

      return item;
    });

  return {
    changed,
    products: updated,
  };
}

/*
 * Find a product inside a sorted group of pages
 * without scanning every page.
 */
async function findAndUpdateSortedPage(
  bucket: R2BucketLike,
  options: {
    basePath: string;
    totalPages: number;
    handle: string;
    title: string;
    summary: any;
  }
): Promise<string | null> {
  const {
    basePath,
    totalPages,
    handle,
    title,
    summary,
  } = options;

  if (totalPages <= 0) {
    return null;
  }

  let low = 0;
  let high = totalPages - 1;

  const checked =
    new Set<number>();

  async function checkPage(
    index: number
  ): Promise<{
    found: boolean;
    relation: number;
    key: string;
  }> {
    checked.add(index);

    const page =
      pageNumber(index);

    const key =
      `${basePath}/${page}.json`;

    const data =
      await readJson(
        bucket,
        key
      );

    const products =
      Array.isArray(data)
        ? data
        : [];

    if (!products.length) {
      return {
        found: false,
        relation: 0,
        key,
      };
    }

    const result =
      replaceProduct(
        products,
        handle,
        summary
      );

    if (result.changed) {
      await writeJson(
        bucket,
        key,
        result.products
      );

      return {
        found: true,
        relation: 0,
        key,
      };
    }

    const firstTitle =
      products[0]?.title || "";

    const lastTitle =
      products[
        products.length - 1
      ]?.title || "";

    if (
      compareTitles(
        title,
        firstTitle
      ) < 0
    ) {
      return {
        found: false,
        relation: -1,
        key,
      };
    }

    if (
      compareTitles(
        title,
        lastTitle
      ) > 0
    ) {
      return {
        found: false,
        relation: 1,
        key,
      };
    }

    /*
     * Title falls inside this page's range but the
     * handle was not found. This can happen when
     * duplicate titles cross a page boundary.
     */
    return {
      found: false,
      relation: 0,
      key,
    };
  }

  while (low <= high) {
    const middle =
      Math.floor(
        (low + high) / 2
      );

    const result =
      await checkPage(middle);

    if (result.found) {
      return result.key;
    }

    if (result.relation < 0) {
      high = middle - 1;
    } else if (
      result.relation > 0
    ) {
      low = middle + 1;
    } else {
      /*
       * Possible duplicate-title boundary.
       * Check neighbouring pages only.
       */
      const neighbours = [
        middle - 1,
        middle + 1,
      ].filter(
        (index) =>
          index >= 0 &&
          index < totalPages &&
          !checked.has(index)
      );

      for (
        const index
        of neighbours
      ) {
        const neighbour =
          await checkPage(index);

        if (neighbour.found) {
          return neighbour.key;
        }
      }

      return null;
    }
  }

  return null;
}

/*
 * Catalogue + collection summaries.
 */
async function syncSummaryPages(
  bucket: R2BucketLike,
  existingProduct: any,
  updatedProduct: any
) {
  const handle =
    clean(
      updatedProduct.handle
    ).toLowerCase();

  const title =
    existingProduct.title;

  const summary =
    summarizeProduct(
      updatedProduct
    );

  const updatedFiles: string[] =
    [];

  /*
   * ALL PRODUCTS
   */
  const catalogMeta =
    await readJson(
      bucket,
      "catalog/indexes/catalog-meta.json"
    );

  const catalogPages =
    Number(
      catalogMeta?.totalPages || 0
    );

  const catalogFile =
    await findAndUpdateSortedPage(
      bucket,
      {
        basePath:
          "catalog/indexes/catalog-pages",

        totalPages:
          catalogPages,

        handle,
        title,
        summary,
      }
    );

  if (catalogFile) {
    updatedFiles.push(
      catalogFile
    );
  }

  /*
   * COLLECTION / TAG PAGES
   */
  const categoryMeta =
    await readJson(
      bucket,
      "catalog/indexes/category-meta.json"
    );

  const tags =
    unique(
      existingProduct.tags || []
    )
      .map(slugify)
      .filter(Boolean);

  const categoryResults =
    await Promise.all(
      tags.map(
        async (tag) => {
          const totalPages =
            Number(
              categoryMeta?.[tag]
                ?.totalPages || 0
            );

          if (!totalPages) {
            return null;
          }

          return (
            findAndUpdateSortedPage(
              bucket,
              {
                basePath:
                  `catalog/indexes/` +
                  `category-pages/${tag}`,

                totalPages,

                handle,
                title,
                summary,
              }
            )
          );
        }
      )
    );

  for (
    const key
    of categoryResults
  ) {
    if (key) {
      updatedFiles.push(key);
    }
  }

  /*
   * HOMEPAGE CURATED LISTS
   */
  const curatedFiles = [
    "catalog/featured-products/featured-products.json",
    "catalog/popular-products/popular-products.json",
  ];

  const curatedResults =
    await Promise.all(
      curatedFiles.map(
        async (key) => {
          const data =
            await readJson(
              bucket,
              key
            );

          if (!Array.isArray(data)) {
            return null;
          }

          const result =
            replaceProduct(
              data,
              handle,
              summary
            );

          if (!result.changed) {
            return null;
          }

          await writeJson(
            bucket,
            key,
            result.products
          );

          return key;
        }
      )
    );

  for (
    const key
    of curatedResults
  ) {
    if (key) {
      updatedFiles.push(key);
    }
  }

  return {
    summary,
    updatedFiles,
  };
}

/*
 * Search V2
 */
async function syncSearchV2(
  bucket: R2BucketLike,
  existingProduct: any,
  updatedProduct: any
) {
  const oldSearch =
    buildSearchV2(
      existingProduct
    );

  const newSearch =
    buildSearchV2(
      updatedProduct
    );

  const affectedPrefixes =
    unique([
      ...oldSearch.prefixes,
      ...newSearch.prefixes,
    ]);

  const newPrefixSet =
    new Set(
      newSearch.prefixes
    );

  const handle =
    clean(
      updatedProduct.handle
    ).toLowerCase();

  const results =
    await Promise.all(
      affectedPrefixes.map(
        async (prefix) => {
          const key =
            `catalog/search-v2/` +
            `${prefix}.json`;

          const current =
            await readJson(
              bucket,
              key
            );

          const shard =
            Array.isArray(current)
              ? current
              : [];

          const withoutProduct =
            shard.filter(
              (item: any) =>
                clean(
                  item?.h
                ).toLowerCase() !==
                handle
            );

          if (
            newPrefixSet.has(
              prefix
            )
          ) {
            withoutProduct.push(
              newSearch.item
            );
          }

          withoutProduct.sort(
            (a: any, b: any) =>
              String(a?.t || "")
                .localeCompare(
                  String(
                    b?.t || ""
                  )
                )
          );

          await writeJson(
            bucket,
            key,
            withoutProduct
          );

          return key;
        }
      )
    );

  return {
    updatedFiles:
      results,
  };
}

/*
 * Main Admin synchronization.
 */
export async function syncExistingProduct(
  bucket: R2BucketLike,
  existingProduct: any,
  updatedProduct: any
) {
  const [
    summaryResult,
    searchResult,
  ] =
    await Promise.all([
      syncSummaryPages(
        bucket,
        existingProduct,
        updatedProduct
      ),

      syncSearchV2(
        bucket,
        existingProduct,
        updatedProduct
      ),
    ]);

  return {
    summary:
      summaryResult.summary,

    updatedFiles:
      unique([
        ...summaryResult.updatedFiles,
        ...searchResult.updatedFiles,
      ]),
  };
}