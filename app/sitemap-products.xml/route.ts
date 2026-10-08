export const runtime = "edge";

type ProductIndexItem = {
  handle?: string;
  h?: string;
};

type CollectionItem = {
  handle: string;
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sparesco.com";

const r2Base =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(url: string) {
  return `
  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`;
}

function xmlResponse(xml: string) {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`R2 HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const requestedPage = Number(
    requestUrl.searchParams.get("page") || "1"
  );

  const page = Number.isFinite(requestedPage)
    ? Math.max(1, Math.floor(requestedPage))
    : 1;

  const file = String(page).padStart(4, "0");
  const base = r2Base.replace(/\/$/, "");

  if (!r2Base) {
    return new Response("R2 unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let products: ProductIndexItem[];

  try {
    products = await getJson<ProductIndexItem[]>(
      `${base}/catalog/indexes/catalog-pages/${file}.json`
    );

    if (!Array.isArray(products)) {
      throw new Error("Invalid product sitemap data");
    }
  } catch {
    return new Response("Product sitemap temporarily unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const urls: string[] = [];

  if (page === 1) {
    urls.push(
      siteUrl,
      `${siteUrl}/collections`,
      `${siteUrl}/spareshunt`,
      `${siteUrl}/sellwithus`,
      `${siteUrl}/contact`,
      `${siteUrl}/about`
    );

    let collections: CollectionItem[];

    try {
      collections = await getJson<CollectionItem[]>(
        `${base}/catalog/indexes/collections.json`
      );

      if (!Array.isArray(collections)) {
        throw new Error("Invalid collections data");
      }
    } catch {
      return new Response("Collections sitemap temporarily unavailable", {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }

    for (const collection of collections) {
      if (collection.handle) {
        urls.push(
          `${siteUrl}/collections/${collection.handle}`
        );
      }
    }
  }

  for (const product of products) {
    const handle = product.handle || product.h;

    if (handle) {
      urls.push(`${siteUrl}/products/${handle}`);
    }
  }

  const entries = urls.map(urlEntry).join("");

  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`);
}