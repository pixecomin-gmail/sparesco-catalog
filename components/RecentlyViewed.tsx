"use client";

import { useEffect, useRef, useState } from "react";
import CollectionProductCard from "@/components/CollectionProductCard";
import type { ProductIndexItem } from "@/lib/products";
import { productJsonUrl } from "@/lib/r2";

type Props = {
  currentHandle: string;
};

const STORAGE_KEY = "sparesco_recently_viewed";

export default function RecentlyViewedSlider({ currentHandle }: Props) {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [recentProducts, setRecentProducts] = useState<ProductIndexItem[]>([]);

  useEffect(() => {
    async function loadRecentlyViewed() {
      const savedHandles = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      ) as string[];

      const uniqueHandles = Array.from(new Set(savedHandles))
        .filter((handle) => handle !== currentHandle)
        .slice(0, 12);

      const products = await Promise.all(
        uniqueHandles.map(async (handle) => {
          try {
            const res = await fetch(productJsonUrl(handle));
            if (!res.ok) return null;

            const product = await res.json();
            const firstVariant = product.variants?.[0];

            return {
              handle: product.handle,
              title: product.title,
              category: product.category || "",
              collection: product.collection || "",
              collectionHandle:
                product.collectionHandle || product.collection || "",
              image: product.images?.[0] || product.image || "",
              partNumber:
                firstVariant?.partNumber || product.partNumber || product.title,
              vendor:
                firstVariant?.vendor ||
                product.vendor ||
                product.collection ||
                "",
              variantCount: product.variants?.length || 1,
              price: firstVariant?.price || product.price || 0,
            } as ProductIndexItem;
          } catch {
            return null;
          }
        })
      );

      setRecentProducts(
        products.filter((product): product is ProductIndexItem => !!product)
      );

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

    sliderRef.current.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  }

  if (!recentProducts.length) return null;

  return (
    <section className="recently-viewed-products-section">
      <div className="container">
        <div className="recently-viewed-top">
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

          <div className="recently-viewed-controls">
            <button type="button" onClick={() => scrollSlider("left")}>
              ←
            </button>

            <button type="button" onClick={() => scrollSlider("right")}>
              →
            </button>
          </div>
        </div>

        <div className="recently-viewed-slider" ref={sliderRef}>
          {recentProducts.map((product) => (
            <div key={product.handle} className="recently-viewed-slide">
              <CollectionProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}