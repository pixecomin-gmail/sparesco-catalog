"use client";

import { useMemo } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import collectionsData from "@/data/collections.json";
import { getAllProducts } from "@/lib/products";

type CollectionItem = {
  title: string;
  handle: string;
  count: number;
};

const PAGE_SIZE = 24;
const collections = collectionsData as CollectionItem[];
const products = getAllProducts();

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handle = String(params.handle || "");
  const currentPage = Number(searchParams.get("page") || "1");

  const collection = collections.find((item) => item.handle === handle);

  if (!collection) {
    notFound();
  }

  const collectionProducts = useMemo(() => {
    return products.filter((product) => product.collectionHandle === handle);
  }, [handle]);

  const totalPages = Math.max(
    1,
    Math.ceil(collectionProducts.length / PAGE_SIZE)
  );

  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const visibleProducts = collectionProducts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  function goToPage(page: number) {
    router.push(`/collections/${handle}?page=${page}`);
  }

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
                <button
                  disabled={safePage === 1}
                  onClick={() => goToPage(safePage - 1)}
                >
                  Previous
                </button>

                <span>
                  Page {safePage} of {totalPages}
                </span>

                <button
                  disabled={safePage === totalPages}
                  onClick={() => goToPage(safePage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}