export const runtime = "edge";

import { cache } from "react";
import type { Metadata } from "next";
import ProductPageClient from "@/components/ProductPageClient";
import type { Product } from "@/types/product";

type ProductPageProps = {
  params: Promise<{ handle: string }>;
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

const getProduct = cache(
  async (handle: string): Promise<Product | null> => {
    if (!r2Base) return null;

    const base = r2Base.replace(/\/$/, "");
    const folder = productFolder(handle);

    const urls = [
      `${base}/catalog/products/${folder}/${handle}.json`,
      `${base}/catalog/products/${handle}.json`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          cache: "no-store",
        });

        if (!res.ok) continue;

        return (await res.json()) as Product;
      } catch {
        // Try the next product location.
      }
    }

    return null;
  }
);

function cleanText(value?: string) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function replaceFilterFinder(value?: string) {
  if (!value) return "";

  let text = String(value);

  // Remove sentences that would create false claims about Sparesco
  text = text.replace(
    /[^.!?]*(?:filter\s*finder|filterfinder)[^.!?]*(?:approved|authorised|authorized|official)\s+(?:distributor|dealer|supplier|partner)[^.!?]*[.!?]?/gi,
    " "
  );

  text = text.replace(
    /[^.!?]*(?:approved|authorised|authorized|official)\s+(?:distributor|dealer|supplier|partner)[^.!?]*(?:filter\s*finder|filterfinder)[^.!?]*[.!?]?/gi,
    " "
  );

  // Replace FilterFinder URLs
  text = text.replace(
    /https?:\/\/(?:www\.)?filterfinder\.[^\s]+/gi,
    "https://sparesco.com"
  );

  text = text.replace(
    /www\.filterfinder\.[^\s]+/gi,
    "sparesco.com"
  );

  // Replace normal FilterFinder references
  text = text.replace(/\bfilter\s*finder\b/gi, "Sparesco");
  text = text.replace(/\bfilterfinder\b/gi, "Sparesco");

  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(
    /</g,
    "\\u003c"
  );
}

function cleanProductTitle(value?: string) {
  return replaceFilterFinder(cleanText(value))
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

function getProductImage(product: Product) {
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
  product: Product,
  fallbackHandle: string
) {
  const variant = product.variants?.[0];

  const partNumber = cleanText(
    product.title ||
    product.handle ||
    fallbackHandle
  );

  const productTitle = cleanProductTitle(
    variant?.title ||
    product.title ||
    partNumber
  );

  const primaryPartNumber = cleanText(
    variant?.partNumber
  );

  const titleIncludesReference =
    productTitle
      .replace(/[\s-]/g, "")
      .toLowerCase()
      .includes(
        partNumber
          .replace(/[\s-]/g, "")
          .toLowerCase()
      );

  const seoTitle =
    titleIncludesReference
      ? productTitle
      : `${partNumber} | ${productTitle}`;

  const brand = replaceFilterFinder(
    cleanText(variant?.vendor)
  );

  const category = replaceFilterFinder(
    titleFromHandle(
      product.collection || product.category
    )
  );

  const replacementReferences =
    product.variants
      ?.slice(1)
      .map((item) => {
        const vendor = replaceFilterFinder(
          cleanText(item.vendor)
        );

        const replacementPartNumber =
          cleanText(item.partNumber);

        if (!replacementPartNumber) return "";

        return vendor
          ? `${vendor} ${replacementPartNumber}`
          : replacementPartNumber;
      })
      .filter(Boolean) || [];

  const replacementText =
    replacementReferences.join(", ");

  const metaTitle = seoTitle;

  const metaDescription =
    replacementReferences.length > 0
      ? `${partNumber} - ${productTitle}. Primary part number ${primaryPartNumber || partNumber}. Cross references include ${replacementText}. View specifications and enquire for pricing and availability.`
      : `${partNumber} - ${productTitle}. Part number ${primaryPartNumber || partNumber}. View technical specifications and enquire with Sparesco for pricing and availability.`;

  return {
    variant,
    partNumber,
    primaryPartNumber,
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

  const product = await getProduct(handle);

  if (!product) {
    return (
      <ProductPageClient
        handle={handle}
        initialProduct={null}
      />
    );
  }

  const seo = getSeoData(product, handle);

  const canonical =
    `${siteUrl}/products/${handle}`;

  const image = getProductImage(product);

  const firstVariant =
    product.variants?.[0];

    const prices =
    product.variants
      ?.map((variant) =>
        Number(variant.price || 0)
      )
      .filter((value) => value > 0) || [];

  const price =
    prices.length > 0
      ? Math.min(...prices)
      : 0;

  const primaryPartNumber =
    cleanText(firstVariant?.partNumber);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: seo.productTitle,
    description: seo.metaDescription,
    url: canonical,
    image: [image],
    sku: cleanText(firstVariant?.sku) || seo.partNumber,

    ...(primaryPartNumber
      ? {
        mpn: primaryPartNumber,
      }
      : {}),

    ...(seo.category
      ? {
        category: seo.category,
      }
      : {}),

    ...(seo.brand
      ? {
        brand: {
          "@type": "Brand",
          name: seo.brand,
        },
      }
      : {}),

    ...(price > 0
      ? {
        offers: {
          "@type": "Offer",
          url: canonical,
          priceCurrency: "INR",
          price,
          itemCondition:
            "https://schema.org/NewCondition",
          seller: {
            "@type": "Organization",
            name: "Sparesco",
          },
        },
      }
      : {}),
  };

  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Spare Parts",
      item: `${siteUrl}/collections`,
    },
  ];

  if (product.collection) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name:
        seo.category ||
        titleFromHandle(
          product.collection
        ),
      item:
        `${siteUrl}/collections/${product.collection}`,
    });
  }

  breadcrumbItems.push({
    "@type": "ListItem",
    position:
      breadcrumbItems.length + 1,
    name: seo.productTitle,
    item: canonical,
  });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement:
      breadcrumbItems,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(productSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(breadcrumbSchema),
        }}
      />

      <ProductPageClient
        handle={handle}
        initialProduct={product}
      />
    </>
  );
}