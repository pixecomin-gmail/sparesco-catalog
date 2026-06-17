"use client";

import { useRef } from "react";
import Link from "next/link";
import featuredProducts from "@/data/featured-products.json";
import { getAllProducts } from "@/lib/products";

const products = getAllProducts();

const featured = featuredProducts
  .map((handle) => products.find((product) => product.handle === handle))
  .filter(Boolean);

export default function FeaturedProductsSlider() {
  const sliderRef = useRef<HTMLDivElement | null>(null);

  function scrollSlider(direction: "left" | "right") {
    if (!sliderRef.current) return;

    const card = sliderRef.current.querySelector(".featured-product-slide");

    if (!card) return;

    const cardWidth = card.getBoundingClientRect().width;
    const gap = 20;
    const visibleCards = window.innerWidth > 900 ? 4 : window.innerWidth > 520 ? 2 : 1;

    sliderRef.current.scrollBy({
      left:
        direction === "right"
            ? (cardWidth + gap) * visibleCards
            : -(cardWidth + gap) * visibleCards,
      behavior: "smooth",
    });
  }

  return (
    <section className="section">
      <div className="container">
        <div className="section-heading-row">
          <h2 className="section-title">Featured Products</h2>

          <div className="slider-arrows">
            <button type="button" onClick={() => scrollSlider("left")}>
              ←
            </button>

            <button type="button" onClick={() => scrollSlider("right")}>
              →
            </button>
          </div>
        </div>

        <div className="featured-products-viewport" ref={sliderRef}>
          {featured.map((product) => (
            <article
              className="product-card featured-product-slide"
              key={product.handle}
            >
              <Link href={`/products/${product.handle}`} className="product-image">
                {product.image ? (
                  <img src={product.image} alt={product.title} />
                ) : null}
              </Link>

              <h3>
                <Link href={`/products/${product.handle}`}>
                  {product.title}
                </Link>
              </h3>

              <p>
                {product.collection}
                {product.variantCount > 1
                  ? ` • ${product.variantCount} options`
                  : ""}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}