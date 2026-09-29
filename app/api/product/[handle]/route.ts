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
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.text();

      return new Response(data, {
        headers: {
          "content-type": "application/json",
          "cache-control": "public, max-age=300, stale-while-revalidate=86400",
        },
      });
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