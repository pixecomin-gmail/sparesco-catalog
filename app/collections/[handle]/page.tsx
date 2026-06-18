import Link from "next/link";
import { notFound } from "next/navigation";
import collectionsData from "@/data/collections.json";
import { getAllProducts } from "@/lib/products";

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
          <h1 className="page-title">{collection.title}</h1>

          <p className="page-intro">
            Explore industrial spare parts in {collection.title}.
          </p>

          <div className="parts-content">
            <div className="parts-topbar">
              <strong>All Products</strong>
              <span>
                {collectionProducts.length} products found · Page {safePage} of{" "}
                {totalPages}
              </span>
            </div>

            <div className="parts-product-grid">
              {visibleProducts.map((product) => (
                <article className="parts-product-card" key={product.handle}>
                  <Link
                    href={`/products/${product.handle}`}
                    className="parts-product-image"
                    aria-label={product.title}
                  >
                    {product.image ? (
                      <img src={product.image} alt={product.title} />
                    ) : (
                      <span>No Image</span>
                    )}
                  </Link>

                  <div className="parts-product-info">
                    <h3>
                      <Link href={`/products/${product.handle}`}>
                        {product.title}
                      </Link>
                    </h3>

                    <p>
                      {product.collection}
                      {product.variantCount > 1
                        ? ` • ${product.variantCount} options`
                        : ""}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            {collectionProducts.length === 0 && (
              <p className="empty-message">No products found.</p>
            )}

            {collectionProducts.length > PAGE_SIZE && (
              <div className="pagination">
                {safePage > 1 ? (
                  <Link href={`/collections/${handle}?page=${safePage - 1}`}>
                    Previous
                  </Link>
                ) : (
                  <span>Previous</span>
                )}

                <span>
                  Page {safePage} of {totalPages}
                </span>

                {safePage < totalPages ? (
                  <Link href={`/collections/${handle}?page=${safePage + 1}`}>
                    Next
                  </Link>
                ) : (
                  <span>Next</span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}