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
  delete(
    key: string
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

    /*
   * Manually-created/admin-edited products may live
   * on the final page rather than their theoretical
   * sorted page. Always check that page first.
   */
  const finalPage =
    totalPages - 1;

  const finalResult =
    await checkPage(finalPage);

  if (finalResult.found) {
    return finalResult.key;
  }

  high =
    totalPages - 2;

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
 * New product creation synchronization.
 *
 * Inserts a completely new product into:
 * - full catalogue index
 * - paginated catalogue
 * - every tag / collection
 * - category metadata
 * - collections
 * - filter index
 * - Search V2
 * - handle registry
 * - statistics
 */

async function readPagedItems(
  bucket: R2BucketLike,
  basePath: string,
  totalPages: number
) {
  const pages = await Promise.all(
    Array.from(
      { length: totalPages },
      (_, index) =>
        readJson(
          bucket,
          `${basePath}/${pageNumber(index)}.json`
        )
    )
  );

  return pages.flatMap((page) =>
    Array.isArray(page) ? page : []
  );
}

async function writePagedItems(
  bucket: R2BucketLike,
  basePath: string,
  items: any[],
  pageSize: number
) {
  const totalPages = Math.ceil(
    items.length / pageSize
  );

  const updatedFiles: string[] = [];

  /*
   * R2 writes used to happen one-by-one.
   *
   * With a large catalogue this meant thousands
   * of sequential network operations during one
   * admin request.
   *
   * Keep the exact same pages and ordering, but
   * write them in controlled parallel batches.
   */
  const WRITE_BATCH_SIZE = 25;

  for (
    let startIndex = 0;
    startIndex < totalPages;
    startIndex += WRITE_BATCH_SIZE
  ) {
    const endIndex = Math.min(
      startIndex + WRITE_BATCH_SIZE,
      totalPages
    );

    const batch: Promise<void>[] = [];

    for (
      let index = startIndex;
      index < endIndex;
      index++
    ) {
      const key =
        `${basePath}/${pageNumber(index)}.json`;

      updatedFiles.push(key);

      batch.push(
        writeJson(
          bucket,
          key,
          items.slice(
            index * pageSize,
            (index + 1) * pageSize
          )
        )
      );
    }

    await Promise.all(batch);
  }

  return {
    totalPages,
    updatedFiles,
  };
}

function sortSummaries(items: any[]) {
  return [...items].sort(
    (a, b) =>
      compareTitles(
        a?.title,
        b?.title
      )
  );
}

async function appendPagedItem(
  bucket: R2BucketLike,
  basePath: string,
  item: any,
  pageSize: number,
  totalPages: number
) {
  /*
   * Empty collection/catalogue:
   * create page 0001.
   */
  if (totalPages <= 0) {
    const key =
      `${basePath}/${pageNumber(0)}.json`;

    await writeJson(
      bucket,
      key,
      [item]
    );

    return {
      totalPages: 1,
      updatedFiles: [key],
    };
  }

  const lastPageIndex =
    totalPages - 1;

  const lastPageKey =
    `${basePath}/${pageNumber(lastPageIndex)}.json`;

  const existingPage =
    await readJson(
      bucket,
      lastPageKey
    );

  const items =
    Array.isArray(existingPage)
      ? [...existingPage]
      : [];

  /*
   * There is still room on the
   * existing final page.
   */
  if (items.length < pageSize) {
    items.push(item);

    await writeJson(
      bucket,
      lastPageKey,
      items
    );

    return {
      totalPages,
      updatedFiles: [
        lastPageKey,
      ],
    };
  }

  /*
   * Final page is full.
   * Create exactly one new page.
   */
  const newPageKey =
    `${basePath}/${pageNumber(totalPages)}.json`;

  await writeJson(
    bucket,
    newPageKey,
    [item]
  );

  return {
    totalPages:
      totalPages + 1,

    updatedFiles: [
      newPageKey,
    ],
  };
}

export async function deleteProduct(
  bucket: R2BucketLike,
  rawHandle: string,
  fallbackProduct?: any
) {
  const handle =
    clean(rawHandle).toLowerCase();

  if (!handle) {
    throw new Error(
      "Product handle is required."
    );
  }

  const updatedFiles: string[] = [];

  const catalogMetaKey =
    "catalog/indexes/catalog-meta.json";

  const catalogIndexKey =
    "catalog/indexes/catalog-index.json";

  const categoryMetaKey =
    "catalog/indexes/category-meta.json";

  const collectionsKey =
    "catalog/indexes/collections.json";

  const filterIndexKey =
    "catalog/indexes/filter-index.json";

  const statsKey =
    "catalog/indexes/stats.json";

  /*
   * --------------------------------
   * LOAD MAIN INDEX
   * --------------------------------
   */

  const catalogIndexRaw =
    await readJson(
      bucket,
      catalogIndexKey
    );

  const catalogIndex =
    Array.isArray(catalogIndexRaw)
      ? [...catalogIndexRaw]
      : [];

  const existingIndex =
    catalogIndex.findIndex(
      (item: any) =>
        clean(item?.handle)
          .toLowerCase() ===
        handle
    );

  const existingSummary =
    existingIndex >= 0
      ? catalogIndex[
      existingIndex
      ]
      : fallbackProduct
        ? {
          handle,

          title:
            fallbackProduct.title || "",

          collection:
            fallbackProduct.collection || "",

          category:
            fallbackProduct.category || "",

          tags:
            unique([
              ...(Array.isArray(
                fallbackProduct.tags
              )
                ? fallbackProduct.tags
                : []),

              fallbackProduct.collection,
              fallbackProduct.category,
            ])
              .map(slugify)
              .filter(Boolean),

          image:
            fallbackProduct.image || "",

          partNumber:
            fallbackProduct.partNumber || "",

          vendor:
            fallbackProduct.vendor || "",

          variantCount:
            Number(
              fallbackProduct.variantCount || 0
            ),
        }
        : null;

  /*
   * It may already be partially
   * deleted. Keep deletion safe to
   * run again.
   */

  const nextCatalog =
    catalogIndex.filter(
      (item: any) =>
        clean(item?.handle)
          .toLowerCase() !==
        handle
    );

  if (
    nextCatalog.length !==
    catalogIndex.length
  ) {
    await writeJson(
      bucket,
      catalogIndexKey,
      nextCatalog
    );

    updatedFiles.push(
      catalogIndexKey
    );
  }

  /*
   * --------------------------------
   * CATALOGUE PAGE
   * --------------------------------
   *
   * New manually-created products are
   * appended to the final page.
   *
   * Older products are in sorted pages.
   *
   * Therefore:
   * 1. check final page
   * 2. check calculated sorted page
   * 3. check its immediate neighbours
   *
   * No full catalogue scan.
   */

  const catalogMeta =
    (await readJson(
      bucket,
      catalogMetaKey
    )) || {};

  const catalogTotalPages =
    Number(
      catalogMeta?.totalPages || 0
    );

  const catalogPageSize =
    Number(
      catalogMeta?.pageSize || 24
    );

  async function removeFromPage(
    basePath: string,
    pageIndex: number
  ) {
    if (pageIndex < 0) {
      return false;
    }

    const key =
      `${basePath}/${pageNumber(pageIndex)}.json`;

    const raw =
      await readJson(
        bucket,
        key
      );

    if (!Array.isArray(raw)) {
      return false;
    }

    const filtered =
      raw.filter(
        (item: any) =>
          clean(item?.handle)
            .toLowerCase() !==
          handle
      );

    if (
      filtered.length ===
      raw.length
    ) {
      return false;
    }

    await writeJson(
      bucket,
      key,
      filtered
    );

    updatedFiles.push(key);

    return true;
  }

  let removedFromCatalogPage =
    false;

  if (catalogTotalPages > 0) {
    /*
     * Check append location first.
     */
    removedFromCatalogPage =
      await removeFromPage(
        "catalog/indexes/catalog-pages",
        catalogTotalPages - 1
      );
  }

  if (
    !removedFromCatalogPage &&
    existingIndex >= 0
  ) {
    /*
     * Older sorted catalogue location.
     */
    const expectedPage =
      Math.floor(
        existingIndex /
        catalogPageSize
      );

    const candidates =
      unique([
        expectedPage,
        expectedPage - 1,
        expectedPage + 1,
      ]).filter(
        (index) =>
          index >= 0 &&
          index <
          catalogTotalPages
      );

    for (
      const pageIndex
      of candidates
    ) {
      const removed =
        await removeFromPage(
          "catalog/indexes/catalog-pages",
          pageIndex
        );

      if (removed) {
        removedFromCatalogPage =
          true;
        break;
      }
    }
  }

  /*
   * --------------------------------
   * COLLECTION / TAG PAGES
   * --------------------------------
   *
   * The catalogue summary already
   * contains the product's tags, so
   * only those collections are touched.
   */

  const categoryMeta =
    (await readJson(
      bucket,
      categoryMetaKey
    )) || {};

  const collectionsRaw =
    await readJson(
      bucket,
      collectionsKey
    );

  const collections =
    Array.isArray(collectionsRaw)
      ? [...collectionsRaw]
      : [];

  const tags =
    unique([
      ...(
        Array.isArray(
          existingSummary?.tags
        )
          ? existingSummary.tags
          : []
      ),

      existingSummary?.collection,
      existingSummary?.category,
    ])
      .map(slugify)
      .filter(Boolean);

  for (const tag of tags) {
    const meta =
      categoryMeta?.[tag];

    if (!meta) {
      continue;
    }

    const totalPages =
      Number(
        meta?.totalPages || 0
      );

    if (!totalPages) {
      continue;
    }

    /*
     * Manual products are appended,
     * therefore final page first.
     */

    let removed =
      await removeFromPage(
        `catalog/indexes/category-pages/${tag}`,
        totalPages - 1
      );

    /*
     * If this is an older sorted
     * product, locate it using title
     * ranges instead of scanning every
     * collection page.
     */

    if (
      !removed &&
      existingSummary?.title
    ) {
      let low = 0;
      let high =
        totalPages - 1;

      while (
        low <= high &&
        !removed
      ) {
        const middle =
          Math.floor(
            (low + high) / 2
          );

        const key =
          `catalog/indexes/category-pages/${tag}/${pageNumber(middle)}.json`;

        const raw =
          await readJson(
            bucket,
            key
          );

        const page =
          Array.isArray(raw)
            ? raw
            : [];

        if (!page.length) {
          break;
        }

        const filtered =
          page.filter(
            (item: any) =>
              clean(item?.handle)
                .toLowerCase() !==
              handle
          );

        if (
          filtered.length !==
          page.length
        ) {
          await writeJson(
            bucket,
            key,
            filtered
          );

          updatedFiles.push(
            key
          );

          removed = true;
          break;
        }

        const firstTitle =
          page[0]?.title || "";

        const lastTitle =
          page[
            page.length - 1
          ]?.title || "";

        if (
          compareTitles(
            existingSummary.title,
            firstTitle
          ) < 0
        ) {
          high =
            middle - 1;
        } else if (
          compareTitles(
            existingSummary.title,
            lastTitle
          ) > 0
        ) {
          low =
            middle + 1;
        } else {
          /*
           * Same-title boundary:
           * check immediate neighbours.
           */

          const neighbours =
            [
              middle - 1,
              middle + 1,
            ].filter(
              (index) =>
                index >= 0 &&
                index <
                totalPages
            );

          for (
            const neighbour
            of neighbours
          ) {
            const found =
              await removeFromPage(
                `catalog/indexes/category-pages/${tag}`,
                neighbour
              );

            if (found) {
              removed = true;
              break;
            }
          }

          break;
        }
      }
    }

    if (removed) {
      const oldTotal =
        Number(
          meta?.totalProducts || 0
        );

      categoryMeta[tag] = {
        ...meta,

        totalProducts:
          Math.max(
            0,
            oldTotal - 1
          ),
      };

      const collectionIndex =
        collections.findIndex(
          (item: any) =>
            slugify(
              item?.handle
            ) === tag
        );

      if (
        collectionIndex >= 0
      ) {
        collections[
          collectionIndex
        ] = {
          ...collections[
          collectionIndex
          ],

          count:
            categoryMeta[tag]
              .totalProducts,
        };
      }
    }
  }

  /*
   * --------------------------------
   * META + COLLECTIONS
   * --------------------------------
   */

  await Promise.all([
    writeJson(
      bucket,
      categoryMetaKey,
      categoryMeta
    ),

    writeJson(
      bucket,
      collectionsKey,
      collections
    ),

    writeJson(
      bucket,
      catalogMetaKey,
      {
        ...catalogMeta,

        totalProducts:
          nextCatalog.length,
      }
    ),
  ]);

  updatedFiles.push(
    categoryMetaKey,
    collectionsKey,
    catalogMetaKey
  );

  /*
   * --------------------------------
   * FILTER INDEX
   * --------------------------------
   */

  const existingFilter =
    (await readJson(
      bucket,
      filterIndexKey
    )) || {};

  const brandCounts =
    new Map<string, number>();

  for (
    const item of nextCatalog
  ) {
    const vendor =
      clean(item?.vendor);

    if (!vendor) {
      continue;
    }

    brandCounts.set(
      vendor,
      (
        brandCounts.get(
          vendor
        ) || 0
      ) + 1
    );
  }

  const brands =
    Array.from(
      brandCounts.entries()
    )
      .map(
        ([title, count]) => ({
          handle: title,
          title,
          count,
        })
      )
      .sort(
        (a, b) =>
          a.title.localeCompare(
            b.title
          )
      );

  await writeJson(
    bucket,
    filterIndexKey,
    {
      ...existingFilter,

      categories:
        collections,

      brands,
    }
  );

  updatedFiles.push(
    filterIndexKey
  );

  /*
   * --------------------------------
   * SEARCH V2
   * --------------------------------
   *
   * Reconstruct enough product data
   * from catalog-index.json to obtain
   * the exact same two-character
   * Search V2 prefixes.
   */

  if (existingSummary) {
    const searchProduct = {
      handle,

      title:
        existingSummary.title ||
        "",

      collection:
        existingSummary.collection ||
        "",

      category:
        existingSummary.category ||
        "",

      tags:
        existingSummary.tags || [],

      images:
        existingSummary.image
          ? [
            existingSummary.image,
          ]
          : [],

      variants: [
        {
          partNumber:
            existingSummary.partNumber ||
            "",

          vendor:
            existingSummary.vendor ||
            "",
        },
      ],
    };

    const search =
      buildSearchV2(
        searchProduct
      );

    await Promise.all(
      search.prefixes.map(
        async (prefix) => {
          const key =
            `catalog/search-v2/${prefix}.json`;

          const raw =
            await readJson(
              bucket,
              key
            );

          if (!Array.isArray(raw)) {
            return;
          }

          const filtered =
            raw.filter(
              (item: any) =>
                clean(item?.h)
                  .toLowerCase() !==
                handle
            );

          if (
            filtered.length ===
            raw.length
          ) {
            return;
          }

          await writeJson(
            bucket,
            key,
            filtered
          );

          updatedFiles.push(
            key
          );
        }
      )
    );
  }

  /*
   * --------------------------------
   * HANDLE REGISTRY
   * --------------------------------
   */

  const first =
    handle[0];

  const registryShard =
    first >= "0" &&
      first <= "9"
      ? first
      : first >= "a" &&
        first <= "z"
        ? first
        : "other";

  const registryKey =
    `catalog/handles/${registryShard}.json`;

  const registry =
    (await readJson(
      bucket,
      registryKey
    )) || {};

  if (
    Object.prototype
      .hasOwnProperty.call(
        registry,
        handle
      )
  ) {
    delete registry[
      handle
    ];

    await writeJson(
      bucket,
      registryKey,
      registry
    );

    updatedFiles.push(
      registryKey
    );
  }

  /*
   * --------------------------------
   * STATS
   * --------------------------------
   */

  const stats =
    (await readJson(
      bucket,
      statsKey
    )) || {};

  const variantsToRemove =
    Number(
      existingSummary
        ?.variantCount || 0
    );

  await writeJson(
    bucket,
    statsKey,
    {
      ...stats,

      products:
        nextCatalog.length,

      variants:
        Math.max(
          0,
          Number(
            stats?.variants || 0
          ) -
          variantsToRemove
        ),

      collections:
        collections.length,
    }
  );

  updatedFiles.push(
    statsKey
  );

  return {
    handle,

    found:
      Boolean(
        existingSummary
      ),

    updatedFiles:
      unique(
        updatedFiles
      ),
  };
}

export async function createNewProduct(
  bucket: R2BucketLike,
  product: any
) {
  const handle =
    clean(product?.handle)
      .toLowerCase();

  if (!handle) {
    throw new Error(
      "Product handle is required."
    );
  }

  const summary =
    summarizeProduct(product);

  const tags =
    unique(product.tags || [])
      .map(slugify)
      .filter(Boolean);

  if (!tags.length) {
    throw new Error(
      "At least one tag is required."
    );
  }

  const updatedFiles: string[] = [];

  /*
   * --------------------------------
   * FULL CATALOGUE
   * --------------------------------
   */

  const catalogMetaKey =
    "catalog/indexes/catalog-meta.json";

  const catalogIndexKey =
    "catalog/indexes/catalog-index.json";

  const catalogMeta =
    (await readJson(
      bucket,
      catalogMetaKey
    )) || {};

  const catalogPageSize =
    Number(
      catalogMeta?.pageSize || 24
    );

  const catalogTotalPages =
    Number(
      catalogMeta?.totalPages || 0
    );

  /*
   * Keep catalog-index.json synchronized,
   * but do not read/rewrite every
   * catalogue page.
   */
  const catalogIndexRaw =
    await readJson(
      bucket,
      catalogIndexKey
    );

  const catalogIndex =
    Array.isArray(catalogIndexRaw)
      ? [...catalogIndexRaw]
      : [];

  const alreadyInCatalog =
    catalogIndex.some(
      (item: any) =>
        clean(item?.handle)
          .toLowerCase() ===
        handle
    );

  if (alreadyInCatalog) {
    throw new Error(
      `Product "${handle}" already exists.`
    );
  }

  catalogIndex.push(summary);

  /*
   * Keep the full index sorted.
   * Numbered pages intentionally use
   * incremental append so one product
   * does not rewrite thousands of pages.
   */
  const nextCatalogIndex =
    sortSummaries(
      catalogIndex
    );

  await writeJson(
    bucket,
    catalogIndexKey,
    nextCatalogIndex
  );

  updatedFiles.push(
    catalogIndexKey
  );

  const catalogPageResult =
    await appendPagedItem(
      bucket,
      "catalog/indexes/catalog-pages",
      summary,
      catalogPageSize,
      catalogTotalPages
    );

  updatedFiles.push(
    ...catalogPageResult.updatedFiles
  );

  const totalProducts =
    Number(
      catalogMeta?.totalProducts ||
      (
        nextCatalogIndex.length - 1
      )
    ) + 1;

  await writeJson(
    bucket,
    catalogMetaKey,
    {
      ...catalogMeta,

      totalProducts,

      pageSize:
        catalogPageSize,

      totalPages:
        catalogPageResult.totalPages,
    }
  );

  updatedFiles.push(
    catalogMetaKey
  );

  /*
   * --------------------------------
   * COLLECTIONS / TAGS
   * --------------------------------
   */

  const categoryMetaKey =
    "catalog/indexes/category-meta.json";

  const collectionsKey =
    "catalog/indexes/collections.json";

  const filterIndexKey =
    "catalog/indexes/filter-index.json";

  const categoryMeta =
    (await readJson(
      bucket,
      categoryMetaKey
    )) || {};

  const collectionsRaw =
    await readJson(
      bucket,
      collectionsKey
    );

  const collections =
    Array.isArray(collectionsRaw)
      ? [...collectionsRaw]
      : [];

  for (const tag of tags) {
    const oldMeta =
      categoryMeta?.[tag] || {};

    const pageSize =
      Number(
        oldMeta?.pageSize || 24
      );

    const totalPages =
      Number(
        oldMeta?.totalPages || 0
      );

    const currentTotal =
      Number(
        oldMeta?.totalProducts || 0
      );

    const pageResult =
      await appendPagedItem(
        bucket,
        `catalog/indexes/category-pages/${tag}`,
        summary,
        pageSize,
        totalPages
      );

    updatedFiles.push(
      ...pageResult.updatedFiles
    );

    const nextTotal =
      currentTotal + 1;

    categoryMeta[tag] = {
      ...oldMeta,

      totalProducts:
        nextTotal,

      pageSize,

      totalPages:
        pageResult.totalPages,
    };

    const collectionIndex =
      collections.findIndex(
        (item: any) =>
          slugify(
            item?.handle
          ) === tag
      );

    const collectionEntry = {
      title:
        titleFromHandle(tag),

      handle:
        tag,

      count:
        nextTotal,
    };

    if (
      collectionIndex >= 0
    ) {
      collections[
        collectionIndex
      ] = {
        ...collections[
        collectionIndex
        ],

        ...collectionEntry,
      };
    } else {
      collections.push(
        collectionEntry
      );
    }
  }

  collections.sort(
    (a: any, b: any) =>
      String(a?.title || "")
        .localeCompare(
          String(b?.title || "")
        )
  );

  await Promise.all([
    writeJson(
      bucket,
      categoryMetaKey,
      categoryMeta
    ),

    writeJson(
      bucket,
      collectionsKey,
      collections
    ),
  ]);

  updatedFiles.push(
    categoryMetaKey,
    collectionsKey
  );

  /*
   * --------------------------------
   * FILTER INDEX
   * --------------------------------
   */

  const existingFilter =
    (await readJson(
      bucket,
      filterIndexKey
    )) || {};

  const existingBrands =
    Array.isArray(
      existingFilter?.brands
    )
      ? [...existingFilter.brands]
      : [];

  const vendor =
    clean(summary?.vendor);

  if (vendor) {
    const brandIndex =
      existingBrands.findIndex(
        (item: any) =>
          clean(item?.title) ===
          vendor
      );

    if (brandIndex >= 0) {
      existingBrands[
        brandIndex
      ] = {
        ...existingBrands[
        brandIndex
        ],

        count:
          Number(
            existingBrands[
              brandIndex
            ]?.count || 0
          ) + 1,
      };
    } else {
      existingBrands.push({
        handle:
          vendor,

        title:
          vendor,

        count: 1,
      });
    }

    existingBrands.sort(
      (a: any, b: any) =>
        String(a?.title || "")
          .localeCompare(
            String(
              b?.title || ""
            )
          )
    );
  }

  await writeJson(
    bucket,
    filterIndexKey,
    {
      ...existingFilter,

      categories:
        collections,

      brands:
        existingBrands,
    }
  );

  updatedFiles.push(
    filterIndexKey
  );

  /*
   * --------------------------------
   * SEARCH V2
   * --------------------------------
   */

  const searchResult =
    await syncSearchV2(
      bucket,
      {
        handle,
        variants: [],
        tags: [],
      },
      product
    );

  updatedFiles.push(
    ...searchResult.updatedFiles
  );

  /*
   * --------------------------------
   * HANDLE REGISTRY
   * --------------------------------
   */

  const first =
    handle[0];

  const registryShard =
    first >= "0" &&
      first <= "9"
      ? first
      : first >= "a" &&
        first <= "z"
        ? first
        : "other";

  const registryKey =
    `catalog/handles/${registryShard}.json`;

  const registry =
    (await readJson(
      bucket,
      registryKey
    )) || {};

  registry[handle] = {
    handle,

    sources:
      product.sources || [],

    tags,

    updatedAt:
      new Date().toISOString(),
  };

  await writeJson(
    bucket,
    registryKey,
    registry
  );

  updatedFiles.push(
    registryKey
  );

  /*
   * --------------------------------
   * STATS
   * --------------------------------
   */

  const statsKey =
    "catalog/indexes/stats.json";

  const stats =
    (await readJson(
      bucket,
      statsKey
    )) || {};

  const variantCount =
    Number(
      product?.variants?.length ||
      0
    );

  await writeJson(
    bucket,
    statsKey,
    {
      ...stats,

      products:
        totalProducts,

      variants:
        Number(
          stats?.variants || 0
        ) + variantCount,

      collections:
        collections.length,
    }
  );

  updatedFiles.push(
    statsKey
  );

  return {
    summary,

    updatedFiles:
      unique(updatedFiles),
  };
}


/*
 * Main Admin synchronization.
 *
 * Normal edits update the existing catalogue entries
 * in place.
 *
 * Title/tag changes can change the physical location
 * of a product inside catalogue/category pages, so
 * those edits use the existing delete + create
 * synchronization flow.
 *
 * Handle changes remain unsupported.
 */
export async function syncExistingProduct(
  bucket: R2BucketLike,
  existingProduct: any,
  updatedProduct: any
) {
  const handle =
    clean(updatedProduct?.handle)
      .toLowerCase();

  if (!handle) {
    throw new Error(
      "Product handle is required."
    );
  }

  const oldHandle =
    clean(existingProduct?.handle)
      .toLowerCase();

  if (
    oldHandle &&
    oldHandle !== handle
  ) {
    throw new Error(
      "Product handle cannot be changed."
    );
  }

  const summary =
    summarizeProduct(
      updatedProduct
    );

  const updatedFiles: string[] =
    [];

  const oldTags =
    unique(
      Array.isArray(
        existingProduct?.tags
      )
        ? existingProduct.tags
        : []
    )
      .map(slugify)
      .filter(Boolean);

  const newTags =
    unique(
      Array.isArray(
        updatedProduct?.tags
      )
        ? updatedProduct.tags
        : []
    )
      .map(slugify)
      .filter(Boolean);

  if (!newTags.length) {
    throw new Error(
      "At least one tag is required."
    );
  }

  const oldTagSet =
    new Set(oldTags);

  const newTagSet =
    new Set(newTags);

  const removedTags =
    oldTags.filter(
      (tag) =>
        !newTagSet.has(tag)
    );

  const addedTags =
    newTags.filter(
      (tag) =>
        !oldTagSet.has(tag)
    );

  const unchangedTags =
    newTags.filter(
      (tag) =>
        oldTagSet.has(tag)
    );

  /*
   * ------------------------------------------------
   * CATALOGUE SUMMARY
   * ------------------------------------------------
   *
   * Update the existing numbered catalogue page.
   * This also works for title changes because lookup
   * uses the OLD title while writing the NEW summary.
   */
  const catalogMetaKey =
    "catalog/indexes/catalog-meta.json";

  const catalogIndexKey =
    "catalog/indexes/catalog-index.json";

  const catalogMeta =
    (await readJson(
      bucket,
      catalogMetaKey
    )) || {};

  const catalogTotalPages =
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
          catalogTotalPages,

        handle,

        title:
          existingProduct?.title ||
          updatedProduct?.title ||
          "",

        summary,
      }
    );

  if (catalogFile) {
    updatedFiles.push(
      catalogFile
    );
  }

  /*
   * ------------------------------------------------
   * FULL CATALOG INDEX
   * ------------------------------------------------
   */
  const catalogIndexRaw =
    await readJson(
      bucket,
      catalogIndexKey
    );

  const catalogIndex =
    Array.isArray(
      catalogIndexRaw
    )
      ? [...catalogIndexRaw]
      : [];

  const catalogIndexResult =
    replaceProduct(
      catalogIndex,
      handle,
      summary
    );

  let nextCatalog =
    catalogIndexResult.products;

  if (
    catalogIndexResult.changed
  ) {
    /*
     * catalog-index.json itself is kept sorted.
     * Numbered pages do NOT need full repagination.
     */
    nextCatalog =
      sortSummaries(
        catalogIndexResult.products
      );

    await writeJson(
      bucket,
      catalogIndexKey,
      nextCatalog
    );

    updatedFiles.push(
      catalogIndexKey
    );
  }

  /*
   * ------------------------------------------------
   * COLLECTION / TAG DATA
   * ------------------------------------------------
   */
  const categoryMetaKey =
    "catalog/indexes/category-meta.json";

  const collectionsKey =
    "catalog/indexes/collections.json";

  const categoryMeta =
    (await readJson(
      bucket,
      categoryMetaKey
    )) || {};

  const collectionsRaw =
    await readJson(
      bucket,
      collectionsKey
    );

  const collections =
    Array.isArray(
      collectionsRaw
    )
      ? [...collectionsRaw]
      : [];

  /*
   * Locate and remove a product from one tag.
   *
   * Returns TRUE only when the product was
   * physically present and removed.
   *
   * This is important for recovery from a
   * partially-completed previous save.
   */
  async function removeFromTag(
    tag: string
  ) {
    const meta =
      categoryMeta?.[tag];

    if (!meta) {
      return false;
    }

    const totalPages =
      Number(
        meta?.totalPages || 0
      );

    if (!totalPages) {
      return false;
    }

    const basePath =
      `catalog/indexes/category-pages/${tag}`;

    async function removePage(
      pageIndex: number
    ) {
      if (
        pageIndex < 0 ||
        pageIndex >= totalPages
      ) {
        return false;
      }

      const key =
        `${basePath}/${pageNumber(
          pageIndex
        )}.json`;

      const raw =
        await readJson(
          bucket,
          key
        );

      if (!Array.isArray(raw)) {
        return false;
      }

      const filtered =
        raw.filter(
          (item: any) =>
            clean(
              item?.handle
            ).toLowerCase() !==
            handle
        );

      if (
        filtered.length ===
        raw.length
      ) {
        return false;
      }

      await writeJson(
        bucket,
        key,
        filtered
      );

      updatedFiles.push(key);

      return true;
    }

    /*
     * Admin/manual products may have been
     * appended to the final page.
     */
    let removed =
      await removePage(
        totalPages - 1
      );

    /*
     * Otherwise locate the older sorted page
     * using the old title.
     */
    if (!removed) {
      let low = 0;
      let high =
        totalPages - 2;

      const oldTitle =
        existingProduct?.title ||
        "";

      while (
        low <= high &&
        !removed
      ) {
        const middle =
          Math.floor(
            (low + high) / 2
          );

        const key =
          `${basePath}/${pageNumber(
            middle
          )}.json`;

        const raw =
          await readJson(
            bucket,
            key
          );

        const page =
          Array.isArray(raw)
            ? raw
            : [];

        if (!page.length) {
          break;
        }

        const filtered =
          page.filter(
            (item: any) =>
              clean(
                item?.handle
              ).toLowerCase() !==
              handle
          );

        if (
          filtered.length !==
          page.length
        ) {
          await writeJson(
            bucket,
            key,
            filtered
          );

          updatedFiles.push(key);

          removed = true;
          break;
        }

        const firstTitle =
          page[0]?.title || "";

        const lastTitle =
          page[
            page.length - 1
          ]?.title || "";

        if (
          compareTitles(
            oldTitle,
            firstTitle
          ) < 0
        ) {
          high =
            middle - 1;
        } else if (
          compareTitles(
            oldTitle,
            lastTitle
          ) > 0
        ) {
          low =
            middle + 1;
        } else {
          /*
           * Duplicate-title boundary.
           */
          const neighbours =
            unique([
              middle - 1,
              middle + 1,
            ]).filter(
              (index) =>
                index >= 0 &&
                index <
                  totalPages - 1
            );

          for (
            const neighbour
            of neighbours
          ) {
            removed =
              await removePage(
                neighbour
              );

            if (removed) {
              break;
            }
          }

          break;
        }
      }
    }

    /*
     * Only reduce counts if something was
     * ACTUALLY removed.
     *
     * This makes retries safe.
     */
    if (removed) {
      const nextTotal =
        Math.max(
          0,
          Number(
            meta?.totalProducts ||
              0
          ) - 1
        );

      categoryMeta[tag] = {
        ...meta,

        totalProducts:
          nextTotal,
      };

      const collectionIndex =
        collections.findIndex(
          (item: any) =>
            slugify(
              item?.handle
            ) === tag
        );

      if (
        collectionIndex >= 0
      ) {
        collections[
          collectionIndex
        ] = {
          ...collections[
            collectionIndex
          ],

          count:
            nextTotal,
        };
      }
    }

    return removed;
  }

  /*
   * Update summaries inside tags that remain
   * attached to the product.
   */
  for (
    const tag
    of unchangedTags
  ) {
    const totalPages =
      Number(
        categoryMeta?.[tag]
          ?.totalPages || 0
      );

    if (!totalPages) {
      continue;
    }

    const key =
      await findAndUpdateSortedPage(
        bucket,
        {
          basePath:
            `catalog/indexes/category-pages/${tag}`,

          totalPages,

          handle,

          title:
            existingProduct?.title ||
            updatedProduct?.title ||
            "",

          summary,
        }
      );

    if (key) {
      updatedFiles.push(key);
    }
  }

  /*
   * Remove from tags that the admin deleted.
   */
  for (
    const tag
    of removedTags
  ) {
    await removeFromTag(tag);
  }

  /*
   * Add to newly-added tags.
   *
   * First check whether the product already exists
   * there. This makes retries safe.
   */
  for (
    const tag
    of addedTags
  ) {
    const oldMeta =
      categoryMeta?.[tag] || {};

    const pageSize =
      Number(
        oldMeta?.pageSize || 24
      );

    const totalPages =
      Number(
        oldMeta?.totalPages || 0
      );

    let alreadyExists =
      false;

    /*
     * New/admin products normally live on the
     * final page, so check there first.
     */
    if (totalPages > 0) {
      const lastPageKey =
        `catalog/indexes/category-pages/${tag}/${pageNumber(
          totalPages - 1
        )}.json`;

      const lastPage =
        await readJson(
          bucket,
          lastPageKey
        );

      alreadyExists =
        Array.isArray(lastPage) &&
        lastPage.some(
          (item: any) =>
            clean(
              item?.handle
            ).toLowerCase() ===
            handle
        );
    }

    if (!alreadyExists) {
      const pageResult =
        await appendPagedItem(
          bucket,
          `catalog/indexes/category-pages/${tag}`,
          summary,
          pageSize,
          totalPages
        );

      updatedFiles.push(
        ...pageResult.updatedFiles
      );

      const nextTotal =
        Number(
          oldMeta?.totalProducts ||
            0
        ) + 1;

      categoryMeta[tag] = {
        ...oldMeta,

        totalProducts:
          nextTotal,

        pageSize,

        totalPages:
          pageResult.totalPages,
      };

      const collectionIndex =
        collections.findIndex(
          (item: any) =>
            slugify(
              item?.handle
            ) === tag
        );

      const collectionEntry = {
        title:
          titleFromHandle(tag),

        handle:
          tag,

        count:
          nextTotal,
      };

      if (
        collectionIndex >= 0
      ) {
        collections[
          collectionIndex
        ] = {
          ...collections[
            collectionIndex
          ],

          ...collectionEntry,
        };
      } else {
        collections.push(
          collectionEntry
        );
      }
    }
  }

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

  await Promise.all([
    writeJson(
      bucket,
      categoryMetaKey,
      categoryMeta
    ),

    writeJson(
      bucket,
      collectionsKey,
      collections
    ),
  ]);

  updatedFiles.push(
    categoryMetaKey,
    collectionsKey
  );

  /*
   * ------------------------------------------------
   * FILTER INDEX
   * ------------------------------------------------
   *
   * Rebuild brands from the updated catalogue.
   */
  const filterIndexKey =
    "catalog/indexes/filter-index.json";

  const existingFilter =
    (await readJson(
      bucket,
      filterIndexKey
    )) || {};

  const brandCounts =
    new Map<string, number>();

  for (
    const item
    of nextCatalog
  ) {
    const vendor =
      clean(item?.vendor);

    if (!vendor) {
      continue;
    }

    brandCounts.set(
      vendor,
      (
        brandCounts.get(
          vendor
        ) || 0
      ) + 1
    );
  }

  const brands =
    Array.from(
      brandCounts.entries()
    )
      .map(
        ([title, count]) => ({
          handle: title,
          title,
          count,
        })
      )
      .sort(
        (a, b) =>
          a.title.localeCompare(
            b.title
          )
      );

  await writeJson(
    bucket,
    filterIndexKey,
    {
      ...existingFilter,

      categories:
        collections,

      brands,
    }
  );

  updatedFiles.push(
    filterIndexKey
  );

  /*
   * ------------------------------------------------
   * SEARCH V2
   * ------------------------------------------------
   */
  const searchResult =
    await syncSearchV2(
      bucket,
      existingProduct,
      updatedProduct
    );

  updatedFiles.push(
    ...searchResult.updatedFiles
  );

  /*
   * ------------------------------------------------
   * HANDLE REGISTRY
   * ------------------------------------------------
   */
  const first =
    handle[0];

  const registryShard =
    first >= "0" &&
    first <= "9"
      ? first
      : first >= "a" &&
          first <= "z"
        ? first
        : "other";

  const registryKey =
    `catalog/handles/${registryShard}.json`;

  const registry =
    (await readJson(
      bucket,
      registryKey
    )) || {};

  registry[handle] = {
    handle,

    sources:
      updatedProduct?.sources ||
      existingProduct?.sources ||
      [],

    tags:
      newTags,

    updatedAt:
      new Date()
        .toISOString(),
  };

  await writeJson(
    bucket,
    registryKey,
    registry
  );

  updatedFiles.push(
    registryKey
  );

  /*
   * ------------------------------------------------
   * HOMEPAGE CURATED PRODUCTS
   * ------------------------------------------------
   */
  const curatedFiles = [
    "catalog/featured-products/featured-products.json",
    "catalog/popular-products/popular-products.json",
  ];

  for (
    const key
    of curatedFiles
  ) {
    const data =
      await readJson(
        bucket,
        key
      );

    if (!Array.isArray(data)) {
      continue;
    }

    const result =
      replaceProduct(
        data,
        handle,
        summary
      );

    if (!result.changed) {
      continue;
    }

    await writeJson(
      bucket,
      key,
      result.products
    );

    updatedFiles.push(key);
  }

  /*
   * ------------------------------------------------
   * STATS
   * ------------------------------------------------
   *
   * Product count does not change during an edit.
   * Only variant count may change.
   */
  const oldVariantCount =
    Array.isArray(
      existingProduct?.variants
    )
      ? existingProduct
          .variants.length
      : 0;

  const newVariantCount =
    Array.isArray(
      updatedProduct?.variants
    )
      ? updatedProduct
          .variants.length
      : 0;

  if (
    oldVariantCount !==
    newVariantCount
  ) {
    const statsKey =
      "catalog/indexes/stats.json";

    const stats =
      (await readJson(
        bucket,
        statsKey
      )) || {};

    await writeJson(
      bucket,
      statsKey,
      {
        ...stats,

        variants:
          Math.max(
            0,
            Number(
              stats?.variants || 0
            ) -
              oldVariantCount +
              newVariantCount
          ),

        collections:
          collections.length,
      }
    );

    updatedFiles.push(
      statsKey
    );
  }

  return {
    summary,

    updatedFiles:
      unique(updatedFiles),
  };
}

/*
 * Bulk creation used by Admin Excel Import.
 *
 * Unlike createNewProduct(), this reads and
 * rewrites the global catalogue structures
 * once for the whole batch.
 */
export async function createNewProductsBulk(
  bucket: R2BucketLike,
  products: any[]
) {
  if (!Array.isArray(products) || !products.length) {
    throw new Error(
      "No products were supplied for import."
    );
  }

  const normalizedProducts = products.map(
    (product) => ({
      ...product,

      handle:
        clean(product?.handle)
          .toLowerCase(),

      tags:
        unique(product?.tags || [])
          .map(slugify)
          .filter(Boolean),
    })
  );

  const incomingHandles =
    new Set<string>();

  for (const product of normalizedProducts) {
    if (!product.handle) {
      throw new Error(
        "Every imported product requires a handle."
      );
    }

    if (!product.tags.length) {
      throw new Error(
        `Product "${product.handle}" requires at least one tag.`
      );
    }

    if (incomingHandles.has(product.handle)) {
      throw new Error(
        `Duplicate handle "${product.handle}" exists inside the import.`
      );
    }

    incomingHandles.add(product.handle);
  }

  const updatedFiles: string[] = [];

  /*
   * --------------------------------
   * CURRENT CATALOGUE
   * --------------------------------
   */

  const catalogMetaKey =
    "catalog/indexes/catalog-meta.json";

  const catalogIndexKey =
    "catalog/indexes/catalog-index.json";

  const catalogMeta =
    (await readJson(
      bucket,
      catalogMetaKey
    )) || {};

  const catalogPageSize =
    Number(
      catalogMeta?.pageSize || 24
    );

  const catalogTotalPages =
    Number(
      catalogMeta?.totalPages || 0
    );

  const existingCatalog =
    await readPagedItems(
      bucket,
      "catalog/indexes/catalog-pages",
      catalogTotalPages
    );

  const existingHandles =
    new Set(
      existingCatalog
        .map((item: any) =>
          clean(item?.handle)
            .toLowerCase()
        )
        .filter(Boolean)
    );

  const skipped: string[] = [];

  const newProducts =
    normalizedProducts.filter(
      (product) => {
        if (
          existingHandles.has(
            product.handle
          )
        ) {
          skipped.push(
            product.handle
          );

          return false;
        }

        return true;
      }
    );

  if (!newProducts.length) {
    return {
      imported: [],
      skipped,
      updatedFiles: [],
    };
  }

  const newSummaries =
    newProducts.map(
      summarizeProduct
    );

  const nextCatalog =
    sortSummaries([
      ...existingCatalog,
      ...newSummaries,
    ]);

  /*
   * --------------------------------
   * FULL CATALOGUE
   * --------------------------------
   */

  await writeJson(
    bucket,
    catalogIndexKey,
    nextCatalog
  );

  updatedFiles.push(
    catalogIndexKey
  );

  const catalogPagesResult =
    await writePagedItems(
      bucket,
      "catalog/indexes/catalog-pages",
      nextCatalog,
      catalogPageSize
    );

  updatedFiles.push(
    ...catalogPagesResult.updatedFiles
  );

  await writeJson(
    bucket,
    catalogMetaKey,
    {
      ...catalogMeta,

      totalProducts:
        nextCatalog.length,

      pageSize:
        catalogPageSize,

      totalPages:
        catalogPagesResult.totalPages,
    }
  );

  updatedFiles.push(
    catalogMetaKey
  );

  /*
   * --------------------------------
   * COLLECTIONS / TAGS
   * --------------------------------
   */

  const categoryMetaKey =
    "catalog/indexes/category-meta.json";

  const collectionsKey =
    "catalog/indexes/collections.json";

  const filterIndexKey =
    "catalog/indexes/filter-index.json";

  const categoryMeta =
    (await readJson(
      bucket,
      categoryMetaKey
    )) || {};

  const collectionsRaw =
    await readJson(
      bucket,
      collectionsKey
    );

  const collections =
    Array.isArray(collectionsRaw)
      ? [...collectionsRaw]
      : [];

  const productsByTag =
    new Map<string, any[]>();

  for (const product of newProducts) {
    const summary =
      summarizeProduct(product);

    for (const tag of product.tags) {
      if (!productsByTag.has(tag)) {
        productsByTag.set(
          tag,
          []
        );
      }

      productsByTag
        .get(tag)!
        .push(summary);
    }
  }

  for (
    const [tag, summaries]
    of productsByTag.entries()
  ) {
    const oldMeta =
      categoryMeta?.[tag] || {};

    const pageSize =
      Number(
        oldMeta?.pageSize || 24
      );

    const totalPages =
      Number(
        oldMeta?.totalPages || 0
      );

    const currentItems =
      totalPages > 0
        ? await readPagedItems(
          bucket,
          `catalog/indexes/category-pages/${tag}`,
          totalPages
        )
        : [];

    const currentHandles =
      new Set(
        currentItems
          .map((item: any) =>
            clean(item?.handle)
              .toLowerCase()
          )
          .filter(Boolean)
      );

    const additions =
      summaries.filter(
        (summary) =>
          !currentHandles.has(
            clean(
              summary?.handle
            ).toLowerCase()
          )
      );

    const nextItems =
      sortSummaries([
        ...currentItems,
        ...additions,
      ]);

    const pageResult =
      await writePagedItems(
        bucket,
        `catalog/indexes/category-pages/${tag}`,
        nextItems,
        pageSize
      );

    updatedFiles.push(
      ...pageResult.updatedFiles
    );

    categoryMeta[tag] = {
      totalProducts:
        nextItems.length,

      pageSize,

      totalPages:
        pageResult.totalPages,
    };

    const collectionIndex =
      collections.findIndex(
        (item: any) =>
          slugify(
            item?.handle
          ) === tag
      );

    const collectionEntry = {
      title:
        titleFromHandle(tag),

      handle:
        tag,

      count:
        nextItems.length,
    };

    if (
      collectionIndex >= 0
    ) {
      collections[
        collectionIndex
      ] = {
        ...collections[
        collectionIndex
        ],

        ...collectionEntry,
      };
    } else {
      collections.push(
        collectionEntry
      );
    }
  }

  collections.sort(
    (a: any, b: any) =>
      String(a?.title || "")
        .localeCompare(
          String(b?.title || "")
        )
  );

  await writeJson(
    bucket,
    categoryMetaKey,
    categoryMeta
  );

  await writeJson(
    bucket,
    collectionsKey,
    collections
  );

  updatedFiles.push(
    categoryMetaKey,
    collectionsKey
  );

  /*
   * --------------------------------
   * FILTER INDEX
   * --------------------------------
   */

  const existingFilter =
    (await readJson(
      bucket,
      filterIndexKey
    )) || {};

  const brandCounts =
    new Map<string, number>();

  for (const item of nextCatalog) {
    const vendor =
      clean(item?.vendor);

    if (!vendor) continue;

    brandCounts.set(
      vendor,
      (
        brandCounts.get(vendor) ||
        0
      ) + 1
    );
  }

  const brands =
    Array.from(
      brandCounts.entries()
    )
      .map(
        ([title, count]) => ({
          handle: title,
          title,
          count,
        })
      )
      .sort(
        (a, b) =>
          a.title.localeCompare(
            b.title
          )
      );

  await writeJson(
    bucket,
    filterIndexKey,
    {
      ...existingFilter,

      categories:
        collections,

      brands,
    }
  );

  updatedFiles.push(
    filterIndexKey
  );

  /*
   * --------------------------------
   * SEARCH V2
   * --------------------------------
   */

  const searchByPrefix =
    new Map<
      string,
      {
        handle: string;
        item: any;
      }[]
    >();

  for (const product of newProducts) {
    const search =
      buildSearchV2(product);

    for (
      const prefix
      of search.prefixes
    ) {
      if (
        !searchByPrefix.has(
          prefix
        )
      ) {
        searchByPrefix.set(
          prefix,
          []
        );
      }

      searchByPrefix
        .get(prefix)!
        .push({
          handle:
            product.handle,

          item:
            search.item,
        });
    }
  }

  for (
    const [prefix, additions]
    of searchByPrefix.entries()
  ) {
    const key =
      `catalog/search-v2/${prefix}.json`;

    const current =
      await readJson(
        bucket,
        key
      );

    const shard =
      Array.isArray(current)
        ? [...current]
        : [];

    const additionHandles =
      new Set(
        additions.map(
          (item) =>
            item.handle
        )
      );

    const nextShard =
      shard.filter(
        (item: any) =>
          !additionHandles.has(
            clean(
              item?.h
            ).toLowerCase()
          )
      );

    for (
      const addition
      of additions
    ) {
      nextShard.push(
        addition.item
      );
    }

    nextShard.sort(
      (a: any, b: any) =>
        String(a?.t || "")
          .localeCompare(
            String(b?.t || "")
          )
    );

    await writeJson(
      bucket,
      key,
      nextShard
    );

    updatedFiles.push(key);
  }

  /*
   * --------------------------------
   * HANDLE REGISTRY
   * --------------------------------
   */

  const registryGroups =
    new Map<string, any[]>();

  for (const product of newProducts) {
    const first =
      product.handle[0];

    const shard =
      first >= "0" &&
        first <= "9"
        ? first
        : first >= "a" &&
          first <= "z"
          ? first
          : "other";

    if (
      !registryGroups.has(
        shard
      )
    ) {
      registryGroups.set(
        shard,
        []
      );
    }

    registryGroups
      .get(shard)!
      .push(product);
  }

  for (
    const [shard, shardProducts]
    of registryGroups.entries()
  ) {
    const key =
      `catalog/handles/${shard}.json`;

    const registry =
      (await readJson(
        bucket,
        key
      )) || {};

    for (
      const product
      of shardProducts
    ) {
      registry[
        product.handle
      ] = {
        handle:
          product.handle,

        sources:
          product.sources || [],

        tags:
          product.tags,

        updatedAt:
          new Date()
            .toISOString(),
      };
    }

    await writeJson(
      bucket,
      key,
      registry
    );

    updatedFiles.push(key);
  }

  /*
   * --------------------------------
   * STATS
   * --------------------------------
   */

  const statsKey =
    "catalog/indexes/stats.json";

  const stats =
    (await readJson(
      bucket,
      statsKey
    )) || {};

  const addedVariants =
    newProducts.reduce(
      (
        total,
        product
      ) =>
        total +
        (
          Array.isArray(
            product?.variants
          )
            ? product.variants.length
            : 0
        ),
      0
    );

  await writeJson(
    bucket,
    statsKey,
    {
      ...stats,

      products:
        nextCatalog.length,

      variants:
        Number(
          stats?.variants || 0
        ) +
        addedVariants,

      collections:
        collections.length,
    }
  );

  updatedFiles.push(
    statsKey
  );

  return {
    imported:
      newProducts.map(
        (product) =>
          product.handle
      ),

    skipped,

    updatedFiles:
      unique(updatedFiles),
  };
}