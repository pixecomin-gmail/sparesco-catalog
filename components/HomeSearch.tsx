"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchResults } from "@/hooks/useSearchIndex";

export default function HomeSearch() {
  const [query, setQuery] = useState("");

  const results = useSearchResults(query, 4);

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