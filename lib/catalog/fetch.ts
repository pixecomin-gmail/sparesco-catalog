import { CatalogIndexItem, CollectionItem, Product } from "./types";
import { CATALOG_BASE_URL, CATALOG_URLS } from "./config";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return res.json();
}

function productFolder(handle: string) {
  let hash = 0;

  for (let i = 0; i < handle.length; i++) {
    hash = (hash * 31 + handle.charCodeAt(i)) >>> 0;
  }

  return hash.toString(16).padStart(2, "0").slice(0, 2);
}

export async function getCatalog(): Promise<CatalogIndexItem[]> {
  return fetchJson<CatalogIndexItem[]>(CATALOG_URLS.index);
}

export async function getCollections(): Promise<CollectionItem[]> {
  return fetchJson<CollectionItem[]>(CATALOG_URLS.collections);
}

export async function getStats(): Promise<{
  products: number;
  variants: number;
  collections: number;
}> {
  return fetchJson(CATALOG_URLS.stats);
}

export async function getProduct(handle: string): Promise<Product> {
  const safeHandle = handle.toLowerCase().trim();
  const folder = productFolder(safeHandle);

  return fetchJson<Product>(
    `${CATALOG_BASE_URL}/products/${folder}/${safeHandle}.json`
  );
}