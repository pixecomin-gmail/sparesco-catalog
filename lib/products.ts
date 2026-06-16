import productsIndexData from "@/data/products-index.json";

export type ProductIndexItem = {
  handle: string;
  title: string;
  category: string;
  collection: string;
  collectionHandle: string;
  image: string;
  partNumber: string;
  vendor: string;
  variantCount: number;
};

export type ProductVariant = {
  title: string;
  sku: string;
  image: string;
  vendor: string;
  price: number;
  partNumber: string;
  hsCode: string;
  countryOfOrigin: string;
  description: string;
  specifications: string[];
  unitWeight: string;
  shippingVolume: string;
};

export type Product = {
  handle: string;
  title: string;
  collection: string;
  collectionHandle: string;
  category: string;
  tags: string[];
  images: string[];
  variants: ProductVariant[];
};

export const productsIndex = productsIndexData as ProductIndexItem[];

export function getAllProducts() {
  return productsIndex;
}

export function getCategories() {
  return Array.from(
    new Set(productsIndex.map((product) => product.category).filter(Boolean))
  );
}

export function getBrands() {
  return Array.from(
    new Set(productsIndex.map((product) => product.vendor).filter(Boolean))
  );
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function searchProducts(query: string, limit?: number) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return [];

  const results = productsIndex.filter((product) => {
    const text = [
      product.title,
      product.partNumber,
      product.vendor,
      product.category,
      product.collection,
      product.handle,
    ].join(" ");

    return normalizeSearchText(text).includes(normalizedQuery);
  });

  return typeof limit === "number" ? results.slice(0, limit) : results;
}