"use client";

import { useMemo, useState } from "react";

const products = [
  {
    title: "130-9811 Temperature Sensor",
    brand: "Caterpillar",
    category: "Sensors",
  },
  {
    title: "5S0484 Oil Filter",
    brand: "Caterpillar",
    category: "Filters",
  },
  {
    title: "6.4139C Air Filter Assy",
    brand: "Atlas Copco",
    category: "Filters",
  },
  {
    title: "Hydraulic Pump Assembly",
    brand: "Komatsu",
    category: "Hydraulic Parts",
  },
  {
    title: "Engine Gasket Kit",
    brand: "Volvo",
    category: "Engine Parts",
  },
];

const categories = ["Filters", "Sensors", "Hydraulic Parts", "Engine Parts"];
const brands = ["Caterpillar", "Komatsu", "Volvo", "Atlas Copco"];

export default function PartsPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  function toggleValue(value: string, type: "category" | "brand") {
    const current = type === "category" ? selectedCategories : selectedBrands;
    const setter = type === "category" ? setSelectedCategories : setSelectedBrands;

    if (current.includes(value)) {
      setter(current.filter((item) => item !== value));
    } else {
      setter([...current, value]);
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatch =
        selectedCategories.length === 0 ||
        selectedCategories.includes(product.category);

      const brandMatch =
        selectedBrands.length === 0 || selectedBrands.includes(product.brand);

      return categoryMatch && brandMatch;
    });
  }, [selectedCategories, selectedBrands]);

  return (
    <main>
      <section className="section">
        <div className="container">
          <h1 className="page-title">Browse Spare Parts</h1>
          <p className="page-intro">
            Explore industrial spare parts by category, sub-category and brand.
          </p>

          <div className="parts-layout">
            <aside className="filters-sidebar">
              <h3>Filter By</h3>

              <div className="filter-block">
                <h4>Category</h4>

                {categories.map((category) => (
                  <label key={category}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleValue(category, "category")}
                    />
                    {category}
                  </label>
                ))}
              </div>

              <div className="filter-block">
                <h4>Brand</h4>

                {brands.map((brand) => (
                  <label key={brand}>
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleValue(brand, "brand")}
                    />
                    {brand}
                  </label>
                ))}
              </div>
            </aside>

            <div className="parts-content">
              <div className="parts-topbar">
                <strong>All Spare Parts</strong>
                <span>{filteredProducts.length} products found</span>
              </div>

              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <div className="product-card" key={product.title}>
                    <div className="product-image"></div>
                    <h3>{product.title}</h3>
                    <p>
                      {product.brand} • {product.category}
                    </p>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <p className="empty-message">No products found.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}