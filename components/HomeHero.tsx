"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { searchProducts } from "@/lib/products";

export default function HomeHero() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    return searchProducts(query, 4);
  }, [query]);

  return (
    <section className="home-hero">
      <div className="container">
        <span className="tagline">Heavy equipment spare parts marketplace</span>

        <h1>Find any spare part, for any machine.</h1>

        <p>
          Search 100,000+ industrial spare parts across filters, sensors,
          hydraulics, engine parts and machinery components.
        </p>

        <div className="home-hero-search">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by part number, brand or description..."
          />

          <Link
            href={`/search?q=${encodeURIComponent(query)}`}
            className="home-search-link"
          >
            Search
          </Link>
        </div>

        {results.length > 0 && (
          <>
            <div className="hero-result-list">
              {results.map((product) => (
                <Link
                  href={`/products/${product.handle}`}
                  className="hero-result-card"
                  key={product.handle}
                >
                  <div className="hero-result-image">
                    {product.image && (
                      <img src={product.image} alt={product.title} />
                    )}
                  </div>

                  <div>
                    <strong>{product.title}</strong>
                    <span>
                      {product.collection}{" "}
                      {product.variantCount > 1
                        ? `• ${product.variantCount} options`
                        : ""}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              className="hero-view-all"
            >
              View all results →
            </Link>
          </>
        )}

        <div className="button-row">
          <Link href="/parts">Browse All Parts</Link>
          <Link href="/enquiry" className="secondary">
            Request a Quote
          </Link>
        </div>
      </div>
    </section>
  );
}