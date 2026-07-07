export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");

  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, "");

  if (!r2Base || !file) {
    return Response.json({ error: "Missing params" }, { status: 400 });
  }

  let key = "";

  if (file === "meta") key = "catalog/indexes/catalog-meta.json";
  else if (file === "collections") key = "catalog/indexes/collections.json";
  else if (file === "stats") key = "catalog/indexes/stats.json";
  else if (file === "filters") key = "catalog/indexes/filter-index.json";
  else if (file === "category-meta")
    key = "catalog/indexes/category-meta.json";
  else if (file.startsWith("category:")) {
    const [, category, page] = file.split(":");
    key = `catalog/indexes/category-pages/${category}/${page}.json`;
  } else {
    key = `catalog/indexes/catalog-pages/${file}.json`;
  }

  const res = await fetch(`${r2Base}/${key}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return Response.json(
      {
        error: "Not found",
        key,
        url: `${r2Base}/${key}`,
        status: res.status,
      },
      { status: 404 }
    );
  }

  const data = await res.text();

  return new Response(data, {
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}