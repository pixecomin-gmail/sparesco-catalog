"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const products = [
  {
    title: "130-9811 Temperature Sensor",
    handle: "130-9811-temperature-sensor",
    brand: "Caterpillar",
    category: "Sensors",
  },
  {
    title: "5S0484 Oil Filter",
    handle: "5s0484-oil-filter",
    brand: "Caterpillar",
    category: "Filters",
  },
  {
    title: "6.4139C Air Filter Assy",
    handle: "6-4139c-air-filter-assy",
    brand: "Atlas Copco",
    category: "Filters",
  },
  {
    title: "Hydraulic Pump Assembly",
    handle: "hydraulic-pump-assembly",
    brand: "Komatsu",
    category: "Hydraulic Parts",
  },
  {
    title: "Engine Gasket Kit",
    handle: "engine-gasket-kit",
    brand: "Volvo",
    category: "Engine Parts",
  },
];

export default function HomeHero() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];

    return products
      .filter((product) => {
        const text = `${product.title} ${product.brand} ${product.category}`.toLowerCase();
        return text.includes(query.toLowerCase());
      })
      .slice(0, 4);
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
                  <div className="hero-result-image"></div>

                  <div>
                    <strong>{product.title}</strong>
                    <span>
                      {product.brand} • {product.category}
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