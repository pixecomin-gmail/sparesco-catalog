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
  price: number;
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

export function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function searchProductList(
  products: ProductIndexItem[],
  query: string,
  limit?: number
) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return [];

  const results = products.filter((product) => {
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