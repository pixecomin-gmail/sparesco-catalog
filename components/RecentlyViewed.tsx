"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEnquiry } from "@/context/EnquiryContext";
import { productJsonUrl } from "@/lib/r2";

type Product = {
  handle: string;
  title: string;
  image?: string;
  collection?: string;
  variantCount?: number;
  partNumber?: string;
  vendor?: string;
  price?: number;
};

type Props = {
  currentHandle: string;
};

const STORAGE_KEY = "sparesco_recently_viewed";

export default function RecentlyViewedSlider({ currentHandle }: Props) {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const { addItem } = useEnquiry();
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadRecentlyViewed() {
      const savedHandles = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      ) as string[];

      const productRequests = savedHandles
        .filter((handle) => handle !== currentHandle)
        .slice(0, 10)
        .map(async (handle) => {
          const res = await fetch(productJsonUrl(handle));
          if (!res.ok) return null;

          const product = await res.json();

          return {
            handle: product.handle,
            title: product.title,
            image: product.images?.[0] || "",
            collection: product.collection,
            variantCount: product.variants?.length || 1,
            partNumber: product.variants?.[0]?.partNumber || product.title,
            vendor: product.variants?.[0]?.vendor || product.collection || "",
            price: product.variants?.[0]?.price || 0,
          } as Product;
      });
      
      const items = (await Promise.all(productRequests)).filter(
        (product): product is Product => product !== null
      );

      setRecentProducts(items);

      const updatedHandles = [
        currentHandle,
        ...savedHandles.filter((handle) => handle !== currentHandle),
      ].slice(0, 12);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHandles));
    }

    loadRecentlyViewed();
  }, [currentHandle]);

  function scrollSlider(direction: "left" | "right") {
    if (!sliderRef.current) return;

    const card = sliderRef.current.querySelector(".featured-product-slide");
    if (!card) return;

    const cardWidth = card.getBoundingClientRect().width;
    const gap = 16;

    const visibleCards =
      window.innerWidth > 1100
        ? 6
        : window.innerWidth > 900
          ? 4
          : window.innerWidth > 520
            ? 2
            : 1;

    sliderRef.current.scrollBy({
      left:
        direction === "right"
          ? (cardWidth + gap) * visibleCards
          : -(cardWidth + gap) * visibleCards,
      behavior: "smooth",
    });
  }

  if (!recentProducts.length) return null;

  return (
    <section className="section featured-products-section recently-viewed-products-section">
      <div className="container">
        <div className="section-heading-row recently-viewed-section">
          <div className="recently-viewed-heading">
            <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            >
            <polyline points="1 4 1 10 7 10" />
            <polyline points="23 20 23 14 17 14" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>

            <h2>Continue Where You Left Off</h2>
        </div>

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
          {recentProducts.map((product) => (
            <article
              className="featured-product-card featured-product-slide"
              key={product.handle}
            >
              <Link
                href={`/products/${product.handle}`}
                className="featured-product-image"
              >
                {product.image ? (
                  <img src={product.image} alt={product.title} />
                ) : null}
              </Link>

              <div className="featured-product-info">
                <h3>
                  <Link href={`/products/${product.handle}`}>
                    {product.title}
                  </Link>
                </h3>

                <p>
                  {typeof product.price === "number" && product.price > 0
                    ? `From ₹${product.price.toLocaleString("en-IN")}`
                    : "Price On Request"}

                  {(product.variantCount ?? 0) > 1
                    ? ` • ${product.variantCount} Options`
                    : ""}
                </p>

                <button
                  type="button"
                  className="featured-enquiry-button"
                  onClick={() =>
                    addItem({
                      id: product.handle,
                      handle: product.handle,
                      title: product.title,
                      image: product.image || "",
                      partNumber: product.partNumber || product.title,
                      vendor: product.vendor || product.collection || "",
                      price: product.price || 0,
                    })
                  }
                >
                  Add To Enquiry
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}