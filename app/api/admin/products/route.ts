import {
    getRequestContext,
} from "@cloudflare/next-on-pages";

import {
    createNewProduct,
    type R2BucketLike,
} from "@/lib/admin/product-sync";

import {
    normalizeAdminProduct,
    productKey,
    productKeys,
    validateAdminProduct,
} from "@/lib/admin/product-normalize";

export const runtime = "edge";

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

export async function POST(
    request: Request
) {
    try {
        const body =
            await request.json();

        if (
            !body ||
            typeof body !== "object"
        ) {
            return Response.json(
                {
                    success: false,
                    error:
                        "Invalid product data.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Normalize every admin-created
         * product through the same model used
         * by Excel import and the editor.
         */
        const product =
            normalizeAdminProduct(
                body,
                {
                    source:
                        "admin",
                }
            );

        const validationError =
            validateAdminProduct(
                product
            );

        if (validationError) {
            return Response.json(
                {
                    success: false,
                    error:
                        validationError,
                },
                {
                    status: 400,
                }
            );
        }

        const bucket =
            getBucket();

        const key =
            productKey(
                product.handle
            );

        /*
         * Never overwrite an existing product.
         *
         * Check both the current canonical path
         * and the legacy admin path.
         */
        const possibleKeys =
            productKeys(
                product.handle
            );

        for (const existingKey of possibleKeys) {
            const existing =
                await bucket.get(
                    existingKey
                );

            if (existing) {
                return Response.json(
                    {
                        error:
                            `Product "${product.handle}" already exists.`,
                    },
                    {
                        status: 409,
                    }
                );
            }
        }

        /*
         * Add provenance only after
         * normalization so the source array
         * remains additive metadata.
         */
        product.sources = [
            {
                source:
                    "admin",

                createdAt:
                    new Date()
                        .toISOString(),
            },
        ];

        /*
         * IMPORTANT:
         *
         * Write the master product first.
         *
         * Public catalogue/search
         * synchronization may create
         * references to this handle, so the
         * PDP source must already exist.
         */
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

        let syncResult;

        try {
            syncResult =
                await createNewProduct(
                    bucket,
                    product
                );
        } catch (error) {
            /*
             * Deliberately keep the master
             * JSON if synchronization fails.
             *
             * That is safer than creating
             * catalogue/search references to
             * a product whose PDP source does
             * not exist.
             */
            throw error;
        }

        return Response.json({
            success: true,

            message:
                "Product created successfully.",

            handle:
                product.handle,

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
                success: false,

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