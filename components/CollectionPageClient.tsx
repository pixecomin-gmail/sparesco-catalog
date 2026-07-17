"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import CollectionProductCard from "@/components/CollectionProductCard";
import type { ProductIndexItem } from "@/lib/products";

type CollectionItem = {
  title: string;
  handle: string;
  count: number;
};

type FilterItem = {
  handle: string;
  title: string;
  count: number;
};

type FilterIndex = {
  categories: FilterItem[];
  brands: FilterItem[];
};

type CollectionPageClientProps = {
  initialCollections?: CollectionItem[];
  initialFilters?: FilterIndex;
  initialProducts?: ProductIndexItem[];
  initialHandle?: string;
  initialPage?: number;
};

const PAGE_SIZE = 24;

function CollectionContent({
  initialCollections = [],
  initialFilters = {
    categories: [],
    brands: [],
  },
  initialProducts = [],
  initialHandle = "",
  initialPage = 1,
}: CollectionPageClientProps) {
  const router = useRouter();
  const params = useParams<{ handle: string }>();
  const searchParams = useSearchParams();

  const handle = params.handle;
  const requestedPage = Number(searchParams.get("page") || "1");

  const [collections, setCollections] =
  useState<CollectionItem[]>(initialCollections);

  const [filters, setFilters] =
    useState<FilterIndex>(initialFilters);

  const [products, setProducts] =
    useState<ProductIndexItem[]>(initialProducts);

  const hasInitialData =
    initialHandle === handle &&
    initialPage === requestedPage &&
    initialCollections.length > 0;

  const [loaded, setLoaded] = useState(hasInitialData);
  const [showFilters, setShowFilters] = useState(false);

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
    if (hasInitialData) return;

    async function loadCollection() {
      if (!handle) return;

      setLoaded(false);

      try {
        const [collectionsRes, filtersRes, productsRes] = await Promise.all([
          fetch("/api/collections"),
          fetch("/api/catalog-page?file=filters"),
          fetch(`/api/catalog-page?file=category:${handle}:${fetchPage}`),
        ]);

        setCollections(
          collectionsRes.ok
            ? ((await collectionsRes.json()) as CollectionItem[])
            : []
        );

        setFilters(
          filtersRes.ok
            ? ((await filtersRes.json()) as FilterIndex)
            : { categories: [], brands: [] }
        );

        setProducts(
          productsRes.ok
            ? ((await productsRes.json()) as ProductIndexItem[])
            : []
        );
      } catch {
        setCollections([]);
        setFilters({ categories: [], brands: [] });
        setProducts([]);
      } finally {
        setLoaded(true);
      }
    }

    loadCollection();
  }, [handle, fetchPage, hasInitialData]);

  if (!loaded) {
    return (
      <main>
        <section className="section parts-section parts-page-section">
          <div className="container">
            <div
              style={{
                width: 280,
                height: 34,
                borderRadius: 6,
                background: "#e7e7e7",
                marginBottom: 18,
              }}
            />

            <div
              style={{
                width: "52%",
                maxWidth: 620,
                height: 18,
                borderRadius: 6,
                background: "#ececec",
                marginBottom: 34,
              }}
            />

            <div className="parts-layout">
              <button className="mobile-filter-button" disabled>
                ☰ Filters
              </button>

              <aside className="filters-sidebar">
                <div className="filters-header">
                  <div
                    style={{
                      width: 110,
                      height: 22,
                      borderRadius: 5,
                      background: "#e5e5e5",
                    }}
                  />
                </div>

                <div className="filter-block">
                  <div
                    style={{
                      width: 100,
                      height: 20,
                      borderRadius: 5,
                      background: "#e8e8e8",
                      marginBottom: 24,
                    }}
                  />

                  {Array.from({ length: 9 }).map((_, index) => (
                    <div
                      key={index}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "22px 1fr 54px",
                        gap: 12,
                        alignItems: "center",
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 4,
                          background: "#e8e8e8",
                        }}
                      />

                      <div
                        style={{
                          width: `${72 + (index % 3) * 8}%`,
                          height: 16,
                          borderRadius: 5,
                          background: "#ececec",
                        }}
                      />

                      <div
                        style={{
                          width: 54,
                          height: 24,
                          borderRadius: 14,
                          background: "#edf0f2",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </aside>

              <div className="parts-content">
                <div className="parts-topbar">
                  <div
                    style={{
                      width: 160,
                      height: 22,
                      borderRadius: 5,
                      background: "#e5e5e5",
                    }}
                  />

                  <div
                    style={{
                      width: 220,
                      height: 18,
                      borderRadius: 5,
                      background: "#ececec",
                    }}
                  />
                </div>

                <div className="parts-product-grid parts-product-grid-four">
                  {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                    <article className="parts-product-card" key={index}>
                      <div
                        className="parts-product-image"
                        style={{
                          minHeight: 228,
                          background: "#eeeeee",
                        }}
                      />

                      <div className="parts-product-info">
                        <div
                          style={{
                            width: "76%",
                            height: 22,
                            borderRadius: 5,
                            background: "#e6e6e6",
                            marginBottom: 16,
                          }}
                        />

                        <div
                          style={{
                            width: "58%",
                            height: 16,
                            borderRadius: 5,
                            background: "#ededed",
                            marginBottom: 24,
                          }}
                        />

                        <div
                          style={{
                            width: "100%",
                            height: 52,
                            borderRadius: 2,
                            background: "#e2e2e2",
                          }}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
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
            <button
              className="mobile-filter-button"
              onClick={() => setShowFilters(true)}
            >
              ☰ Filters
            </button>

            <aside className={`filters-sidebar ${showFilters ? "open" : ""}`}>
              <div className="filters-header">
                <h3>Filter By</h3>

                <button
                  className="mobile-filter-close"
                  onClick={() => setShowFilters(false)}
                >
                  ✕
                </button>
              </div>

              <div className="filter-block">
                <h4>Collections</h4>

                {collections.map((item) => (
                  <label className="filter-option" key={item.handle}>
                    <input
                      type="checkbox"
                      checked={item.handle === handle}
                      readOnly
                      onClick={() => {
                        setShowFilters(false);
                        router.push(`/collections/${item.handle}`);
                      }}
                    />
                    <span>{item.title}</span>
                    <em>{item.count.toLocaleString("en-IN")}</em>
                  </label>
                ))}
              </div>
            </aside>

            <div className="parts-content">
              <div className="parts-topbar">
                <strong>{collection.title}</strong>
                <span>
                  {collection.count.toLocaleString("en-IN")} products · Page{" "}
                  {safePage} of {totalPages}
                </span>
              </div>

              <div className="parts-product-grid parts-product-grid-four">
                {products.map((product, index) => (
                  <CollectionProductCard
                    key={`${product.handle}-${product.collection}-${product.partNumber}-${index}`}
                    product={product}
                  />
                ))}
              </div>

              {products.length === 0 && (
                <p className="empty-message">No products found.</p>
              )}

              {totalPages > 1 && (
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
          </div>
        </div>
      </section>
    </main>
  );
}

export default function CollectionPageClient(
  props: CollectionPageClientProps
) {
  return (
    <Suspense fallback={null}>
      <CollectionContent {...props} />
    </Suspense>
  );
}