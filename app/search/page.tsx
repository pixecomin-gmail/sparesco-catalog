"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { searchProducts } from "@/lib/products";
import CollectionProductCard from "@/components/CollectionProductCard";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);

  const results = useMemo(() => {
    return searchProducts(query);
  }, [query]);

  return (
    <main>
      <section className="section parts-section search-page-section">
        <div className="container">
          <h1 className="page-title">Search Spare Parts</h1>

          <p className="page-intro">
            Search by part number, product name, brand or category.
          </p>

          <div className="home-hero-search search-page-search">
            <input
              placeholder="Search SA 16056, air filter, Caterpillar..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />

            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              className="home-search-link"
            >
              Search
            </Link>
          </div>

          <div className="parts-topbar">
            <strong>Search Results</strong>
            <span>{results.length.toLocaleString("en-IN")} products found</span>
          </div>

          <div className="parts-product-grid search-product-grid">
            {results.slice(0, 24).map((product) => (
              <CollectionProductCard product={product} key={product.handle} />
            ))}
          </div>

          {query && results.length > 24 && (
            <p className="empty-message">
              Showing first 24 results. Refine your search for better matches.
            </p>
          )}

          {query && results.length === 0 && (
            <p className="empty-message">No products found.</p>
          )}
        </div>
      </section>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchContent />
    </Suspense>
  );
}