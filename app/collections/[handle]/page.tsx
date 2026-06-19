import { notFound } from "next/navigation";
import collectionsData from "@/data/collections.json";
import { getAllProducts } from "@/lib/products";
import CollectionProductCard from "@/components/CollectionProductCard";

type CollectionItem = {
  title: string;
  handle: string;
  count: number;
};

const PAGE_SIZE = 24;
const collections = collectionsData as CollectionItem[];

export default async function CollectionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
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

  const totalPages = Math.max(1, Math.ceil(collectionProducts.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const visibleProducts = collectionProducts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <main>
      <section className="section parts-section">
        <div className="container">
          <div className="breadcrumb">
            Home / Categories / {collection.title}
          </div>

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
                <a href={`/collections/${handle}?page=${safePage - 1}`}>
                  Previous
                </a>
              ) : (
                <span>Previous</span>
              )}

              <span>
                Page {safePage} of {totalPages}
              </span>

              {safePage < totalPages ? (
                <a href={`/collections/${handle}?page=${safePage + 1}`}>
                  Next
                </a>
              ) : (
                <span>Next</span>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}