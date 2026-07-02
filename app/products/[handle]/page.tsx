export const runtime = "edge";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductPageClient from "@/components/ProductPageClient";
import { getProduct } from "@/lib/catalog";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sparesco.com";

type ProductPageProps = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;

  try {
    const product = await getProduct(handle);

    const title = `${product.title} | Sparesco`;
    const description = product.variants
      ?.map((variant) => variant.title)
      .filter(Boolean)
      .join(", ")
      .slice(0, 155);

    return {
      title,
      description:
        description ||
        `${product.title} spare part available for enquiry at Sparesco.`,
      alternates: {
        canonical: `${siteUrl}/products/${product.handle}`,
      },
      openGraph: {
        title,
        description:
          description ||
          `${product.title} spare part available for enquiry at Sparesco.`,
        url: `${siteUrl}/products/${product.handle}`,
        type: "website",
      },
    };
  } catch {
    return {
      title: "Product Not Found | Sparesco",
    };
  }
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { handle } = await params;

  try {
    await getProduct(handle);
  } catch {
    notFound();
  }

  return <ProductPageClient handle={handle} />;
}