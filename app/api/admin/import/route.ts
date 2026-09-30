import {
    getRequestContext,
} from "@cloudflare/next-on-pages";

import {
    createNewProductsBulk,
    type R2BucketLike,
} from "@/lib/admin/product-sync";

export const runtime = "edge";

function clean(value: unknown) {
    return String(
        value ?? ""
    ).trim();
}

function slugify(value: unknown) {
    return clean(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function unique(
    values: string[]
) {
    return Array.from(
        new Set(values)
    );
}

function productFolder(
    handle: string
) {
    let hash = 0;

    for (
        let index = 0;
        index < handle.length;
        index++
    ) {
        hash =
            (
                (hash << 5) -
                hash +
                handle.charCodeAt(index)
            ) | 0;
    }

    return Math.abs(hash)
        .toString(16)
        .padStart(2, "0")
        .slice(0, 2);
}

function productKey(
    handle: string
) {
    return (
        `catalog/products/` +
        `${productFolder(handle)}/` +
        `${handle}.json`
    );
}

function normalizeProduct(
    raw: any
) {
    const handle =
        slugify(raw?.handle);

    const title =
        clean(raw?.title);

    const tags =
        unique(
            (
                Array.isArray(raw?.tags)
                    ? raw.tags
                    : []
            )
                .map(slugify)
                .filter(Boolean)
        );

    const primaryCollection =
        tags[0] || "";

    const variants =
        (
            Array.isArray(raw?.variants)
                ? raw.variants
                : []
        ).map(
            (variant: any) => ({
                title:
                    clean(
                        variant?.title
                    ),

                option1Value:
                    clean(
                        variant?.option1Value
                    ),

                image:
                    clean(
                        variant?.image
                    ),

                vendor:
                    clean(
                        variant?.vendor
                    ),

                price:
                    Number(
                        variant?.price || 0
                    ),

                partNumber:
                    clean(
                        variant?.partNumber
                    ),

                hsCode:
                    clean(
                        variant?.hsCode
                    ),

                countryOfOrigin:
                    clean(
                        variant?.countryOfOrigin
                    ),

                description:
                    clean(
                        variant?.description
                    ),

                specifications:
                    Array.isArray(
                        variant?.specifications
                    )
                        ? variant
                            .specifications
                            .map(clean)
                            .filter(Boolean)
                        : [],

                unitWeight:
                    clean(
                        variant?.unitWeight
                    ),

                shippingVolume:
                    clean(
                        variant?.shippingVolume
                    ),
            })
        );

    const images =
        unique(
            (
                Array.isArray(raw?.images)
                    ? raw.images
                    : []
            )
                .map(clean)
                .filter(Boolean)
        );

    return {
        handle,

        canonicalKey:
            handle,

        title,

        collection:
            primaryCollection,

        category:
            slugify(
                raw?.category
            ) ||
            primaryCollection,

        imageFolder:
            primaryCollection,

        tags,

        images,

        variants,

        sources: [
            {
                source:
                    "admin-excel",

                excelFile:
                    clean(
                        raw?.excelFile
                    ),

                importedAt:
                    new Date()
                        .toISOString(),
            },
        ],
    };
}

export async function POST(
    request: Request
) {
    try {
        const body =
            await request.json();

        const rawProducts =
            Array.isArray(
                body?.products
            )
                ? body.products
                : [];

        if (!rawProducts.length) {
            return Response.json(
                {
                    error:
                        "No products were supplied.",
                },
                {
                    status: 400,
                }
            );
        }

        const products =
            rawProducts.map(
                normalizeProduct
            );

        for (
            let index = 0;
            index < products.length;
            index++
        ) {
            const product =
                products[index];

            if (!product.handle) {
                return Response.json(
                    {
                        error:
                            `Product ${index + 1}: ` +
                            `handle is required.`,
                    },
                    {
                        status: 400,
                    }
                );
            }

            if (!product.title) {
                return Response.json(
                    {
                        error:
                            `${product.handle}: ` +
                            `title is required.`,
                    },
                    {
                        status: 400,
                    }
                );
            }

            if (!product.tags.length) {
                return Response.json(
                    {
                        error:
                            `${product.handle}: ` +
                            `at least one tag / collection is required.`,
                    },
                    {
                        status: 400,
                    }
                );
            }

            if (!product.variants.length) {
                return Response.json(
                    {
                        error:
                            `${product.handle}: ` +
                            `at least one variant is required.`,
                    },
                    {
                        status: 400,
                    }
                );
            }

            for (
                let variantIndex = 0;
                variantIndex <
                product.variants.length;
                variantIndex++
            ) {
                const variant =
                    product.variants[
                    variantIndex
                    ];

                if (
                    !variant.partNumber
                ) {
                    return Response.json(
                        {
                            error:
                                `${product.handle}, variant ` +
                                `${variantIndex + 1}: ` +
                                `part number is required.`,
                        },
                        {
                            status: 400,
                        }
                    );
                }

                if (!variant.title) {
                    return Response.json(
                        {
                            error:
                                `${product.handle}, variant ` +
                                `${variantIndex + 1}: ` +
                                `title is required.`,
                        },
                        {
                            status: 400,
                        }
                    );
                }
            }
        }

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

        const bucket =
            env.CATALOG_BUCKET;

        /*
         * Check master product JSON first.
         * Never overwrite an existing product.
         */
        const existingMasterHandles: string[] =
            [];

        const productsToImport: typeof products =
            [];

        for (const product of products) {
            const existingMaster =
                await bucket.get(
                    productKey(
                        product.handle
                    )
                );

            if (existingMaster) {
                existingMasterHandles.push(
                    product.handle
                );
            } else {
                productsToImport.push(
                    product
                );
            }
        }

        const result =
            productsToImport.length
                ? await createNewProductsBulk(
                    bucket,
                    productsToImport
                )
                : {
                    imported: [] as string[],
                    skipped: [] as string[],
                    updatedFiles: [] as string[],
                };

        const allSkipped =
            unique([
                ...existingMasterHandles,
                ...result.skipped,
            ]);

        const importedSet =
            new Set(
                result.imported
            );

        /*
         * Write master product JSON only for
         * products accepted by the bulk sync.
         */
        const importedProducts =
            products.filter(
                (product: ReturnType<typeof normalizeProduct>) =>
                    importedSet.has(
                        product.handle
                    )
            );

        for (
            const product
            of importedProducts
        ) {
            const key =
                productKey(
                    product.handle
                );

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
        }

        return Response.json({
            success: true,

            imported:
                result.imported,
            skipped:
                allSkipped,

            importedCount:
                result.imported.length,

            skippedCount:
                allSkipped.length,

            synchronizedFiles:
                result.updatedFiles,
        });
    } catch (error) {
        console.error(
            "Excel product import failed:",
            error
        );

        return Response.json(
            {
                error:
                    "Failed to import products.",

                message:
                    error instanceof Error
                        ? error.message
                        : String(error),
            },
            {
                status: 500,
            }
        );
    }
}