export const runtime = "edge";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sparesco.com";

const r2Base =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

type CatalogMeta = {
  totalProducts?: number;
  totalPages?: number;
};

function xmlResponse(xml: string) {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function GET() {
  let totalPages = 1;

  try {
    const response = await fetch(
      `${r2Base.replace(/\/$/, "")}/catalog/indexes/catalog-meta.json`,
      { cache: "no-store" }
    );

    if (response.ok) {
      const meta = (await response.json()) as CatalogMeta;

      totalPages =
        meta.totalPages ||
        Math.ceil((meta.totalProducts || 0) / 1000) ||
        1;
    }
  } catch {
    totalPages = 1;
  }

  const sitemapEntries = Array.from(
    { length: totalPages },
    (_, index) => `
  <sitemap>
    <loc>${siteUrl}/sitemap-products.xml?page=${index + 1}</loc>
  </sitemap>`
  ).join("");

  return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`);
}