import type { MetadataRoute } from "next";

type CollectionItem = {
  handle: string;
};

type ProductIndexItem = {
  handle?: string;
  h?: string;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sparesco.com";
const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

async function getR2Json<T>(key: string): Promise<T[]> {
  if (!r2Base) return [];

  try {
    const res = await fetch(`${r2Base.replace(/\/$/, "")}/${key}`, {
      cache: "force-cache",
    });

    if (!res.ok) return [];

    const data = await res.json();

    if (Array.isArray(data)) return data;

    if (Array.isArray(data.products)) return data.products;
    if (Array.isArray(data.collections)) return data.collections;
    if (Array.isArray(data.items)) return data.items;

    return [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [collectionsData, productsData] = await Promise.all([
    getR2Json<CollectionItem>("catalog/indexes/collections.json"),
    getR2Json<ProductIndexItem>("catalog/indexes/catalog-index.json"),
  ]);

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/parts`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/collections`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/spareshunt`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/sellwithus`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...collectionsData.map((collection) => ({
      url: `${siteUrl}/collections/${collection.handle}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...productsData
    .map((product) => product.handle || product.h)
    .filter(Boolean)
    .map((handle) => ({
    url: `${siteUrl}/products/${handle}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}