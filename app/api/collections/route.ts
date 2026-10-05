export const runtime = "edge";

type CollectionItem = {
  title: string;
  handle: string;
  count: number;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export async function GET() {
  const r2Base =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (!r2Base) {
    return Response.json(
      {
        error:
          "Missing NEXT_PUBLIC_R2_PUBLIC_URL",
      },
      {
        status: 500,
      }
    );
  }

  const base =
    r2Base.replace(/\/$/, "");

  const collectionsUrl =
    `${base}/catalog/indexes/collections.json`;

  const detailsUrl =
    `${base}/catalog/indexes/collection-details.json`;

  const [
    collectionsResponse,
    detailsResponse,
  ] = await Promise.all([
    fetch(
      collectionsUrl,
      {
        cache: "no-store",
      }
    ),

    fetch(
      detailsUrl,
      {
        cache: "no-store",
      }
    ),
  ]);

  if (!collectionsResponse.ok) {
    return Response.json(
      {
        error:
          "Collections not found",

        status:
          collectionsResponse.status,

        url:
          collectionsUrl,
      },
      {
        status: 404,
      }
    );
  }

  const collections =
    (await collectionsResponse.json()) as CollectionItem[];

  /*
   * collection-details.json is new.
   *
   * If it does not exist yet, the public
   * collections API must continue working
   * exactly as it did before.
   */
  let details:
    Record<
      string,
      {
        title?: string;
        description?: string;
        seoTitle?: string;
        seoDescription?: string;
      }
    > = {};

  if (detailsResponse.ok) {
    try {
      const parsed =
        await detailsResponse.json();

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        details = parsed;
      }
    } catch {
      details = {};
    }
  }

  const merged =
    Array.isArray(collections)
      ? collections.map(
          (collection) => {
            const detail =
              details[
                collection.handle
              ];

            if (
              !detail ||
              typeof detail !==
                "object"
            ) {
              return collection;
            }

            return {
              ...collection,

              title:
                String(
                  detail.title ||
                    collection.title
                ).trim(),

              description:
                String(
                  detail.description ||
                    ""
                ).trim(),

              seoTitle:
                String(
                  detail.seoTitle ||
                    ""
                ).trim(),

              seoDescription:
                String(
                  detail.seoDescription ||
                    ""
                ).trim(),
            };
          }
        )
      : [];

  return Response.json(
    merged,
    {
      headers: {
        "cache-control":
          "public, max-age=300, stale-while-revalidate=86400",
      },
    }
  );
}