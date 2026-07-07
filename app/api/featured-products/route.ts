export const runtime = "edge";

function productFolder(handle: string) {
  let hash = 0;

  for (let i = 0; i < handle.length; i++) {
    hash = (hash * 31 + handle.charCodeAt(i)) >>> 0;
  }

  return (hash % 256).toString(16).padStart(2, "0");
}

export async function GET() {
  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (!r2Base) {
    return Response.json(
      { error: "Missing NEXT_PUBLIC_R2_PUBLIC_URL" },
      { status: 500 }
    );
  }

  const base = r2Base.replace(/\/$/, "");
  const pageUrl = `${base}/catalog/indexes/catalog-pages/0001.json`;

  const pageRes = await fetch(pageUrl, { cache: "no-store" });

  if (!pageRes.ok) {
    return Response.json([], { status: 200 });
  }

  const data = await pageRes.json();
  const products = Array.isArray(data) ? data : data.products || [];
  const valid = [];

  for (const product of products) {
    if (valid.length >= 12) break;
    if (!product?.handle) continue;

    const folder = productFolder(product.handle);
    const productUrl = `${base}/catalog/products/${folder}/${product.handle}.json`;

    const productRes = await fetch(productUrl, { cache: "no-store" });

    if (productRes.ok) {
      valid.push(product);
    }
  }

  return Response.json(valid);
}