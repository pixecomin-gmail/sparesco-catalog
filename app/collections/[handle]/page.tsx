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

const PAGE_SIZE = 25;

function CollectionContent() {
  const params = useParams<{ handle: string }>();
  const searchParams = useSearchParams();

  const handle = params.handle;
  const currentPage = Number(searchParams.get("page") || "1");

  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [products, setProducts] = useState<ProductIndexItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadCollection() {
      try {
        const [collectionsRes, productsRes] = await Promise.all([
          fetch("/data/collections.json"),
          fetch(`/data/collection-products/${handle}.json`),
        ]);

        const collectionsData = collectionsRes.ok
          ? ((await collectionsRes.json()) as CollectionItem[])
          : [];

        const productsData = productsRes.ok
          ? ((await productsRes.json()) as ProductIndexItem[])
          : [];

        setCollections(collectionsData);
        setProducts(productsData);
      } catch {
        setCollections([]);
        setProducts([]);
      } finally {
        setLoaded(true);
      }
    }

    loadCollection();
  }, [handle]);

  const collection = useMemo(() => {
    return collections.find((item) => item.handle === handle) || null;
  }, [collections, handle]);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const visibleProducts = products.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  if (!loaded) return null;

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
      <section className="section parts-section">
        <div className="container">
          <h1 className="page-title">{collection.title}</h1>

          <p className="page-intro">
            Browse {products.length.toLocaleString("en-IN")}{" "}
            {collection.title.toLowerCase()} spare parts for construction,
            mining and industrial equipment.
          </p>

          <div className="parts-topbar">
            <strong>All Products</strong>
            <span>
              {products.length.toLocaleString("en-IN")} products found · Page{" "}
              {safePage} of {totalPages}
            </span>
          </div>

          <div className="parts-product-grid">
            {visibleProducts.map((product) => (
              <CollectionProductCard product={product} key={product.handle} />
            ))}
          </div>

          {products.length === 0 && (
            <p className="empty-message">No products found.</p>
          )}

          {products.length > PAGE_SIZE && (
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

export default function CollectionDetailPage() {
  return (
    <Suspense fallback={null}>
      <CollectionContent />
    </Suspense>
  );
}