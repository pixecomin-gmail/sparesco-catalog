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