import {
  getRequestContext,
} from "@cloudflare/next-on-pages";

import {
  deleteProduct,
  syncExistingProduct,
  type R2BucketLike,
} from "@/lib/admin/product-sync";

import {
  normalizeAdminProduct,
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

function safeHandle(
  value: unknown
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase();
}

async function findProductObject(
  bucket: R2BucketLike,
  handle: string
) {
  const keys =
    productKeys(handle);

  for (const key of keys) {
    const object =
      await bucket.get(key);

    if (object) {
      return {
        key,
        object,
      };
    }
  }

  return null;
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      handle: string;
    }>;
  }
) {
  try {
    const { handle } =
      await context.params;

    const handleValue =
      safeHandle(handle);

    if (!handleValue) {
      return Response.json(
        {
          success: false,
          error:
            "Missing product handle.",
        },
        {
          status: 400,
        }
      );
    }

    const bucket =
      getBucket();

    const found =
      await findProductObject(
        bucket,
        handleValue
      );

    if (!found) {
      return Response.json(
        {
          success: false,
          error:
            "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    const {
      key,
      object,
    } = found;

    const rawProduct =
      JSON.parse(
        await object.text()
      );

    /*
     * Normalize on read so older products
     * that only contain the original
     * Sparesco fields can immediately be
     * edited by the expanded admin UI.
     *
     * This does NOT write anything to R2.
     */
    const product =
      normalizeAdminProduct(
        rawProduct,
        {
          existing:
            rawProduct,
        }
      );

    return Response.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "Admin product GET error:",
      error
    );

    return Response.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to load product.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  request: Request,
  context: {
    params: Promise<{
      handle: string;
    }>;
  }
) {
  try {
    const { handle } =
      await context.params;

    const handleValue =
      safeHandle(handle);

    if (!handleValue) {
      return Response.json(
        {
          success: false,
          error:
            "Missing product handle.",
        },
        {
          status: 400,
        }
      );
    }

    const incoming =
      await request.json();

    if (
      !incoming ||
      typeof incoming !==
      "object"
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
     * Product handles remain immutable.
     */
    if (
      incoming.handle &&
      safeHandle(
        incoming.handle
      ) !== handleValue
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Product handle cannot be changed.",
        },
        {
          status: 400,
        }
      );
    }

    const bucket =
      getBucket();

    const found =
      await findProductObject(
        bucket,
        handleValue
      );

    if (!found) {
      return Response.json(
        {
          success: false,
          error:
            "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    const {
      key,
      object: existingObject,
    } = found;

    const existing =
      JSON.parse(
        await existingObject.text()
      );

    /*
     * Merge first so fields not exposed by
     * the current editor are not silently
     * destroyed.
     */
    const merged = {
      ...existing,
      ...incoming,

      handle:
        handleValue,

      canonicalKey:
        existing
          .canonicalKey ||
        handleValue,

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
        }
      );

    /*
     * Explicitly preserve the immutable
     * handle/canonical identity.
     */
    product.handle =
      handleValue;

    product.canonicalKey =
      existing
        .canonicalKey ||
      handleValue;

    product.sources =
      existing.sources ||
      product.sources ||
      [];

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

    /*
     * Synchronize catalogue/search/
     * collection structures before
     * replacing the master JSON.
     *
     * If synchronization fails, the
     * master product remains unchanged.
     */
    const syncResult =
      await syncExistingProduct(
        bucket,
        existing,
        product
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

    return Response.json({
      success: true,

      message:
        "Product saved.",

      handle:
        handleValue,

      key,

      product,

      synchronizedFiles:
        syncResult.updatedFiles,
    });
  } catch (error) {
    console.error(
      "Admin product PUT error:",
      error
    );

    return Response.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to save product.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      handle: string;
    }>;
  }
) {
  try {
    const { handle } =
      await context.params;

    const handleValue =
      safeHandle(handle);

    if (!handleValue) {
      return Response.json(
        {
          success: false,
          error:
            "Missing product handle.",
        },
        {
          status: 400,
        }
      );
    }

    const bucket =
      getBucket();

    let fallbackProduct:
      any = null;

    try {
      fallbackProduct =
        await request.json();
    } catch {
      fallbackProduct =
        null;
    }

    /*
     * Remove all catalogue/search/
     * collection/index references using
     * the existing synchronization engine.
     */
    const result =
      await deleteProduct(
        bucket,
        handleValue,
        fallbackProduct
      );

    /*
* Then remove every possible master JSON.
*
* Normally only one exists, but deleting both
* prevents an old legacy copy from surviving.
*/
    const keys =
      productKeys(
        handleValue
      );

    for (const key of keys) {
      await bucket.delete(key);
    }

    return Response.json({
      success: true,

      message:
        `Product "${handleValue}" deleted.`,

      handle:
        handleValue,

      synchronizedFiles:
        result.updatedFiles,
    });
  } catch (error) {
    console.error(
      "Admin product DELETE error:",
      error
    );

    return Response.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to delete product.",
      },
      {
        status: 500,
      }
    );
  }
}