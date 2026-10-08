export const runtime = "edge";

function productFolder(handle: string) {
  let hash = 0;

  for (let i = 0; i < handle.length; i++) {
    hash = (hash * 31 + handle.charCodeAt(i)) >>> 0;
  }

  return (hash % 256).toString(16).padStart(2, "0");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (!r2Base) {
    return Response.json(
      { error: "Missing NEXT_PUBLIC_R2_PUBLIC_URL" },
      { status: 500 }
    );
  }

  const base = r2Base.replace(/\/$/, "");
  const folder = productFolder(handle);

  const urls = [
    `${base}/catalog/products/${folder}/${handle}.json`,
    `${base}/catalog/products/${handle}.json`,
  ];

  for (const url of urls) {
    let res: Response;

    try {
      res = await fetch(url, {
        cache: "no-store",
      });
    } catch (error) {
      console.error("Product API R2 request failed", error);

      return Response.json(
        { error: "Product temporarily unavailable" },
        {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    if (res.status === 404) continue;

    if (!res.ok) {
      console.error("Product API R2 HTTP", res.status);

      return Response.json(
        { error: "Product temporarily unavailable" },
        {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    try {
      const data = await res.text();
      JSON.parse(data);

      return new Response(data, {
        headers: {
          "content-type": "application/json",
          "cache-control":
            "public, max-age=300, stale-while-revalidate=86400",
        },
      });
    } catch (error) {
      console.error("Product API invalid JSON", error);

      return Response.json(
        { error: "Product temporarily unavailable" },
        {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }
  }

  return Response.json(
    {
      error: "Product not found",
      handle,
      folder,
      tried: urls,
    },
    { status: 404 }
  );
}