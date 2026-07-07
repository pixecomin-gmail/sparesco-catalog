export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() || "";

  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (!r2Base) {
    return Response.json(
      { error: "Missing NEXT_PUBLIC_R2_PUBLIC_URL" },
      { status: 500 }
    );
  }

  const url = `${r2Base.replace(
    /\/$/,
    ""
  )}/catalog/indexes/catalog-index.json`;

  const res = await fetch(url, {
    cache: "force-cache",
  });

  if (!res.ok) {
    return Response.json(
      { error: "Catalog not found" },
      { status: 404 }
    );
  }

  // No search → stream file directly
  if (!q) {
    return new Response(res.body, {
      headers: {
        "content-type": "application/json",
        "cache-control":
          "public, max-age=300, stale-while-revalidate=86400",
      },
    });
  }

  // Search only
  const products = await res.json();

  const results = products.filter((product: any) => {
    return (
      product.title?.toLowerCase().includes(q) ||
      product.handle?.toLowerCase().includes(q) ||
      product.partNumber?.toLowerCase().includes(q) ||
      product.collection?.toLowerCase().includes(q) ||
      product.category?.toLowerCase().includes(q) ||
      product.vendor?.toLowerCase().includes(q)
    );
  });

  return Response.json(results, {
    headers: {
      "cache-control":
        "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}