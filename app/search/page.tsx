"use client";

import { useMemo, useState } from "react";

const products = [
  { title: "130-9811 Temperature Sensor", brand: "Caterpillar", category: "Sensors" },
  { title: "5S0484 Oil Filter", brand: "Caterpillar", category: "Filters" },
  { title: "6.4139C Air Filter Assy", brand: "Atlas Copco", category: "Filters" },
  { title: "Hydraulic Pump Assembly", brand: "Komatsu", category: "Hydraulic Parts" },
  { title: "Engine Gasket Kit", brand: "Volvo", category: "Engine Parts" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    return products.filter((product) => {
      const text = `${product.title} ${product.brand} ${product.category}`.toLowerCase();
      return text.includes(query.toLowerCase());
    });
  }, [query]);

  return (
    <main>
      <section className="section">
        <div className="container">
          <h1 className="page-title">Search Spare Parts</h1>
          <p className="page-intro">
            Search by part number, product name, brand or category.
          </p>

          <div className="search-row">
            <input
              placeholder="Search 130-9811, oil filter, Caterpillar..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button>Search</button>
          </div>

          <div className="parts-topbar">
            <strong>Search Results</strong>
            <span>{results.length} products found</span>
          </div>

          <div className="product-grid">
            {results.map((product) => (
              <div className="product-card" key={product.title}>
                <div className="product-image"></div>
                <h3>{product.title}</h3>
                <p>
                  {product.brand} • {product.category}
                </p>
              </div>
            ))}
          </div>

          {results.length === 0 && (
            <p className="empty-message">No products found.</p>
          )}
        </div>
      </section>
    </main>
  );
}