import type { MetadataRoute } from "next";

type CollectionItem = {
  handle: string;
};

type ProductIndexItem = {
  handle: string;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function getJson<T>(path: string): Promise<T[]> {
  try {
    const baseUrl = process.env.CF_PAGES_URL
      ? `https://${process.env.CF_PAGES_URL}`
      : siteUrl;

    const res = await fetch(`${baseUrl}${path}`, {
      cache: "force-cache",
    });

    if (!res.ok) return [];

    return res.json();
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [collectionsData, productsIndex] = await Promise.all([
    getJson<CollectionItem>("/data/collections.json"),
    getJson<ProductIndexItem>("/data/products-index.json"),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
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
  ];

  const collectionPages: MetadataRoute.Sitemap = collectionsData.map(
    (collection) => ({
      url: `${siteUrl}/collections/${collection.handle}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    })
  );

  const productPages: MetadataRoute.Sitemap = productsIndex.map((product) => ({
    url: `${siteUrl}/products/${product.handle}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...staticPages, ...collectionPages, ...productPages];
}