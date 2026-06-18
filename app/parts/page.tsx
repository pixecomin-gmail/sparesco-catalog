"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllProducts, getBrands, getCategories } from "@/lib/products";

const products = getAllProducts();
const categories = getCategories();
const brands = getBrands();
const PAGE_SIZE = 24;

export default function PartsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page") || "1");
  const selectedCategory = searchParams.get("category") || "";
  const selectedBrand = searchParams.get("brand") || "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

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

      const brandMatch = !selectedBrand || product.vendor === selectedBrand;

      return categoryMatch && brandMatch;
    });
  }, [selectedCategory, selectedBrand]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const visibleProducts = filteredProducts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <main>
      <section className="section parts-section">
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
                  {filteredProducts.length} products found · Page {safePage} of{" "}
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