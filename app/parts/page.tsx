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

function PartsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<ProductIndexItem[]>([]);
  const [meta, setMeta] = useState<CatalogMeta | null>(null);
  const [filters, setFilters] = useState<FilterIndex>({
    categories: [],
    brands: [],
  });
  const [loaded, setLoaded] = useState(false);

  const currentPage = Number(searchParams.get("page") || "1");
  const selectedCategory = searchParams.get("category") || "";

  const selectedCategoryItem = filters.categories.find(
    (item) => item.handle === selectedCategory
  );

  const activeTotalProducts = selectedCategoryItem?.count || meta?.totalProducts || 0;

  useEffect(() => {
    async function loadProducts() {
      setLoaded(false);

      try {
        const [metaRes, filtersRes] = await Promise.all([
          fetch("/api/catalog-page?file=meta"),
          fetch("/api/catalog-page?file=filters"),
        ]);

        if (!metaRes.ok) throw new Error("Catalog meta failed");

        const nextMeta = (await metaRes.json()) as CatalogMeta;
        setMeta(nextMeta);

        if (filtersRes.ok) {
          const filterData = (await filtersRes.json()) as FilterIndex;
          setFilters(filterData);
        }

        const catalogPage = Math.ceil(
          ((currentPage - 1) * PAGE_SIZE + 1) / CATALOG_PAGE_SIZE
        );

        const file = String(catalogPage).padStart(4, "0");
        const productsRes = await fetch(
          selectedCategory
            ? `/api/catalog-page?file=category:${selectedCategory}:${file}`
            : `/api/catalog-page?file=${file}`
        );

        if (!productsRes.ok) throw new Error("Catalog page failed");

        const data = (await productsRes.json()) as ProductIndexItem[];
        setProducts(data);
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setLoaded(true);
      }
    }

    loadProducts();
  }, [currentPage, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(activeTotalProducts / PAGE_SIZE));

  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const offsetInsideCatalogPage =
    ((safePage - 1) * PAGE_SIZE) % CATALOG_PAGE_SIZE;

  const visibleProducts = products.slice(
    offsetInsideCatalogPage,
    offsetInsideCatalogPage + PAGE_SIZE
  );

  function goToPage(page: number) {
    router.push(
      selectedCategory
        ? `/parts?category=${selectedCategory}&page=${page}`
        : `/parts?page=${page}`
    );
  }

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
              </div>

              <div className="filter-block">
                <h4>Category</h4>

                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={!selectedCategory}
                    readOnly
                    onClick={() => router.push("/parts")}
                  />
                  <span>All Categories</span>
                  <em>{meta?.totalProducts.toLocaleString("en-IN") || 0}</em>
                </label>

                {filters.categories.map((item) => (
                  <label className="filter-option" key={item.handle}>
                    <input
                      type="checkbox"
                      checked={selectedCategory === item.handle}
                      readOnly
                      onClick={() => router.push(`/parts?category=${item.handle}`)}
                    />
                    <span>{item.title}</span>
                    <em>{item.count.toLocaleString("en-IN")}</em>
                  </label>
                ))}
              </div>

              <div className="filter-block">
                <h4>Brand</h4>

                {filters.brands.slice(0, 30).map((item) => (
                  <label className="filter-option" key={item.handle}>
                    <input
                      type="checkbox"
                      checked={false}
                      readOnly
                      onClick={() =>
                        router.push(`/search?q=${encodeURIComponent(item.title)}`)
                      }
                    />
                    <span>{item.title}</span>
                    <em>{item.count.toLocaleString("en-IN")}</em>
                  </label>
                ))}
              </div>
            </aside>

            <div className="parts-content">
              <div className="parts-topbar">
                <strong>All Spare Parts</strong>

                <span>
                  {activeTotalProducts.toLocaleString("en-IN")} products ·
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
                <p className="empty-message">No products found.</p>
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

export default function PartsPage() {
  return (
    <Suspense fallback={null}>
      <PartsContent />
    </Suspense>
  );
}