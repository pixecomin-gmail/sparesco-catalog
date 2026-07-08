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
  s: string;
};

function getShardKeys(query: string) {
  const clean = query.trim().toLowerCase();
  const first = clean[0];

  if (!first) return ["a"];

  if (first >= "a" && first <= "z") return [first];
  if (first >= "0" && first <= "9") return [first];

  return ["other"];
}

function clean(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

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

  if (!q) {
    return Response.json([]);
  }

  const shardKeys = getShardKeys(q);
  const base = r2Base.replace(/\/$/, "");

  const responses = await Promise.all(
    shardKeys.map((shard) =>
      fetch(`${base}/catalog/search/${shard}.json`, {
        cache: "force-cache",
      })
    )
  );

  const items: SearchItem[] = [];

  for (const res of responses) {
    if (!res.ok) continue;
    items.push(...((await res.json()) as SearchItem[]));
  }

  const query = clean(q);

  const matched = items
    .map((item) => {
      const title = clean(item.t || "");
      const part = clean(item.p || "");
      const handle = clean(item.h || "");
      const collection = clean(item.ct || item.c || "");
      const searchable = clean(
        `${item.t || ""} ${item.p || ""} ${item.h || ""} ${item.ct || ""} ${
          item.c || ""
        } ${item.s || ""}`
      );

      let score = 0;

      if (title === query) score = 10000;
      else if (title.startsWith(query)) score = 9000;
      else if (title.includes(query)) score = 8000;
      else if (part === query) score = 7000;
      else if (part.startsWith(query)) score = 6000;
      else if (part.includes(query)) score = 5000;
      else if (handle === query) score = 4000;
      else if (handle.startsWith(query)) score = 3000;
      else if (handle.includes(query)) score = 2000;
      else if (collection.includes(query)) score = 1000;
      else if (searchable.includes(query)) score = 500;

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)
    .map((entry) => entry.item);

  return Response.json(
    matched.map((item) => ({
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
    }))
  );
}