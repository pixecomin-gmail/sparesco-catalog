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

type ProgressEvent = {
    stage: string;
    status: "started" | "completed" | "failed";
    message: string;
    handle?: string;
    synchronizedFiles?: string[];
};

function progressResponse(
    stream: ReadableStream<Uint8Array>
) {
    return new Response(stream, {
        status: 200,
        headers: {
            "Content-Type":
                "application/x-ndjson; charset=utf-8",
            "Cache-Control":
                "no-cache, no-transform",
            "X-Content-Type-Options":
                "nosniff",
        },
    });
}

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
    let body: any;

    try {
        body = await request.json();
    } catch {
        return Response.json(
            {
                success: false,
                error: "Invalid JSON request.",
            },
            { status: 400 }
        );
    }

    if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
    ) {
        return Response.json(
            {
                success: false,
                error: "Invalid product data.",
            },
            { status: 400 }
        );
    }

    const retrySync =
        body.retrySync === true;

    const retryHandle =
        String(body.handle || "")
            .trim()
            .toLowerCase();

    let product: any;

    try {
        product = normalizeAdminProduct(
            body,
            { source: "admin" }
        );

        const validationError =
            retrySync
                ? ""
                : validateAdminProduct(product);

        if (validationError) {
            return Response.json(
                {
                    success: false,
                    error: validationError,
                },
                { status: 400 }
            );
        }
    } catch (error) {
        return Response.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Invalid product data.",
            },
            { status: 400 }
        );
    }

    const encoder =
        new TextEncoder();

    const stream =
        new ReadableStream<Uint8Array>({
            async start(controller) {
                let currentStage =
                    "initialization";

                let masterSaved = false;

                const emit = (
                    event: ProgressEvent
                ) => {
                    controller.enqueue(
                        encoder.encode(
                            JSON.stringify(event) +
                            "\n"
                        )
                    );
                };

                const started = (
                    stage: string,
                    message: string
                ) => {
                    currentStage = stage;

                    emit({
                        stage,
                        status: "started",
                        message,
                        handle: product.handle,
                    });
                };

                const completed = (
                    stage: string,
                    message: string
                ) => {
                    emit({
                        stage,
                        status: "completed",
                        message,
                        handle: product.handle,
                    });
                };

                try {
                    started(
                        "master",
                        "Checking product record."
                    );

                    const bucket =
                        getBucket();

                    const key =
                        productKey(
                            product.handle
                        );

                    const possibleKeys =
                        productKeys(
                            product.handle
                        );

                    let existingKey:
                        | string
                        | null = null;

                    let existingProduct:
                        | any
                        | null = null;

                    for (
                        const candidate
                        of possibleKeys
                    ) {
                        const object =
                            await bucket.get(
                                candidate
                            );

                        if (object) {
                            existingKey =
                                candidate;

                            existingProduct =
                                JSON.parse(
                                    await object.text()
                                );

                            break;
                        }
                    }

                    if (existingProduct) {
                        if (!retrySync) {
                            throw new Error(
                                `Product "${product.handle}" already exists.`
                            );
                        }

                        const savedHandle =
                            String(existingProduct.handle || "")
                                .trim()
                                .toLowerCase();

                        const createdByAdmin =
                            Array.isArray(existingProduct.sources) &&
                            existingProduct.sources.some(
                                (source: any) =>
                                    source?.source === "admin"
                            );

                        if (
                            !retryHandle ||
                            savedHandle !== retryHandle ||
                            !createdByAdmin
                        ) {
                            throw new Error(
                                "Synchronization retry rejected: product record does not match an admin-created product."
                            );
                        }

                        /*
                         * Retry uses the saved
                         * master record, not the
                         * incoming form values.
                         *
                         * Never overwrite an
                         * existing product.
                         */
                        product =
                            existingProduct;
                        masterSaved = true;

                        completed(
                            "master",
                            "Existing product loaded for synchronization retry."
                        );
                    } else {
                        if (retrySync) {
                            throw new Error(
                                "Cannot retry synchronization: product master record was not found."
                            );
                        }

                        product.sources = [
                            {
                                source: "admin",
                                createdAt:
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

                        masterSaved = true;

                        completed(
                            "master",
                            "Product master record saved."
                        );
                    }

                    started(
                        "synchronization",
                        "Synchronizing catalogue indexes."
                    );

                    const syncResult =
                        await createNewProduct(
                            bucket,
                            product,
                            (stage) => {
                                const [
                                    name,
                                    state,
                                ] = stage.split(
                                    ":"
                                );

                                                                if (
                                    state ===
                                    "completed"
                                ) {
                                    completed(
                                        name,
                                        `${name} synchronized.`
                                    );

                                    const nextStage: Record<string, string> = {
                                        catalogue: "collections",
                                        collections: "filters",
                                        filters: "search",
                                        search: "registry",
                                        registry: "statistics",
                                        statistics: "finished",
                                    };

                                    currentStage =
                                        nextStage[name] || name;
                                }
                            }
                        );

                    emit({
                        stage: "finished",
                        status: "completed",
                        message:
                            "Product created and synchronized successfully.",
                        handle:
                            product.handle,
                        synchronizedFiles:
                            syncResult.updatedFiles,
                    });
                } catch (error) {
                    console.error(
                        "Create admin product failed:",
                        error
                    );

                    emit({
                        stage:
                            currentStage,
                        status: "failed",
                        message:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        handle:
                            product.handle,
                    });

                    /*
                     * A retry is allowed only
                     * after a master record
                     * has been saved.
                     */
                    if (masterSaved) {
                        emit({
                            stage:
                                "retry-available",
                            status: "completed",
                            message:
                                "Master product exists. Synchronization can be retried.",
                            handle:
                                product.handle,
                        });
                    }
                } finally {
                    controller.close();
                }
            },
        });

    return progressResponse(stream);
}