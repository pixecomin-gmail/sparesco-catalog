export const runtime = "edge";

type RouteContext = {
  params: Promise<{ handle: string }>;
};

function productFolder(handle: string) {
  const safeHandle = handle.toLowerCase().trim();
  let hash = 0;

  for (let i = 0; i < safeHandle.length; i++) {
    hash = (hash * 31 + safeHandle.charCodeAt(i)) >>> 0;
  }

  return hash.toString(16).padStart(2, "0").slice(0, 2);
}

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  const { handle } = await params;
  const safeHandle = handle.toLowerCase().trim();

  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (!r2Base) {
    return Response.json(
      { error: "Missing NEXT_PUBLIC_R2_PUBLIC_URL" },
      { status: 500 }
    );
  }

  const folder = productFolder(safeHandle);

  const url = `${r2Base.replace(
    /\/$/,
    ""
  )}/catalog/products/${folder}/${safeHandle}.json`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      return Response.json(
        {
          error: "Product not found",
          status: res.status,
          url,
        },
        { status: 404 }
      );
    }

    const data = await res.text();

    return new Response(data, {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control":
          "public, max-age=300, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    return Response.json(
      {
        error: "Fetch failed",
        message: err instanceof Error ? err.message : String(err),
        url,
      },
      { status: 500 }
    );
  }
}