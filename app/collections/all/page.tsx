"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CollectionProductCard from "@/components/CollectionProductCard";
import type { ProductIndexItem } from "@/lib/products";

const PAGE_SIZE = 24;
const CATALOG_PAGE_SIZE = 24;

type CatalogMeta = {
  totalProducts: number;
  pageSize: number;
  totalPages: number;
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

function AllCollectionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<ProductIndexItem[]>([]);
  const [meta, setMeta] = useState<CatalogMeta | null>(null);
  const [filters, setFilters] = useState<FilterIndex>({
    categories: [],
    brands: [],
  });
  const [loaded, setLoaded] = useState(false);

  const currentPage = Math.max(
    Number(searchParams.get("page") || "1") || 1,
    1
  );

  useEffect(() => {
    async function loadProducts() {
      setLoaded(false);

      try {
        const [metaRes, filtersRes] = await Promise.all([
          fetch("/api/catalog-page?file=meta"),
          fetch("/api/catalog-page?file=filters"),
        ]);

        if (!metaRes.ok) {
          throw new Error("Catalog meta failed");
        }

        const nextMeta = (await metaRes.json()) as CatalogMeta;
        setMeta(nextMeta);

        if (filtersRes.ok) {
          const filterData = (await filtersRes.json()) as FilterIndex;

          setFilters({
            categories: Array.isArray(filterData.categories)
              ? filterData.categories
              : [],
            brands: Array.isArray(filterData.brands)
              ? filterData.brands
              : [],
          });
        }

        const catalogPage = Math.ceil(
          ((currentPage - 1) * PAGE_SIZE + 1) / CATALOG_PAGE_SIZE
        );

        const file = String(catalogPage).padStart(4, "0");

        const productsRes = await fetch(
          `/api/catalog-page?file=${file}`
        );

        if (!productsRes.ok) {
          throw new Error("Catalog page failed");
        }

        const data = (await productsRes.json()) as ProductIndexItem[];

        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setLoaded(true);
      }
    }

    loadProducts();
  }, [currentPage]);

  const totalProducts = meta?.totalProducts || 0;

  const totalPages = Math.max(
    1,
    Math.ceil(totalProducts / PAGE_SIZE)
  );

  const safePage = Math.min(
    Math.max(currentPage, 1),
    totalPages
  );

  const offsetInsideCatalogPage =
    ((safePage - 1) * PAGE_SIZE) % CATALOG_PAGE_SIZE;

  const visibleProducts = products.slice(
    offsetInsideCatalogPage,
    offsetInsideCatalogPage + PAGE_SIZE
  );

  function goToPage(page: number) {
    router.push(`/collections/all?page=${page}`);
  }

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
                    <article
                      className="parts-product-card"
                      key={index}
                    >
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

  return (
    <main>
      <section className="section parts-section parts-page-section">
        <div className="container">
          <h1 className="page-title">All Spare Parts</h1>

          <p className="page-intro">
            Browse industrial spare parts across all categories,
            collections and brands.
          </p>

          <div className="parts-layout">
            <button
              className="mobile-filter-button"
              onClick={() => setShowFilters(true)}
            >
              ☰ Filters
            </button>

            <aside
              className={`filters-sidebar ${
                showFilters ? "open" : ""
              }`}
            >
              <div className="filters-header">
                <h3>Filter By</h3>

                <button
                  className="mobile-filter-close"
                  onClick={() => setShowFilters(false)}
                  aria-label="Close filters"
                >
                  ✕
                </button>
              </div>

              <div className="filter-block">
                <h4>Category</h4>

                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked
                    readOnly
                    onClick={() =>
                      router.push("/collections/all")
                    }
                  />

                  <span>All Categories</span>

                  <em>
                    {totalProducts.toLocaleString("en-IN")}
                  </em>
                </label>

                {filters.categories.map((item) => (
                  <label
                    className="filter-option"
                    key={item.handle}
                  >
                    <input
                      type="checkbox"
                      checked={false}
                      readOnly
                      onClick={() =>
                        router.push(
                          `/collections/${item.handle}`
                        )
                      }
                    />

                    <span>{item.title}</span>

                    <em>
                      {item.count.toLocaleString("en-IN")}
                    </em>
                  </label>
                ))}
              </div>
            </aside>

            <div className="parts-content">
              <div className="parts-topbar">
                <strong>All Spare Parts</strong>

                <span>
                  {totalProducts.toLocaleString("en-IN")} products
                  {" · "}
                  Page {safePage} of {totalPages}
                </span>
              </div>

              <div className="parts-product-grid parts-product-grid-four">
                {visibleProducts.map((product, index) => (
                  <CollectionProductCard
                    key={`${product.handle}-${product.collection}-${product.partNumber}-${index}`}
                    product={product}
                  />
                ))}
              </div>

              {visibleProducts.length === 0 && (
                <p className="empty-message">
                  No products found.
                </p>
              )}

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
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function AllCollectionsPage() {
  return (
    <Suspense
      fallback={
        <main>
          <section className="section parts-section parts-page-section">
            <div className="container">
              <h1 className="page-title">
                All Spare Parts
              </h1>

              <p className="page-intro">
                Browse industrial spare parts across all categories,
                collections and brands.
              </p>
            </div>
          </section>
        </main>
      }
    >
      <AllCollectionsContent />
    </Suspense>
  );
}