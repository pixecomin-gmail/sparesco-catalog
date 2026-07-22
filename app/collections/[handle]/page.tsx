export const runtime = "edge";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import CollectionPageClient from "@/components/CollectionPageClient";
import type { ProductIndexItem } from "@/lib/products";

type CollectionItem = {
  title: string;
  handle: string;
  count: number;
};

type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ page?: string }>;
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sparesco.com";

function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function cleanTitle(handle: string) {
  return handle
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function getBaseUrl() {
  const headerStore = await headers();

  const host =
    headerStore.get("x-forwarded-host") ||
    headerStore.get("host");

  const protocol =
    headerStore.get("x-forwarded-proto") ||
    (host?.includes("localhost") ? "http" : "https");

  if (!host) {
    return "";
  }

  return `${protocol}://${host}`;
}

async function loadCollectionPage(handle: string, requestedPage: number) {
  try {
    const baseUrl = await getBaseUrl();

    if (!baseUrl) {
      return {
        collections: [] as CollectionItem[],
        products: [] as ProductIndexItem[],
        page: requestedPage,
      };
    }

    const collectionsResponse = await fetch(
      `${baseUrl}/api/collections`,
      {
        cache: "no-store",
      }
    );

    const collections: CollectionItem[] = collectionsResponse.ok
      ? await collectionsResponse.json()
      : [];

    const collection =
      collections.find((item) => item.handle === handle) || null;

    const totalPages = Math.max(
      1,
      Math.ceil((collection?.count || 0) / 24)
    );

    const safePage = Math.min(
      Math.max(requestedPage, 1),
      totalPages
    );

    const fetchPage = String(safePage).padStart(4, "0");

    const productsResponse = await fetch(
      `${baseUrl}/api/catalog-page?file=category:${handle}:${fetchPage}`,
      {
        cache: "no-store",
      }
    );

    const products: ProductIndexItem[] = productsResponse.ok
      ? await productsResponse.json()
      : [];

    return {
      collections,
      products,
      page: safePage,
    };
  } catch {
    return {
      collections: [] as CollectionItem[],
      products: [] as ProductIndexItem[],
      page: requestedPage,
    };
  }
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { handle } = await params;
  const title = cleanTitle(handle);

  const metaTitle = `${title} Filters, Spare Parts & Cross Reference`;
  const metaDescription = `Browse ${title} filters, spare parts and cross reference products. View specifications and send enquiries to Sparesco.`;
  const canonical = `/collections/${handle}`;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${metaTitle} | Sparesco`,
      description: metaDescription,
      url: canonical,
      siteName: "Sparesco",
      type: "website",
      images: [
        {
          url: "/logo.png",
          width: 1200,
          height: 630,
          alt: `${title} Spare Parts`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${metaTitle} | Sparesco`,
      description: metaDescription,
      images: ["/logo.png"],
    },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: Props) {
  const { handle } = await params;
  const resolvedSearchParams = await searchParams;

  const requestedPage = Math.max(
    Number(resolvedSearchParams.page || "1") || 1,
    1
  );

  const { collections, products, page } =
    await loadCollectionPage(handle, requestedPage);

  const collection =
    collections.find((item) => item.handle === handle) || null;

  const collectionTitle = collection?.title || cleanTitle(handle);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Collections",
        item: `${siteUrl}/collections`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: collectionTitle,
        item: `${siteUrl}/collections/${handle}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(breadcrumbSchema),
        }}
      />

      <Suspense fallback={null}>
        <CollectionPageClient
          initialCollections={collections}
          initialProducts={products}
          initialHandle={handle}
          initialPage={page}
        />
      </Suspense>
    </>
  );
}