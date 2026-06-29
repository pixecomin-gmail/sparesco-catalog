export const runtime = "edge";

type RouteContext = {
  params: { handle: string };
};

const R2_PUBLIC_URL = "https://pub-f66ad83430274d9284d9172bc855e8cd.r2.dev";

export async function GET(_request: Request, context: RouteContext) {
  try {
    const handle = context.params.handle;
    const url = `${R2_PUBLIC_URL}/data/products/${handle}.json`;

    const res = await fetch(url);

    if (!res.ok) {
      return Response.json(
        { error: "Product not found", status: res.status, url },
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
  } catch (error) {
    return Response.json(
      {
        error: "Product API crashed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}