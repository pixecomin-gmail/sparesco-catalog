import { getRequestContext } from "@cloudflare/next-on-pages";

import {
  syncExistingProduct,
  type R2BucketLike,
} from "@/lib/admin/product-sync";

export const runtime = "edge";

function productFolder(handle: string) {
  let hash = 0;

  for (let i = 0; i < handle.length; i++) {
    hash = (hash * 31 + handle.charCodeAt(i)) >>> 0;
  }

  return (hash % 256).toString(16).padStart(2, "0");
}

function getBucket() {
  const context = getRequestContext();

  const env = context.env as unknown as {
    CATALOG_BUCKET?: R2BucketLike;
  };

  if (!env.CATALOG_BUCKET) {
    throw new Error("CATALOG_BUCKET binding is not configured.");
  }

  return env.CATALOG_BUCKET;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await context.params;

    const safeHandle = String(handle || "")
      .trim()
      .toLowerCase();

    if (!safeHandle) {
      return Response.json(
        { success: false, error: "Missing product handle." },
        { status: 400 }
      );
    }

    const bucket = getBucket();

    const folder = productFolder(safeHandle);

    const key =
      `catalog/products/${folder}/${safeHandle}.json`;

    const object = await bucket.get(key);

    if (!object) {
      return Response.json(
        {
          success: false,
          error: "Product not found.",
          key,
        },
        { status: 404 }
      );
    }

    const product = JSON.parse(await object.text());

    return Response.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Admin product GET error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load product.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await context.params;

    const safeHandle = String(handle || "")
      .trim()
      .toLowerCase();

    if (!safeHandle) {
      return Response.json(
        { success: false, error: "Missing product handle." },
        { status: 400 }
      );
    }

    const incoming = await request.json();

    if (!incoming || typeof incoming !== "object") {
      return Response.json(
        { success: false, error: "Invalid product data." },
        { status: 400 }
      );
    }

    /*
     * Handle changes are deliberately blocked for now.
     * Changing a handle would also require moving the R2 object
     * and updating every catalogue/search reference.
     */
    if (
      incoming.handle &&
      String(incoming.handle).toLowerCase() !== safeHandle
    ) {
      return Response.json(
        {
          success: false,
          error: "Product handle cannot be changed yet.",
        },
        { status: 400 }
      );
    }

    const bucket = getBucket();

    const folder = productFolder(safeHandle);

    const key =
      `catalog/products/${folder}/${safeHandle}.json`;

    /*
     * Read the existing product first.
     * This lets us preserve internal importer information.
     */
    const existingObject = await bucket.get(key);

    if (!existingObject) {
      return Response.json(
        {
          success: false,
          error: "Product not found.",
          key,
        },
        { status: 404 }
      );
    }

    const existing = JSON.parse(
      await existingObject.text()
    );

    const product = {
      ...existing,
      ...incoming,

      handle: safeHandle,

      /*
       * Preserve importer/internal fields.
       */
      canonicalKey:
        existing.canonicalKey || safeHandle,

      imageFolder:
        incoming.imageFolder ||
        existing.imageFolder ||
        incoming.collection ||
        existing.collection ||
        "",

      sources:
        existing.sources || [],
    };

    if (
      !product.title ||
      !product.collection ||
      !Array.isArray(product.variants)
    ) {
      return Response.json(
        {
          success: false,
          error:
            "Product title, collection and variants are required.",
        },
        { status: 400 }
      );
    }

    await bucket.put(
      key,
      JSON.stringify(product),
      {
        httpMetadata: {
          contentType: "application/json",
          cacheControl: "public, max-age=300",
        },
      }
    );

    const syncResult =
      await syncExistingProduct(
        bucket,
        existing,
        product
      );

    return Response.json({
      success: true,
      message: "Product saved.",
      handle: safeHandle,
      key,
      product,
      synchronizedFiles: syncResult.updatedFiles,
    });
  } catch (error) {
    console.error("Admin product PUT error:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to save product.",
      },
      { status: 500 }
    );
  }
}