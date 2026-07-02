const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

if (!r2PublicUrl) {
  throw new Error("Missing NEXT_PUBLIC_R2_PUBLIC_URL");
}

export const CATALOG_BASE_URL = `${r2PublicUrl.replace(/\/$/, "")}/catalog`;

export const CATALOG_URLS = {
  index: `${CATALOG_BASE_URL}/indexes/catalog-index.json`,
  collections: `${CATALOG_BASE_URL}/indexes/collections.json`,
  stats: `${CATALOG_BASE_URL}/indexes/stats.json`,
};

export function productImageUrl(collection: string, image: string) {
  if (!image) return "";

  if (image.startsWith("http")) return image;

  return `${CATALOG_BASE_URL}/images/${collection}/${image}`;
}