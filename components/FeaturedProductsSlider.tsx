"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEnquiry } from "@/context/EnquiryContext";

type Product = {
  handle: string;
  title: string;
  image?: string;
  images?: string[];
  collection?: string;
  collectionTitle?: string;
  variantCount?: number;
  partNumber?: string;
  vendor?: string;
  price?: number;
};

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

function getProductImage(product: Product) {
  const image = product.image || product.images?.[0];

  if (!image) return "";
  if (image.startsWith("http")) return image;

  return `${R2_BASE.replace(/\/$/, "")}/catalog/images/${
    product.collection || "products"
  }/${image.replace(/^\/+/, "")}`;
}

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

  if (!loaded) return null;
  if (!products.length) return null;

  return (
    <section className="featured-products-section">
      <div className="featured-products-container">
        <div className="featured-products-top">
          <div>
            <p className="featured-products-eyebrow">Featured Products</p>
            <h2>Popular Spare Parts</h2>
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
            const image = getProductImage(product);
            const title = product.partNumber || product.title;

            return (
              <article key={product.handle} className="featured-product-card">
                <Link
                  href={`/products/${product.handle}`}
                  className="featured-product-image"
                >
                  {image ? <img src={image} alt={product.title} /> : null}
                </Link>

                <div className="featured-product-body">
                  <p className="featured-product-brand">
                    {product.collectionTitle ||
                      product.vendor ||
                      product.collection ||
                      "Sparesco"}
                  </p>

                  <h3>
                    <Link href={`/products/${product.handle}`}>{title}</Link>
                  </h3>

                  <p className="featured-product-price">
                    {formatPrice(product.price)}
                    {product.variantCount
                      ? ` • ${product.variantCount} Options`
                      : ""}
                  </p>

                  <button
                    type="button"
                    className="featured-product-enquiry"
                    onClick={() =>
                      addItem({
                        id: product.handle,
                        handle: product.handle,
                        title: product.title,
                        image,
                        partNumber: product.partNumber || product.title,
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