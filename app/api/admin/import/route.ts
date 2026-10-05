import {
    getRequestContext,
} from "@cloudflare/next-on-pages";

import {
    createNewProductsBulk,
    syncExistingProduct,
    type R2BucketLike,
} from "@/lib/admin/product-sync";

import {
    normalizeAdminProduct,
    productKey,
    productKeys,
    validateAdminProduct,
    type AdminProduct,
} from "@/lib/admin/product-normalize";

export const runtime = "edge";

type ImportResult = {
    created: string[];
    updated: string[];
    skipped: string[];
    errors: Array<{
        handle: string;
        error: string;
    }>;
};

function getBucket() {
    const context =
        getRequestContext();

    const env =
        context.env as unknown as {
            CATALOG_BUCKET?: R2BucketLike;
        };

    if (!env.CATALOG_BUCKET) {
        throw new Error(
            "CATALOG_BUCKET binding is not configured."
        );
    }

    return env.CATALOG_BUCKET;
}

function clean(
    value: unknown
) {
    return String(
        value ?? ""
    ).trim();
}

async function readJson(
    object: any
) {
    return JSON.parse(
        await object.text()
    );
}

export async function POST(
    request: Request
) {
    try {
        const body =
            await request.json();

        const rawProducts =
            Array.isArray(body)
                ? body
                : Array.isArray(
                    body?.products
                )
                    ? body.products
                    : [];

        if (!rawProducts.length) {
            return Response.json(
                {
                    success: false,
                    error:
                        "No products supplied for import.",
                },
                {
                    status: 400,
                }
            );
        }

        const bucket =
            getBucket();

        const result: ImportResult = {
            created: [],
            updated: [],
            skipped: [],
            errors: [],
        };

        /*
         * -------------------------------------------------
         * NORMALIZE + VALIDATE
         * -------------------------------------------------
         */

        const normalizedProducts:
            AdminProduct[] = [];

        const seenHandles =
            new Set<string>();

        for (
            let index = 0;
            index <
            rawProducts.length;
            index++
        ) {
            const raw =
                rawProducts[index];

            try {
                const product =
                    normalizeAdminProduct(
                        raw,
                        {
                            source:
                                "excel",
                        }
                    );

                if (!product.handle) {
                    result.skipped.push(
                        `row-${index + 1}`
                    );

                    result.errors.push({
                        handle:
                            `row-${index + 1}`,

                        error:
                            "Missing product handle.",
                    });

                    continue;
                }

                /*
                 * The client parser should
                 * already combine repeated
                 * Shopify rows into one
                 * product.
                 *
                 * Protect the API from
                 * accidental duplicates
                 * anyway.
                 */
                if (
                    seenHandles.has(
                        product.handle
                    )
                ) {
                    result.skipped.push(
                        product.handle
                    );

                    result.errors.push({
                        handle:
                            product.handle,

                        error:
                            "Duplicate product handle in this import batch.",
                    });

                    continue;
                }

                seenHandles.add(
                    product.handle
                );

                const validationError =
                    validateAdminProduct(
                        product
                    );

                if (
                    validationError
                ) {
                    result.skipped.push(
                        product.handle
                    );

                    result.errors.push({
                        handle:
                            product.handle,

                        error:
                            validationError,
                    });

                    continue;
                }

                normalizedProducts.push(
                    product
                );
            } catch (error) {
                const handle =
                    clean(
                        raw?.handle
                    ) ||
                    `row-${index + 1}`;

                result.skipped.push(
                    handle
                );

                result.errors.push({
                    handle,

                    error:
                        error instanceof Error
                            ? error.message
                            : String(error),
                });
            }
        }

        if (
            !normalizedProducts.length
        ) {
            return Response.json(
                {
                    success: false,

                    createdCount: 0,
                    updatedCount: 0,
                    skippedCount:
                        result.skipped
                            .length,

                    created:
                        result.created,

                    updated:
                        result.updated,

                    skipped:
                        result.skipped,

                    errors:
                        result.errors,

                    error:
                        "No valid products were found in this import batch.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * -------------------------------------------------
         * CLASSIFY PRODUCTS
         * -------------------------------------------------
         *
         * Existing handle => UPDATE
         * Missing handle  => CREATE
         */

        const productsToCreate:
            AdminProduct[] = [];

        const productsToUpdate:
            Array<{
                key: string;
                existing: any;
                product: AdminProduct;
            }> = [];

        for (
            const incoming of
            normalizedProducts
        ) {
            try {
                let key = "";
                let existingObject:
                    any = null;

                const possibleKeys =
                    productKeys(
                        incoming.handle
                    );

                for (
                    const possibleKey of
                    possibleKeys
                ) {
                    const object =
                        await bucket.get(
                            possibleKey
                        );

                    if (object) {
                        key =
                            possibleKey;

                        existingObject =
                            object;

                        break;
                    }
                }

                if (!existingObject) {
                    productsToCreate.push(
                        incoming
                    );

                    continue;
                }

                const existing =
                    await readJson(
                        existingObject
                    );

                /*
                 * Merge existing first so
                 * unknown/additional catalogue
                 * metadata is not silently
                 * destroyed by Excel import.
                 */
                const merged = {
                    ...existing,
                    ...incoming,

                    handle:
                        existing.handle ||
                        incoming.handle,

                    canonicalKey:
                        existing
                            .canonicalKey ||
                        incoming
                            .canonicalKey ||
                        incoming.handle,

                    sources:
                        existing.sources ||
                        incoming.sources ||
                        [],
                };

                const product =
                    normalizeAdminProduct(
                        merged,
                        {
                            existing,
                            source:
                                "excel",
                        }
                    );

                product.handle =
                    incoming.handle;

                product.canonicalKey =
                    existing
                        .canonicalKey ||
                    incoming.handle;

                product.sources =
                    existing.sources ||
                    [];

                const validationError =
                    validateAdminProduct(
                        product
                    );

                if (
                    validationError
                ) {
                    result.skipped.push(
                        incoming.handle
                    );

                    result.errors.push({
                        handle:
                            incoming.handle,

                        error:
                            validationError,
                    });

                    continue;
                }

                productsToUpdate.push({
                    key,
                    existing,
                    product,
                });
            } catch (error) {
                result.skipped.push(
                    incoming.handle
                );

                result.errors.push({
                    handle:
                        incoming.handle,

                    error:
                        error instanceof Error
                            ? error.message
                            : String(error),
                });
            }
        }

        /*
         * -------------------------------------------------
         * UPDATE EXISTING PRODUCTS
         * -------------------------------------------------
         *
         * Synchronize first.
         *
         * Only replace the master JSON after
         * catalogue/search synchronization
         * succeeds.
         */

        for (
            const item of
            productsToUpdate
        ) {
            try {
                await syncExistingProduct(
                    bucket,
                    item.existing,
                    item.product
                );

                await bucket.put(
                    item.key,
                    JSON.stringify(
                        item.product
                    ),
                    {
                        httpMetadata: {
                            contentType:
                                "application/json",

                            cacheControl:
                                "public, max-age=300",
                        },
                    }
                );

                result.updated.push(
                    item.product.handle
                );
            } catch (error) {
                result.skipped.push(
                    item.product.handle
                );

                result.errors.push({
                    handle:
                        item.product
                            .handle,

                    error:
                        error instanceof Error
                            ? error.message
                            : String(error),
                });
            }
        }

        /*
         * -------------------------------------------------
         * CREATE NEW PRODUCTS
         * -------------------------------------------------
         *
         * IMPORTANT SAFETY CHANGE:
         *
         * The previous import flow called
         * createNewProductsBulk() before
         * writing the master product JSON.
         *
         * We now write the master JSON FIRST,
         * matching the safe single-product
         * creation flow.
         */

        const preparedCreates:
            AdminProduct[] = [];

        for (
            const product of
            productsToCreate
        ) {
            try {
                const key =
                    productKey(
                        product.handle
                    );

                /*
                 * Re-check immediately before
                 * writing in case a duplicate
                 * appeared between
                 * classification and commit.
                 */
                let existing:
                    any = null;

                const possibleKeys =
                    productKeys(
                        product.handle
                    );

                for (
                    const possibleKey of
                    possibleKeys
                ) {
                    const object =
                        await bucket.get(
                            possibleKey
                        );

                    if (object) {
                        existing =
                            object;

                        break;
                    }
                }

                if (existing) {
                    result.skipped.push(
                        product.handle
                    );

                    result.errors.push({
                        handle:
                            product.handle,

                        error:
                            "Product already exists.",
                    });

                    continue;
                }

                product.sources = [
                    {
                        source:
                            "excel",

                        importedAt:
                            new Date()
                                .toISOString(),
                    },
                ];

                await bucket.put(
                    key,
                    JSON.stringify(
                        product
                    ),
                    {
                        httpMetadata: {
                            contentType:
                                "application/json",

                            cacheControl:
                                "public, max-age=300",
                        },
                    }
                );

                preparedCreates.push(
                    product
                );
            } catch (error) {
                result.skipped.push(
                    product.handle
                );

                result.errors.push({
                    handle:
                        product.handle,

                    error:
                        error instanceof Error
                            ? error.message
                            : String(error),
                });
            }
        }

        /*
         * Bulk-sync only products whose
         * master JSON now exists.
         */
        if (
            preparedCreates.length
        ) {
            try {
                const createResult =
                    await createNewProductsBulk(
                        bucket,
                        preparedCreates
                    );

                /*
                 * product-sync returns created
                 * and skipped handles. Use its
                 * result when available.
                 */
                const createdHandles =
                    Array.isArray(
                        (
                            createResult as any
                        )?.imported
                    )
                        ? (
                            createResult as any
                        ).imported.map(
                            (
                                value: unknown
                            ) =>
                                clean(
                                    value
                                )
                        )
                        : preparedCreates.map(
                            (product) =>
                                product.handle
                        );

                const skippedHandles =
                    Array.isArray(
                        (
                            createResult as any
                        )?.skipped
                    )
                        ? (
                            createResult as any
                        ).skipped.map(
                            (
                                value: unknown
                            ) =>
                                clean(
                                    value
                                )
                        )
                        : [];

                for (
                    const product of
                    preparedCreates
                ) {
                    if (
                        skippedHandles.includes(
                            product.handle
                        )
                    ) {
                        result.skipped.push(
                            product.handle
                        );

                        result.errors.push({
                            handle:
                                product.handle,

                            error:
                                "Catalogue synchronization skipped this product.",
                        });

                        continue;
                    }

                    if (
                        createdHandles.includes(
                            product.handle
                        )
                    ) {
                        result.created.push(
                            product.handle
                        );

                        continue;
                    }

                    /*
                     * Some older
                     * createNewProductsBulk()
                     * implementations do not
                     * expose per-handle arrays.
                     *
                     * Successful completion
                     * still means these
                     * prepared products were
                     * processed.
                     */
                    result.created.push(
                        product.handle
                    );
                }
            } catch (error) {
                /*
                 * The master JSON deliberately
                 * remains available if bulk
                 * synchronization fails.
                 *
                 * Report each affected handle
                 * so the admin knows exactly
                 * what needs attention.
                 */
                for (
                    const product of
                    preparedCreates
                ) {
                    result.skipped.push(
                        product.handle
                    );

                    result.errors.push({
                        handle:
                            product.handle,

                        error:
                            error instanceof Error
                                ? error.message
                                : String(
                                    error
                                ),
                    });
                }
            }
        }

        /*
         * De-duplicate response arrays.
         */
        result.created =
            Array.from(
                new Set(
                    result.created
                )
            );

        result.updated =
            Array.from(
                new Set(
                    result.updated
                )
            );

        result.skipped =
            Array.from(
                new Set(
                    result.skipped
                )
            ).filter(
                (handle) =>
                    !result.created.includes(
                        handle
                    ) &&
                    !result.updated.includes(
                        handle
                    )
            );

        return Response.json({
            success:
                result.created.length >
                0 ||
                result.updated.length >
                0,

            createdCount:
                result.created.length,

            updatedCount:
                result.updated.length,

            skippedCount:
                result.skipped.length,

            created:
                result.created,

            updated:
                result.updated,

            skipped:
                result.skipped,

            errors:
                result.errors,
        });
    } catch (error) {
        console.error(
            "Admin Excel import failed:",
            error
        );

        return Response.json(
            {
                success: false,

                createdCount: 0,
                updatedCount: 0,
                skippedCount: 0,

                created: [],
                updated: [],
                skipped: [],

                error:
                    error instanceof Error
                        ? error.message
                        : "Excel import failed.",
            },
            {
                status: 500,
            }
        );
    }
}