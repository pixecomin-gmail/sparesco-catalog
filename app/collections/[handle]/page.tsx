export const runtime = "edge";

import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import CollectionProductCard from "@/components/CollectionProductCard";
import type { ProductIndexItem } from "@/lib/products";

type CollectionItem = {
  title: string;
  handle: string;
  count: number;
};

const PAGE_SIZE = 25;

type CollectionPageProps = {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<{ page?: string }>;
};

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host");

  if (host) {
    return `https://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

async function getCollections(): Promise<CollectionItem[]> {
  try {
    const baseUrl = await getBaseUrl();

    const res = await fetch(`${baseUrl}/data/collections.json`, {
      cache: "force-cache",
    });

    if (!res.ok) return [];

    return res.json();
  } catch {
    return [];
  }
}

async function getCollectionProducts(
  handle: string
): Promise<ProductIndexItem[]> {
  try {
    const baseUrl = await getBaseUrl();

    const res = await fetch(
      `${baseUrl}/data/collection-products/${handle}.json`,
      { cache: "force-cache" }
    );

    if (!res.ok) return [];

    return res.json();
  } catch {
    return [];
  }
}

function cleanMetaText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function uniqueValues(values: string[], limit = 6) {
  return Array.from(new Set(values.filter(Boolean))).slice(0, limit);
}

function getCollectionSeoDescription({
  collection,
  productCount,
  brands,
  categories,
}: {
  collection: CollectionItem;
  productCount: number;
  brands: string[];
  categories: string[];
}) {
  const countText = productCount.toLocaleString("en-IN");
  const title = collection.title;

  const brandText =
    brands.length > 0 ? ` Brands include ${brands.join(", ")}.` : "";

  const categoryText =
    categories.length > 0
      ? ` Product types include ${categories.join(", ")}.`
      : "";

  return cleanMetaText(
    `Browse ${countText} ${title.toLowerCase()} spare parts for construction, mining and industrial equipment.${brandText}${categoryText} Compare product specifications, replacement part numbers and submit enquiries through Sparesco.`
  );
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { handle } = await params;

  const collections = await getCollections();
  const collection = collections.find((item) => item.handle === handle);

  if (!collection) {
    return {
      title: "Collection Not Found",
    };
  }

  const collectionProducts = await getCollectionProducts(handle);

  const brands = uniqueValues(
    collectionProducts.map((product) => product.vendor),
    5
  );

  const categories = uniqueValues(
    collectionProducts.map((product) => product.category),
    4
  );

  const productCount = collectionProducts.length || collection.count;

  const title = `${collection.title} Spare Parts Catalogue | ${productCount.toLocaleString(
    "en-IN"
  )} Products`;

  const description = getCollectionSeoDescription({
    collection,
    productCount,
    brands,
    categories,
  });

  return {
    title,
    description,
    alternates: {
      canonical: `/collections/${collection.handle}`,
    },
    openGraph: {
      title,
      description,
      url: `/collections/${collection.handle}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CollectionDetailPage({
  params,
  searchParams,
}: CollectionPageProps) {
  const { handle } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const currentPage = Number(resolvedSearchParams.page || "1");

  const collections = await getCollections();
  const collection = collections.find((item) => item.handle === handle);

  if (!collection) {
    notFound();
  }

  const collectionProducts = await getCollectionProducts(handle);

  const totalPages = Math.max(
    1,
    Math.ceil(collectionProducts.length / PAGE_SIZE)
  );

  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const visibleProducts = collectionProducts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <main>
      <section className="section parts-section">
        <div className="container">
          <h1 className="page-title">{collection.title}</h1>

          <p className="page-intro">
            Browse {collectionProducts.length.toLocaleString("en-IN")}{" "}
            {collection.title.toLowerCase()} spare parts for construction,
            mining and industrial equipment.
          </p>

          <div className="parts-topbar">
            <strong>All Products</strong>
            <span>
              {collectionProducts.length.toLocaleString("en-IN")} products found
              · Page {safePage} of {totalPages}
            </span>
          </div>

          <div className="parts-product-grid">
            {visibleProducts.map((product) => (
              <CollectionProductCard product={product} key={product.handle} />
            ))}
          </div>

          {collectionProducts.length === 0 && (
            <p className="empty-message">No products found.</p>
          )}

          {collectionProducts.length > PAGE_SIZE && (
            <div className="pagination">
              {safePage > 1 ? (
                <Link
                  href={`/collections/${handle}?page=${safePage - 1}`}
                  className="pagination-button"
                >
                  Previous
                </Link>
              ) : (
                <span className="pagination-button pagination-button-disabled">
                  Previous
                </span>
              )}

              <span className="pagination-status">
                Page {safePage} of {totalPages}
              </span>

              {safePage < totalPages ? (
                <Link
                  href={`/collections/${handle}?page=${safePage + 1}`}
                  className="pagination-button"
                >
                  Next
                </Link>
              ) : (
                <span className="pagination-button pagination-button-disabled">
                  Next
                </span>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}