"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { searchProducts } from "@/lib/products";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);

  const results = useMemo(() => {
    return searchProducts(query);
  }, [query]);

  return (
    <main>
      <section className="section">
        <div className="container">
          <h1 className="page-title">Search Spare Parts</h1>

          <p className="page-intro">
            Search by part number, product name, brand or category.
          </p>

          <div className="home-hero-search">
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
            <span>{results.length} products found</span>
          </div>

          <div className="product-grid">
            {results.slice(0, 24).map((product) => (
              <Link
                href={`/products/${product.handle}`}
                className="product-card"
                key={product.handle}
              >
                <div className="product-image">
                  {product.image && (
                    <img src={product.image} alt={product.title} />
                  )}
                </div>

                <h3>{product.title}</h3>

                <p>
                  {product.collection}
                  {product.variantCount > 1
                    ? ` • ${product.variantCount} options`
                    : ""}
                </p>
              </Link>
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