import {
  getRequestContext,
} from "@cloudflare/next-on-pages";

import {
  type R2BucketLike,
} from "@/lib/admin/product-sync";

import {
  createCollection,
} from "@/lib/admin/collection-sync";

export const runtime = "edge";

type CollectionItem = {
  title: string;
  handle: string;
  count: number;
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

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeCollection(
  value: unknown
): CollectionItem | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const item =
    value as Record<string, unknown>;

  const handle =
    clean(item.handle)
      .toLowerCase();

  if (!handle) {
    return null;
  }

  return {
    title:
      clean(item.title) ||
      handle
        .replace(/[-_]+/g, " ")
        .replace(
          /\b\w/g,
          (character) =>
            character.toUpperCase()
        ),

    handle,

    count:
      Math.max(
        0,
        Number(item.count || 0)
      ),
  };
}

export async function GET() {
  try {
    const bucket =
      getBucket();

    const object =
      await bucket.get(
        "catalog/indexes/collections.json"
      );

    if (!object) {
      return Response.json({
        success: true,
        collections: [],
      });
    }

    const raw =
      JSON.parse(
        await object.text()
      );

    const collections =
      (Array.isArray(raw)
        ? raw
        : []
      )
        .map(normalizeCollection)
        .filter(
          (
            item
          ): item is CollectionItem =>
            Boolean(item)
        )
        .sort(
          (a, b) =>
            a.title.localeCompare(
              b.title
            )
        );

    return Response.json({
      success: true,
      collections,
      count:
        collections.length,
    });
  } catch (error) {
    console.error(
      "Load admin collections failed:",
      error
    );

    return Response.json(
      {
        success: false,

        error:
          "Failed to load collections.",

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
            "Invalid collection data.",
        },
        {
          status: 400,
        }
      );
    }

    const bucket =
      getBucket();

    const result =
      await createCollection(
        bucket,
        {
          title:
            body.title,

          handle:
            body.handle,

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
        "Collection created successfully.",

      collection:
        result.collection,

      synchronizedFiles:
        result.updatedFiles,
    });
  } catch (error) {
    console.error(
      "Create admin collection failed:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    const isConflict =
      message.includes(
        "already exists"
      );

    const isValidation =
      message.includes(
        "required"
      );

    return Response.json(
      {
        success: false,
        error:
          isConflict
            ? "Collection already exists."
            : "Failed to create collection.",
        message,
      },
      {
        status:
          isConflict
            ? 409
            : isValidation
              ? 400
              : 500,
      }
    );
  }
}