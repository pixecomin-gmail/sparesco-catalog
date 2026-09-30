import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

type R2BucketLike = {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | string,
    options?: {
      httpMetadata?: {
        contentType?: string;
        cacheControl?: string;
      };
    }
  ): Promise<unknown>;
};

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getBucket() {
  const context = getRequestContext();

  const env = context.env as unknown as {
    CATALOG_BUCKET?: R2BucketLike;
  };

  if (!env.CATALOG_BUCKET) {
    throw new Error(
      "CATALOG_BUCKET binding is not configured."
    );
  }

  return env.CATALOG_BUCKET;
}

function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extensionForFile(file: File) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".png")) return ".png";
  if (name.endsWith(".webp")) return ".webp";
  if (name.endsWith(".gif")) return ".gif";
  if (name.endsWith(".avif")) return ".avif";

  if (
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg")
  ) {
    return ".jpg";
  }

  switch (file.type) {
    case "image/png":
      return ".png";

    case "image/webp":
      return ".webp";

    case "image/gif":
      return ".gif";

    case "image/avif":
      return ".avif";

    default:
      return ".jpg";
  }
}

function randomId() {
  return crypto.randomUUID()
    .replace(/-/g, "")
    .slice(0, 12);
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
    const { handle } = await context.params;

    const safeHandle = slugify(handle);

    if (!safeHandle) {
      return Response.json(
        {
          success: false,
          error: "Missing product handle.",
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    const imageFolderRaw =
      formData.get("imageFolder");

    const imageFolder = slugify(
      typeof imageFolderRaw === "string"
        ? imageFolderRaw
        : ""
    );

    if (!imageFolder) {
      return Response.json(
        {
          success: false,
          error: "Missing image folder.",
        },
        { status: 400 }
      );
    }

    const files = formData
      .getAll("files")
      .filter(
        (item): item is File =>
          item instanceof File
      );

    if (files.length === 0) {
      return Response.json(
        {
          success: false,
          error: "No images selected.",
        },
        { status: 400 }
      );
    }

    const bucket = getBucket();

    const uploaded: {
      originalFilename: string;
      filename: string;
      key: string;
      contentType: string;
      size: number;
    }[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return Response.json(
          {
            success: false,
            error:
              `${file.name}: unsupported image type.`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return Response.json(
          {
            success: false,
            error:
              `${file.name}: image is larger than 10 MB.`,
          },
          { status: 400 }
        );
      }

      const extension =
        extensionForFile(file);

      const filename =
        `${safeHandle}-${randomId()}${extension}`;

      const key =
        `catalog/images/${imageFolder}/${filename}`;

      const buffer =
        await file.arrayBuffer();

      await bucket.put(
        key,
        buffer,
        {
          httpMetadata: {
            contentType:
              file.type ||
              "application/octet-stream",

            cacheControl:
              "public, max-age=31536000, immutable",
          },
        }
      );

      uploaded.push({
        originalFilename: file.name,
        filename,
        key,
        contentType:
          file.type ||
          "application/octet-stream",
        size: file.size,
      });
    }

    return Response.json({
      success: true,
      uploaded,
    });
  } catch (error) {
    console.error(
      "Admin image upload error:",
      error
    );

    return Response.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to upload images.",
      },
      { status: 500 }
    );
  }
}