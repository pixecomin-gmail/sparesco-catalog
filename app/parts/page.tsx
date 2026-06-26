"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CollectionProductCard from "@/components/CollectionProductCard";
import type { ProductIndexItem } from "@/lib/products";

const PAGE_SIZE = 24;

function PartsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<ProductIndexItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/data/products-index.json");
        const data = (await res.json()) as ProductIndexItem[];
        setProducts(data);
      } finally {
        setLoaded(true);
      }
    }

    loadProducts();
  }, []);

  const categories = useMemo(() => {
    return Array.from(
      new Set(products.map((product) => product.category).filter(Boolean))
    );
  }, [products]);

  const brands = useMemo(() => {
    return Array.from(
      new Set(products.map((product) => product.vendor).filter(Boolean))
    );
  }, [products]);

  const currentPage = Number(searchParams.get("page") || "1");
  const selectedCategory = searchParams.get("category") || "";
  const selectedBrand = searchParams.get("brand") || "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) params.set(key, value);
    else params.delete(key);

    params.set("page", "1");
    router.push(`/parts?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/parts");
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/parts?${params.toString()}`);
  }

  function getCount(key: "category" | "vendor", value: string) {
    return products.filter((product) => product[key] === value).length;
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch =
        !selectedCategory || product.category === selectedCategory;

      const brandMatch =
        !selectedBrand || product.vendor === selectedBrand;

      return categoryMatch && brandMatch;
    });
  }, [products, selectedCategory, selectedBrand]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE)
  );

  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const visibleProducts = filteredProducts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  // IMPORTANT: Loading UI comes AFTER all hooks
  if (!loaded) {
    return (
      <main>
        <section className="section parts-section">
          <div className="container">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line" />

            <div className="parts-product-grid parts-product-grid-four">
              {Array.from({ length: 8 }).map((_, i) => (
                <article className="parts-product-card" key={i}>
                  <div className="skeleton-box skeleton-product-image" />
                  <div style={{ padding: 16 }}>
                    <div className="skeleton-line" />
                    <div className="skeleton-line skeleton-short" />
                  </div>
                </article>
              ))}
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
          <h1 className="page-title">Browse Spare Parts</h1>

          <p className="page-intro">
            Explore industrial spare parts by category, collection and brand.
          </p>

          <div className="parts-layout">
            <aside className="filters-sidebar">
              <div className="filters-header">
                <h3>Filter By</h3>

                {(selectedCategory || selectedBrand) && (
                  <button type="button" onClick={clearFilters}>
                    Clear all
                  </button>
                )}
              </div>

              <div className="filter-block">
                <h4>Category</h4>

                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={!selectedCategory}
                    onChange={() => updateParam("category", "")}
                  />
                  <span>All Categories</span>
                  <em>{products.length}</em>
                </label>

                {categories.map((category) => (
                  <label className="filter-option" key={category}>
                    <input
                      type="checkbox"
                      checked={selectedCategory === category}
                      onChange={() =>
                        updateParam(
                          "category",
                          selectedCategory === category ? "" : category
                        )
                      }
                    />
                    <span>{category}</span>
                    <em>{getCount("category", category)}</em>
                  </label>
                ))}
              </div>

              {brands.length > 0 && (
                <div className="filter-block">
                  <h4>Brand</h4>

                  <label className="filter-option">
                    <input
                      type="checkbox"
                      checked={!selectedBrand}
                      onChange={() => updateParam("brand", "")}
                    />
                    <span>All Brands</span>
                    <em>{products.length}</em>
                  </label>

                  {brands.slice(0, 20).map((brand) => (
                    <label className="filter-option" key={brand}>
                      <input
                        type="checkbox"
                        checked={selectedBrand === brand}
                        onChange={() =>
                          updateParam(
                            "brand",
                            selectedBrand === brand ? "" : brand
                          )
                        }
                      />
                      <span>{brand}</span>
                      <em>{getCount("vendor", brand)}</em>
                    </label>
                  ))}
                </div>
              )}
            </aside>

            <div className="parts-content">
              <div className="parts-topbar">
                <strong>All Spare Parts</strong>

                <span>
                  {filteredProducts.length.toLocaleString("en-IN")} products
                  found · Page {safePage} of {totalPages}
                </span>
              </div>

              <div className="parts-product-grid parts-product-grid-four">
                {visibleProducts.map((product) => (
                  <CollectionProductCard
                    key={product.handle}
                    product={product}
                  />
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <p className="empty-message">No products found.</p>
              )}

              {filteredProducts.length > PAGE_SIZE && (
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
        </div>
      </section>
    </main>
  );
}

export default function PartsPage() {
  return (
    <Suspense fallback={null}>
      <PartsContent />
    </Suspense>
  );
}