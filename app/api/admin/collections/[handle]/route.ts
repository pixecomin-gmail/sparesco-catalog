import {
  getRequestContext,
} from "@cloudflare/next-on-pages";

import {
  type R2BucketLike,
} from "@/lib/admin/product-sync";

import {
  addProductToCollection,
  deleteCollection,
  finalizeCollectionMigration,
  getCollection,
  getCollectionProducts,
  migrateCollectionProduct,
  prepareCollectionMigration,
  removeProductFromCollection,
  updateCollectionDetails,
} from "@/lib/admin/collection-sync";

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

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      handle: string;
    }>;
  }
) {
  try {
    const {
      handle: rawHandle,
    } = await context.params;

    const handle =
      decodeURIComponent(
        rawHandle
      );

    const bucket =
      getBucket();

    const collection =
      await getCollection(
        bucket,
        handle
      );

    if (!collection) {
      return Response.json(
        {
          success: false,
          error:
            "Collection not found.",
        },
        {
          status: 404,
        }
      );
    }

    const products =
      await getCollectionProducts(
        bucket,
        handle
      );

    return Response.json({
      success: true,
      collection,
      products,
    });
  } catch (error) {
    console.error(
      "Load admin collection failed:",
      error
    );

    return Response.json(
      {
        success: false,

        error:
          "Failed to load collection.",

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

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      handle: string;
    }>;
  }
) {
  try {
    const {
      handle: rawHandle,
    } = await context.params;

    const handle =
      decodeURIComponent(
        rawHandle
      );

    const body =
      await request.json();

    const bucket =
      getBucket();

    if (
      body?.action ===
      "prepare-handle-migration"
    ) {
      const result =
        await prepareCollectionMigration(
          bucket,
          handle,
          body.newHandle
        );

      return Response.json(result);
    }

    if (
      body?.action ===
      "migrate-handle-product"
    ) {
      const result =
        await migrateCollectionProduct(
          bucket,
          handle,
          body.newHandle,
          body.productHandle
        );

      return Response.json({
        success: true,
        ...result,
      });
    }

    if (
      body?.action ===
      "finalize-handle-migration"
    ) {
      const result =
        await finalizeCollectionMigration(
          bucket,
          handle,
          body.newHandle
        );

      return Response.json(result);
    }

    const action =
      String(
        body?.action || ""
      )
        .trim()
        .toLowerCase();

    const productHandle =
      String(
        body?.productHandle || ""
      )
        .trim()
        .toLowerCase();

    if (!productHandle) {
      return Response.json(
        {
          success: false,
          error:
            "Product handle is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      action !== "add" &&
      action !== "remove"
    ) {
      return Response.json(
        {
          success: false,
          error:
            'Action must be "add" or "remove".',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Do not allow membership changes
     * against a collection that does
     * not exist.
     */
    const collection =
      await getCollection(
        bucket,
        handle
      );

    if (!collection) {
      return Response.json(
        {
          success: false,
          error:
            "Collection not found.",
        },
        {
          status: 404,
        }
      );
    }

    const result =
      action === "add"
        ? await addProductToCollection(
            bucket,
            handle,
            productHandle
          )
        : await removeProductFromCollection(
            bucket,
            handle,
            productHandle
          );

    return Response.json({
      success: true,
      action,
      productHandle,
      ...result,
    });
  } catch (error) {
    console.error(
      "Update collection membership failed:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    const isNotFound =
      message.includes(
        "not found"
      );

    const isOnlyCollection =
      message.includes(
        "only collection"
      );

    return Response.json(
      {
        success: false,
        error: message,
      },
      {
        status:
          isNotFound
            ? 404
            : isOnlyCollection
              ? 409
              : 500,
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
    const {
      handle: rawHandle,
    } = await context.params;

    const currentHandle =
      decodeURIComponent(
        rawHandle
      );

    const body =
      await request.json();

    if (
      !body ||
      typeof body !==
        "object"
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Invalid collection data.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Handle migration is deliberately
     * separate because changing it must
     * migrate product tags/indexes and
     * create the old URL redirect.
     */
    const requestedHandle =
      String(
        body.handle ||
          currentHandle
      )
        .trim()
        .toLowerCase();

    if (
      requestedHandle !==
      currentHandle
        .trim()
        .toLowerCase()
    ) {
      return Response.json(
        {
          success: false,

          error:
            "Collection handle migration is not connected yet.",
        },
        {
          status: 409,
        }
      );
    }

    const bucket =
      getBucket();

    const result =
      await updateCollectionDetails(
        bucket,
        currentHandle,
        {
          title:
            body.title,

          description:
            body.description,

          seoTitle:
            body.seoTitle,

          seoDescription:
            body.seoDescription,
        }
      );

    return Response.json({
      success: true,

      message:
        "Collection saved.",

      collection:
        result.collection,

      synchronizedFiles:
        result.updatedFiles,
    });
  } catch (error) {
    console.error(
      "Update collection failed:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return Response.json(
      {
        success: false,
        error: message,
      },
      {
        status:
          message.includes(
            "not found"
          )
            ? 404
            : message.includes(
                  "required"
                )
              ? 400
              : 500,
      }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{
      handle: string;
    }>;
  }
) {
  try {
    const {
      handle: rawHandle,
    } = await context.params;

    const handle =
      decodeURIComponent(
        rawHandle
      );

    const bucket =
      getBucket();

    const result =
      await deleteCollection(
        bucket,
        handle
      );

    return Response.json(
      result
    );
  } catch (error) {
    console.error(
      "Delete collection failed:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    return Response.json(
      {
        success: false,
        error: message,
      },
      {
        status:
          message.includes(
            "not found"
          )
            ? 404
            : message.includes(
                  "cannot be deleted"
                )
              ? 409
              : 500,
      }
    );
  }
}