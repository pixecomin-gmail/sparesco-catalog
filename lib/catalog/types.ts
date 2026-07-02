export type ProductVariant = {
  title: string;
  option1Value?: string;
  image?: string;
  vendor?: string;
  price?: number;
  partNumber?: string;
  hsCode?: string;
  countryOfOrigin?: string;
  description?: string;
  specifications?: string[];
  unitWeight?: string;
  shippingVolume?: string;
};

export type Product = {
  handle: string;
  title: string;
  collection: string;
  category: string;
  tags: string[];
  images: string[];
  variants: ProductVariant[];
};

export type CatalogIndexItem = {
  handle: string;
  title: string;
  collection: string;
  collectionTitle: string;
  category: string;
  categoryTitle: string;
  image: string;
  partNumber: string;
  vendor: string;
  variantCount: number;
  price: number;
  tags: string[];
};

export type CollectionItem = {
  title: string;
  handle: string;
  count: number;
};