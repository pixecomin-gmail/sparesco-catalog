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

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/parts?${params.toString()}`);
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
              <h3>Filter By</h3>

              <div className="filter-block">
                <h4>Category</h4>

                <label>
                  <input
                    type="radio"
                    name="category"
                    checked={!selectedCategory}
                    onChange={() => updateParam("category", "")}
                  />
                  All Categories
                </label>

                {categories.map((category) => (
                  <label key={category}>
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === category}
                      onChange={() => updateParam("category", category)}
                    />
                    {category}
                  </label>
                ))}
              </div>

              {brands.length > 0 && (
                <div className="filter-block">
                  <h4>Brand</h4>

                  <label>
                    <input
                      type="radio"
                      name="brand"
                      checked={!selectedBrand}
                      onChange={() => updateParam("brand", "")}
                    />
                    All Brands
                  </label>

                  {brands.slice(0, 20).map((brand) => (
                    <label key={brand}>
                      <input
                        type="radio"
                        name="brand"
                        checked={selectedBrand === brand}
                        onChange={() => updateParam("brand", brand)}
                      />
                      {brand}
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