export type ProductIndexItem = {
  handle: string;
  title: string;
  category: string;
  collection: string;
  collectionHandle: string;
  imageFolder?: string;
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
  collectionTitle?: string;
  categoryTitle?: string;
};

export type Product = {
  handle: string;
  title: string;
  collection: string;
  collectionHandle: string;
  category: string;
  imageFolder?: string;
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

type CatalogImageInput = {
  image?: string;
  imageFolder?: string;
  collectionHandle?: string;
  collection?: string;
  category?: string;
};

function replaceExtensionWithWebp(filename: string) {
  const cleanFilename = filename.split("?")[0];
  const extensionIndex = cleanFilename.lastIndexOf(".");

  return extensionIndex > -1
    ? `${cleanFilename.slice(0, extensionIndex)}.webp`
    : `${cleanFilename}.webp`;
}

export function getCatalogImageUrls(product: CatalogImageInput) {
  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, "") || "";
  const image = String(product.image || "").trim();

  if (!image) {
    return { thumbnail: "", original: "" };
  }

  if (image.startsWith("http")) {
    try {
      const imageUrl = new URL(image);
      const imagePath = imageUrl.pathname.replace(/^\/+/, "");

      if (imagePath.startsWith("catalog/images/")) {
        const relativeImage = imagePath.slice("catalog/images/".length);

        return {
          thumbnail: `${r2Base}/catalog/thumbs/${replaceExtensionWithWebp(
            relativeImage
          )}`,
          original: image,
        };
      }

      if (imagePath.startsWith("catalog/thumbs/")) {
        return {
          thumbnail: image,
          original: "",
        };
      }
    } catch {
      // Keep external image URLs unchanged.
    }

    return { thumbnail: image, original: image };
  }

  if (!r2Base) {
    return { thumbnail: "", original: "" };
  }

  const cleanImage = image.replace(/^\/+/, "");

  if (cleanImage.startsWith("catalog/thumbs/")) {
    return {
      thumbnail: `${r2Base}/${replaceExtensionWithWebp(cleanImage)}`,
      original: "",
    };
  }

  if (cleanImage.startsWith("catalog/images/")) {
    const relativeImage = cleanImage.slice("catalog/images/".length);

    return {
      thumbnail: `${r2Base}/catalog/thumbs/${replaceExtensionWithWebp(relativeImage)}`,
      original: `${r2Base}/${cleanImage}`,
    };
  }

  const folder =
    product.imageFolder ||
    product.collectionHandle ||
    product.collection ||
    product.category ||
    "";

  if (!folder) {
    return { thumbnail: "", original: "" };
  }

  return {
    thumbnail: `${r2Base}/catalog/thumbs/${folder}/${replaceExtensionWithWebp(cleanImage)}`,
    original: `${r2Base}/catalog/images/${folder}/${cleanImage}`,
  };
}

