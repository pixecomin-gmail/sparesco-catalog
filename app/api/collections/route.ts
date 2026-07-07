export const runtime = "edge";

export async function GET() {
  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (!r2Base) {
    return Response.json(
      { error: "Missing NEXT_PUBLIC_R2_PUBLIC_URL" },
      { status: 500 }
    );
  }

  const url = `${r2Base.replace(/\/$/, "")}/catalog/indexes/collections.json`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    return Response.json(
      { error: "Collections not found", status: res.status, url },
      { status: 404 }
    );
  }

  const data = await res.text();

  return new Response(data, {
    headers: {
      "content-type": "application/json",
      "cache-control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}