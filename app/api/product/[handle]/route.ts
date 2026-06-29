export const runtime = "edge";

type RouteContext = {
  params: Promise<{ handle: string }>;
};

const R2_PUBLIC_URL = "https://pub-f66ad83430274d9284d9172bc855e8cd.r2.dev";

export async function GET(_request: Request, { params }: RouteContext) {
  const { handle } = await params;

  const url = `${R2_PUBLIC_URL}/data/products/${handle}.json`;

  const res = await fetch(url, {
    cache: "force-cache",
  });

  if (!res.ok) {
    return Response.json(
      { error: "Product not found", url },
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