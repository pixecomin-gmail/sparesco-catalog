export const runtime = "edge";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import collectionsData from "@/data/collections.json";
import { getAllProducts } from "@/lib/products";
import CollectionProductCard from "@/components/CollectionProductCard";

type CollectionItem = {
  title: string;
  handle: string;
  count: number;
};

const PAGE_SIZE = 25;
const collections = collectionsData as CollectionItem[];

type CollectionPageProps = {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<{ page?: string }>;
};

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

  if (title.toLowerCase().includes("air filter")) {
    return cleanMetaText(
      `Browse ${countText} ${title.toLowerCase()} for construction, mining, agricultural and industrial equipment.${brandText}${categoryText} Compare part numbers, dimensions, specifications and compatible replacement options on Sparesco.`
    );
  }

  if (title.toLowerCase().includes("compressed air")) {
    return cleanMetaText(
      `Browse ${countText} ${title.toLowerCase()} for compressors, pneumatic systems and industrial air applications.${brandText}${categoryText} Compare specifications, replacement part numbers and submit enquiries through Sparesco.`
    );
  }

  if (
    title.toLowerCase().includes("donaldson") ||
    title.toLowerCase().includes("eppensteiner") ||
    title.toLowerCase().includes("argo") ||
    title.toLowerCase().includes("domnick")
  ) {
    return cleanMetaText(
      `Browse ${countText} ${title} spare parts and replacement filter elements for industrial, hydraulic, compressor and heavy equipment applications.${categoryText} Compare part numbers, technical specifications and compatible replacements on Sparesco.`
    );
  }

  return cleanMetaText(
    `Browse ${countText} ${title.toLowerCase()} spare parts for construction, mining and industrial equipment.${brandText}${categoryText} Compare product specifications, replacement part numbers and submit enquiries through Sparesco.`
  );
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { handle } = await params;
  const collection = collections.find((item) => item.handle === handle);

  if (!collection) {
    return {
      title: "Collection Not Found",
    };
  }

  const products = getAllProducts();
  const collectionProducts = products.filter(
    (product) => product.collectionHandle === handle
  );

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

  const collection = collections.find((item) => item.handle === handle);

  if (!collection) {
    notFound();
  }

  const products = getAllProducts();
  const collectionProducts = products.filter(
    (product) => product.collectionHandle === handle
  );

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
          <div className="breadcrumb">Home / Categories / {collection.title}</div>

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