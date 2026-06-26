export const runtime = "edge";

type RouteContext = {
  params: Promise<{ handle: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { handle } = await params;

  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (!r2Base) {
    return Response.json(
      { error: "R2 URL missing" },
      { status: 500 }
    );
  }

  const url = `${r2Base.replace(/\/$/, "")}/data/products/${handle}.json`;

  const res = await fetch(url, {
    cache: "force-cache",
  });

  if (!res.ok) {
    return Response.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  const data = await res.text();

  return new Response(data, {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}