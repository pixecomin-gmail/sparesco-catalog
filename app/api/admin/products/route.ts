import {
    getRequestContext,
} from "@cloudflare/next-on-pages";

import {
    createNewProduct,
    type R2BucketLike,
} from "@/lib/admin/product-sync";

export const runtime = "edge";

function clean(value: unknown) {
    return String(
        value ?? ""
    ).trim();
}

function slugify(value: unknown) {
    return String(value || "")
        .trim()
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

    return (
        Math.abs(hash)
            .toString(16)
            .padStart(2, "0")
            .slice(0, 2)
    );
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

export async function POST(
    request: Request
) {
    try {
        const body =
            await request.json();

        const title =
            clean(body?.title);

        const handle =
            slugify(body?.handle);

        const tags =
            unique(
                (
                    Array.isArray(body?.tags)
                        ? body.tags
                        : []
                )
                    .map(slugify)
                    .filter(Boolean)
            );

        const category =
            slugify(
                body?.category
            );

        const variants =
            Array.isArray(
                body?.variants
            )
                ? body.variants
                : [];

        if (!title) {
            return Response.json(
                {
                    error:
                        "Product title is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!handle) {
            return Response.json(
                {
                    error:
                        "Product handle is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!tags.length) {
            return Response.json(
                {
                    error:
                        "Add at least one tag / collection.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!variants.length) {
            return Response.json(
                {
                    error:
                        "Add at least one variant.",
                },
                {
                    status: 400,
                }
            );
        }

        for (
            let index = 0;
            index < variants.length;
            index++
        ) {
            const variant =
                variants[index];

            if (
                !clean(
                    variant?.partNumber
                )
            ) {
                return Response.json(
                    {
                        error:
                            `Variant ${index + 1}: ` +
                            `Part number is required.`,
                    },
                    {
                        status: 400,
                    }
                );
            }

            if (
                !clean(
                    variant?.title
                )
            ) {
                return Response.json(
                    {
                        error:
                            `Variant ${index + 1}: ` +
                            `title is required.`,
                    },
                    {
                        status: 400,
                    }
                );
            }
        }

        const primaryCollection =
            tags[0];

        const product = {
            handle,
            canonicalKey:
                handle,

            title,

            collection:
                primaryCollection,

            category:
                category ||
                primaryCollection,

            imageFolder:
                primaryCollection,

            tags,

            images:
                Array.isArray(
                    body?.images
                )
                    ? body.images
                        .map(clean)
                        .filter(Boolean)
                    : [],

            variants:
                variants.map(
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
                                variant
                                    ?.specifications
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
                                variant
                                    ?.shippingVolume
                            ),
                    })
                ),

            sources: [
                {
                    source:
                        "admin",

                    createdAt:
                        new Date()
                            .toISOString(),
                },
            ],
        };

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

        const key =
            productKey(handle);

        /*
         * Never overwrite an existing
         * master product.
         */
        const existing =
            await bucket.get(key);

        if (existing) {
            return Response.json(
                {
                    error:
                        `Product "${handle}" already exists.`,
                },
                {
                    status: 409,
                }
            );
        }

        /*
         * Synchronize catalogue indexes
         * before committing the master
         * product JSON.
         */
        const syncResult =
            await createNewProduct(
                bucket,
                product
            );

        await bucket.put(
            key,
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

        return Response.json({
            success: true,

            message:
                "Product created successfully.",

            handle,

            key,

            product,

            synchronizedFiles:
                syncResult.updatedFiles,
        });
    } catch (error) {
        console.error(
            "Create admin product failed:",
            error
        );

        return Response.json(
            {
                error:
                    "Failed to create product.",

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