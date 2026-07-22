"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchResults } from "@/hooks/useSearchIndex";

export default function HomeHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const { results, loading } = useSearchResults(query, 4);

  const submitSearch = () => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) return;

    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  };

  return (
    <section className="home-hero">
      <div className="container">
        <span className="tagline">
          Heavy equipment spare parts marketplace
        </span>

        <h1>Find any spare part, for any machine.</h1>

        <p>
          Search 100,000+ industrial spare parts across filters, sensors,
          hydraulics, engine parts and machinery components.
        </p>

        <div className="home-hero-search-wrap">
          <div className="home-hero-search">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submitSearch();
                }
              }}
              placeholder="Search by part number, brand or description..."
            />

            {query && (
              <button
                type="button"
                className="hero-search-clear"
                onClick={() => setQuery("")}
              >
                ×
              </button>
            )}

            <button
              type="button"
              className="home-search-link"
              onClick={submitSearch}
            >
              Search
            </button>
          </div>

          {results.length > 0 && (
            <div className="hero-search-dropdown">
              <div className="hero-result-list">
                {results.map((product, index) => (
                  <Link
                    href={`/products/${product.handle}`}
                    className="hero-result-card"
                    key={`${product.handle}-${product.collection}-${product.partNumber}-${index}`}
                    prefetch={false}
                  >
                    <div className="hero-result-image">
                      {product.image && (
                        <img
                          src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(
                            /\/$/,
                            ""
                          )}/catalog/thumbs/${product.collection}/${product.image.replace(
                            /\.[^.]+$/,
                            ".webp"
                          )}`}
                          alt={product.title}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(
                              /\/$/,
                              ""
                            )}/catalog/images/${product.collection}/${product.image}`;
                          }}
                        />
                      )}
                    </div>

                    <div className="hero-result-content">
                      <strong>{product.title || product.partNumber}</strong>
                      <span>
                        {product.collection}
                        {product.variantCount > 1 ? ` • ${product.variantCount} options` : ""}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              <Link
                href={`/search?q=${encodeURIComponent(query.trim())}`}
                className="hero-view-all"
              >
                View all results →
              </Link>
            </div>
          )}
        </div>

        <div className="button-row">
          <Link href="/collections">Browse All Parts</Link>

          <Link href="/enquiry" className="secondary">
            Request a Quote
          </Link>
        </div>
      </div>
    </section>
  );
}