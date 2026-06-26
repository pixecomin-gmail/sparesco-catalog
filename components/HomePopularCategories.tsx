"use client";

import { useEffect, useState } from "react";

type FeaturedCategory = {
  title: string;
  url: string;
  icon: string;
};

export default function HomePopularCategories() {
  const [featuredCategories, setFeaturedCategories] = useState<
    FeaturedCategory[]
  >([]);

  useEffect(() => {
    fetch("/data/site/featured-categories.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: FeaturedCategory[]) => setFeaturedCategories(data))
      .catch(() => setFeaturedCategories([]));
  }, []);

  if (!featuredCategories.length) return null;

  return (
    <section className="section categories-highlight-section">
      <div className="container">
        <div className="section-header-row">
          <h2 className="section-title">Popular Categories</h2>
          <a href="/categories">View all categories →</a>
        </div>

        <div className="popular-categories-grid">
          {featuredCategories.slice(0, 6).map((category) => (
            <a
              href={category.url}
              className="popular-category-card"
              key={category.title}
            >
              <div className="popular-category-icon">
                <img
                  src={`/icons/categories/${category.icon}`}
                  alt={category.title}
                />
              </div>

              <h3>{category.title}</h3>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}