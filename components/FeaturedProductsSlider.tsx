"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEnquiry } from "@/context/EnquiryContext";
import { getCatalogImageUrls } from "@/lib/products";

type Product = {
  handle: string;
  title: string;
  image?: string;
  images?: string[];
  collection?: string;
  collectionHandle?: string;
  imageFolder?: string;
  collectionTitle?: string;
  variantCount?: number;
  partNumber?: string;
  vendor?: string;
  price?: number;
};

function formatPrice(price?: number) {
  if (!price) return "Price On Request";
  return `From ₹${price.toLocaleString("en-IN")}`;
}

export default function FeaturedProductsSlider() {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const { addItem } = useEnquiry();
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/featured-products", {
          cache: "no-store",
        });

        if (!res.ok) {
          setLoaded(true);
          return;
        }

        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } finally {
        setLoaded(true);
      }
    }

    loadProducts();
  }, []);

  function scrollSlider(direction: "left" | "right") {
    if (!sliderRef.current) return;

    sliderRef.current.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  }

  if (!loaded) {
    return (
      <section className="featured-products-section">
        <div className="container">
          <div className="featured-products-top">
            <h2>Featured Products</h2>
          </div>

          <div className="featured-products-slider">
            {Array.from({ length: 5 }).map((_, index) => (
              <article
                key={index}
                className="parts-product-card featured-product-card skeleton-card"
              >
                <div className="parts-product-image skeleton-box" />

                <div className="parts-product-info">
                  <div className="skeleton-line skeleton-title" />
                  <div className="skeleton-line skeleton-price" />
                  <div className="skeleton-button" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  if (!products.length) return null;

  return (
    <section className="featured-products-section">
      <div className="container">
        <div className="featured-products-top">
          <div>
            <h2>Featured Products</h2>
          </div>

          <div className="featured-products-controls">
            <button
              type="button"
              onClick={() => scrollSlider("left")}
              aria-label="Scroll left"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() => scrollSlider("right")}
              aria-label="Scroll right"
            >
              →
            </button>
          </div>
        </div>

        <div className="featured-products-slider" ref={sliderRef}>
          {products.map((product) => {
            const sourceImage = product.image || product.images?.[0] || "";
            const { thumbnail: image, original: originalImage } =
              getCatalogImageUrls({ ...product, image: sourceImage });
            const title = product.title;

            return (
              <article key={product.handle} className="parts-product-card featured-product-card">
                <Link
                  href={`/products/${product.handle}`}
                  className="parts-product-image"
                  prefetch={false}
                >
                  {image ? (
                    <img
                      src={image}
                      alt={product.title}
                      loading="lazy"
                      onError={(event) => {
                        if (
                          originalImage &&
                          event.currentTarget.src !== originalImage
                        ) {
                          event.currentTarget.src = originalImage;
                          return;
                        }

                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                </Link>

                <div className="parts-product-info">
                  <p className="featured-product-brand">
                    {product.collectionTitle ||
                      product.vendor ||
                      product.collection ||
                      "Sparesco"}
                  </p>

                  <h3>
                    <Link
                      href={`/products/${product.handle}`}
                      prefetch={false}
                    >
                      {title}
                    </Link>
                  </h3>

                  <p className="parts-product-meta">
                    {formatPrice(product.price)}
                    {product.variantCount
                      ? ` • ${product.variantCount} Options`
                      : ""}
                  </p>

                  <button
                    type="button"
                    className="parts-enquiry-button"
                    onClick={() =>
                      addItem({
                          id: product.handle,
                          handle: product.handle,
                          title: product.title,
                          image,
                          partNumber: product.title,
                          vendor:
                            product.vendor ||
                            product.collectionTitle ||
                            product.collection ||
                            "Sparesco",
                          price: product.price || 0,
                        })
                    }
                  >
                    Add to Enquiry
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}