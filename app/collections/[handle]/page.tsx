"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import CollectionProductCard from "@/components/CollectionProductCard";
import type { ProductIndexItem } from "@/lib/products";

type CollectionItem = {
  title: string;
  handle: string;
  count: number;
};

const PAGE_SIZE = 24;

function CollectionContent() {
  const params = useParams<{ handle: string }>();
  const searchParams = useSearchParams();

  const handle = params.handle;
  const requestedPage = Number(searchParams.get("page") || "1");

  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [products, setProducts] = useState<ProductIndexItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const collection = useMemo(
    () => collections.find((item) => item.handle === handle) || null,
    [collections, handle]
  );

  const totalPages = Math.max(
    1,
    Math.ceil((collection?.count || 0) / PAGE_SIZE)
  );

  const safePage = Math.min(Math.max(requestedPage, 1), totalPages);
  const fetchPage = String(safePage).padStart(4, "0");

  useEffect(() => {
    async function loadCollection() {
      if (!handle) return;

      setLoaded(false);

      try {
        const [collectionsRes, productsRes] = await Promise.all([
          fetch("/api/collections"),
          fetch(`/api/catalog-page?file=category:${handle}:${fetchPage}`),
        ]);

        setCollections(
          collectionsRes.ok
            ? ((await collectionsRes.json()) as CollectionItem[])
            : []
        );

        setProducts(
          productsRes.ok
            ? ((await productsRes.json()) as ProductIndexItem[])
            : []
        );
      } catch {
        setCollections([]);
        setProducts([]);
      } finally {
        setLoaded(true);
      }
    }

    loadCollection();
  }, [handle, fetchPage]);

  if (!loaded) {
    return (
      <main>
        <section className="section parts-section">
          <div className="container">
            <p>Loading products...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!collection) {
    return (
      <main>
        <section className="section parts-section">
          <div className="container">
            <h1 className="page-title">Collection Not Found</h1>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="section parts-section parts-page-section">
        <div className="container">
          <h1 className="page-title">{collection.title}</h1>

          <p className="page-intro">
            Browse {collection.count.toLocaleString("en-IN")}{" "}
            {collection.title.toLowerCase()} spare parts for construction,
            mining and industrial equipment.
          </p>

          <div className="parts-layout">
            <aside className="filters-sidebar">
              <div className="filters-header">
                <h3>Filter By</h3>
              </div>

              <div className="filter-block">
                <h4>Collections</h4>

                {collections.map((item) => (
                  <Link
                    key={item.handle}
                    href={`/collections/${item.handle}`}
                    className="filter-option"
                  >
                    <input
                      type="checkbox"
                      checked={item.handle === handle}
                      readOnly
                    />
                    <span>{item.title}</span>
                    <em>{item.count.toLocaleString("en-IN")}</em>
                  </Link>
                ))}
              </div>
            </aside>

            <div className="parts-content">
              <div className="parts-topbar">
                <strong>All Products</strong>
                <span>
                  {collection.count.toLocaleString("en-IN")} products found ·
                  Page {safePage} of {totalPages}
                </span>
              </div>

              <div className="parts-product-grid parts-product-grid-four">
                {products.map((product, index) => (
                  <CollectionProductCard
                    key={`${product.handle}-${index}`}
                    product={product}
                  />
                ))}
              </div>

              {products.length === 0 && (
                <p className="empty-message">No products found.</p>
              )}

              {totalPages > 1 && (
                <div className="pagination">
                  <Link
                    href={`/collections/${handle}?page=${safePage - 1}`}
                    className={`pagination-button ${
                      safePage === 1 ? "pagination-button-disabled" : ""
                    }`}
                  >
                    Previous
                  </Link>

                  <span className="pagination-status">
                    Page {safePage} of {totalPages}
                  </span>

                  <Link
                    href={`/collections/${handle}?page=${safePage + 1}`}
                    className={`pagination-button ${
                      safePage === totalPages
                        ? "pagination-button-disabled"
                        : ""
                    }`}
                  >
                    Next
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function CollectionDetailPage() {
  return (
    <Suspense fallback={null}>
      <CollectionContent />
    </Suspense>
  );
}