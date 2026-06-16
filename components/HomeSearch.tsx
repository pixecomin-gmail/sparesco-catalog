"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { searchProducts } from "@/lib/products";

export default function HomeSearch() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    return searchProducts(query, 4);
  }, [query]);

  return (
    <div className="home-search-wrap">
      <div className="home-search-box">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by part number, brand or description..."
        />

        <Link href={`/search?q=${encodeURIComponent(query)}`}>
          <button>Search</button>
        </Link>
      </div>

      {results.length > 0 && (
        <div className="home-search-results">
          {results.map((product) => (
            <Link
              href={`/products/${product.handle}`}
              className="home-search-result"
              key={product.handle}
            >
              <strong>{product.title}</strong>
              <span>
                {product.collection}
                {product.variantCount > 1
                  ? ` • ${product.variantCount} options`
                  : ""}
              </span>
            </Link>
          ))}

          <Link
            href={`/search?q=${encodeURIComponent(query)}`}
            className="view-all-results"
          >
            View all results →
          </Link>
        </div>
      )}
    </div>
  );
}