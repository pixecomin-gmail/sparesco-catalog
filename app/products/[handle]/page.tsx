export const runtime = "edge";

import type { Metadata } from "next";
import ProductPageClient from "@/components/ProductPageClient";

type ProductPageProps = {
  params: Promise<{ handle: string }>;
};

type ProductVariant = {
  title?: string;
  vendor?: string;
  price?: number;
  partNumber?: string;
  description?: string;
};

type ProductData = {
  handle: string;
  title?: string;
  collection?: string;
  category?: string;
  images?: string[];
  variants?: ProductVariant[];
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sparesco.com";

const r2Base =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

function productFolder(handle: string) {
  let hash = 0;

  for (let i = 0; i < handle.length; i++) {
    hash = (hash * 31 + handle.charCodeAt(i)) >>> 0;
  }

  return (hash % 256).toString(16).padStart(2, "0");
}

async function getProduct(
  handle: string
): Promise<ProductData | null> {
  if (!r2Base) return null;

  try {
    const folder = productFolder(handle);

    const res = await fetch(
      `${r2Base.replace(
        /\/$/,
        ""
      )}/catalog/products/${folder}/${handle}.json`,
      {
        cache: "force-cache",
      }
    );

    if (!res.ok) return null;

    return res.json();
  } catch {
    return null;
  }
}

function cleanText(value?: string) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanProductTitle(value?: string) {
  return cleanText(value)
    .split("| Replaces")[0]
    .split("| replaces")[0]
    .split(" Replaces")[0]
    .split(" replaces")[0]
    .trim();
}

function titleFromHandle(value?: string) {
  return cleanText(value)
    .split("-")
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function getProductImage(product: ProductData) {
  const image = product.images?.[0];

  if (!image) return `${siteUrl}/logo.png`;

  if (image.startsWith("http")) {
    return image;
  }

  const folder =
    product.collection || product.category || "";

  return `${r2Base.replace(
    /\/$/,
    ""
  )}/catalog/images/${folder}/${image}`;
}

function getSeoData(
  product: ProductData,
  fallbackHandle: string
) {
  const variant = product.variants?.[0];

  const partNumber = cleanText(
    product.handle || fallbackHandle
  );

  const productTitle = cleanProductTitle(
    variant?.title ||
      product.title ||
      partNumber
  );

  const brand = cleanText(variant?.vendor);

  const category = titleFromHandle(
    product.collection || product.category
  );

  const replacements =
    product.variants
      ?.map((item) =>
        cleanProductTitle(item.title)
      )
      .filter(Boolean)
      .join(", ") || "";

  const metaTitle = productTitle;

  const variantCount =
    product.variants?.length || 0;

  const metaDescription =
    variantCount <= 1
      ? `${productTitle} spare part. View technical specifications, product details and send an enquiry to Sparesco for pricing and availability.`
      : `${partNumber.toUpperCase()} replacement references include ${replacements}. View technical specifications, product details and send an enquiry to Sparesco for pricing and availability.`;

  return {
    variant,
    partNumber,
    brand,
    productTitle,
    category,
    metaTitle,
    metaDescription,
  };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;

  const product = await getProduct(handle);

  if (!product) {
    return {
      title: "Product Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const seo = getSeoData(product, handle);

  const canonical =
    `${siteUrl}/products/${handle}`;

  const image = getProductImage(product);

  const fullTitle =
    `${seo.metaTitle} | Sparesco`;

  return {
    title: seo.metaTitle,
    description: seo.metaDescription,

    alternates: {
      canonical,
    },

    openGraph: {
      title: fullTitle,
      description: seo.metaDescription,
      url: canonical,
      siteName: "Sparesco",
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: seo.productTitle,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: seo.metaDescription,
      images: [image],
    },
  };
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { handle } = await params;

  return <ProductPageClient handle={handle} />;
}