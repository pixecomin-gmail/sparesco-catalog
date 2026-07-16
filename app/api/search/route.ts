export const runtime = "edge";

type SearchItem = {
  h: string;
  t: string;
  c: string;
  ct: string;
  p: string;
  v: string;
  i: string;
  vc: number;
  pr: number;
  x: string;
};

function compact(value?: string) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function score(item: SearchItem, query: string) {
  const title = compact(item.t);
  const part = compact(item.p);
  const handle = compact(item.h);

  if (title === query) return 10000;
  if (part === query) return 9500;
  if (handle === query) return 9000;
  if (title.startsWith(query)) return 8500;
  if (part.startsWith(query)) return 8000;
  if (handle.startsWith(query)) return 7500;
  if (title.includes(query)) return 6500;
  if (part.includes(query)) return 6000;
  if (handle.includes(query)) return 5500;
  if ((item.x || "").includes(query)) return 3000;

  return 0;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = compact(searchParams.get("q") || "");

    if (query.length < 2) return Response.json([]);

    const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

    if (!r2Base) {
      return Response.json(
        { error: "Missing NEXT_PUBLIC_R2_PUBLIC_URL" },
        { status: 500 }
      );
    }

    const shard = query.slice(0, 2);
    const base = r2Base.replace(/\/$/, "");
    const url = `${base}/catalog/search-v2/${shard}.json`;

    const response = await fetch(url, { cache: "force-cache" });

    if (response.status === 404) return Response.json([]);

    if (!response.ok) {
      return Response.json(
        { error: "Search shard request failed", shard, status: response.status },
        { status: 502 }
      );
    }

    const items = (await response.json()) as SearchItem[];

    const results = items
      .map((item) => ({ item, score: score(item, query) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 100)
      .map(({ item }) => ({
        handle: item.h,
        title: item.t,
        collection: item.c,
        collectionTitle: item.ct,
        category: item.c,
        categoryTitle: item.ct,
        image: item.i,
        partNumber: item.p,
        vendor: item.v,
        variantCount: item.vc,
        price: item.pr,
      }));

    return Response.json(results, {
      headers: {
        "Cache-Control":
          "public, max-age=60, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: "Search API crashed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
