export const runtime = "edge";

type RouteContext = {
  params: Promise<{ handle: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  const { handle } = await params;

  const r2Base =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ??
    "https://pub-f66ad83430274d9284d9172bc855e8cd.r2.dev";

  const url = `${r2Base.replace(/\/$/, "")}/data/products/${handle}.json`;

  try {
    const res = await fetch(url);

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
          "public, max-age=86400, stale-while-revalidate=604800",
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