"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const products = [
  { title: "130-9811 Temperature Sensor", brand: "Caterpillar", category: "Sensors" },
  { title: "5S0484 Oil Filter", brand: "Caterpillar", category: "Filters" },
  { title: "6.4139C Air Filter Assy", brand: "Atlas Copco", category: "Filters" },
  { title: "Hydraulic Pump Assembly", brand: "Komatsu", category: "Hydraulic Parts" },
  { title: "Engine Gasket Kit", brand: "Volvo", category: "Engine Parts" },
];

export default function HomeSearch() {
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
            <div className="home-search-result" key={product.title}>
              <strong>{product.title}</strong>
              <span>{product.brand} • {product.category}</span>
            </div>
          ))}

          <Link href={`/search?q=${encodeURIComponent(query)}`} className="view-all-results">
            View all results →
          </Link>
        </div>
      )}
    </div>
  );
}