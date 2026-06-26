export const runtime = "edge";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ProductPageClient from "@/components/ProductPageClient";
import type { Product } from "@/types/product";

type ProductPageProps = {
  params: Promise<{ handle: string }>;
};

function cleanTitle(title: string) {
  return title
    .split("| Replaces")[0]
    .split("| replaces")[0]
    .split(" Replaces")[0]
    .split(" replaces")[0]
    .trim();
}

function cleanMetaText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host");

  if (host) {
    return `https://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

async function getProductJson(handle: string): Promise<Product | null> {
  try {
    const baseUrl = await getBaseUrl();

    const res = await fetch(`${baseUrl}/data/products/${handle}.json`, {
      cache: "force-cache",
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as Product;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductJson(handle);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const collection = product.collection || "Spare Parts";
  const image = product.images?.[0] || "";

  const primaryVariant = product.variants?.[0];

  const primaryVariantTitle = primaryVariant
    ? cleanTitle(primaryVariant.title)
        .replace(/\s+Air Filter$/i, "")
        .replace(/\s+Oil Filter$/i, "")
        .replace(/\s+Hydraulic Filter$/i, "")
        .trim()
    : product.title;

  const alternativePartNumbers =
    product.variants
      ?.slice(1)
      .map((variant) =>
        cleanTitle(variant.title)
          .replace(/\s+Air Filter$/i, "")
          .replace(/\s+Oil Filter$/i, "")
          .replace(/\s+Hydraulic Filter$/i, "")
          .trim()
      )
      .filter(Boolean)
      .slice(0, 3)
      .join(", ") || "";

  const title = `${primaryVariantTitle} | ${collection}`;

  const description = cleanMetaText(
    `${primaryVariantTitle} available in the Sparesco ${collection} catalogue. ${
      alternativePartNumbers
        ? `Alternative replacements include ${alternativePartNumbers}. `
        : ""
    }Browse specifications, dimensions and compatible replacement options.`
  );

  return {
    title,
    description,
    alternates: {
      canonical: `/products/${handle}`,
    },
    openGraph: {
      title,
      description,
      url: `/products/${handle}`,
      type: "website",
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getProductJson(handle);

  if (!product) {
    notFound();
  }

  return <ProductPageClient handle={handle} />;
}