"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useEnquiry } from "@/context/EnquiryContext";
import { getCatalogImageUrls } from "@/lib/products";

type Product = {
  handle: string;
  title: string;
  image?: string;
  collection?: string;
  collectionHandle?: string;
  imageFolder?: string;
  vendor?: string;
  partNumber?: string;
  price?: number;
};

function formatBrand(value?: string) {
  if (!value) return "Sparesco";

  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function PopularSparePartsList() {
  const { addItem } = useEnquiry();
  const [products, setProducts] = useState<Product[]>([]);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadPopularProducts() {
      try {
        const res = await fetch("/api/popular-products", {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();
        setProducts(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch {
        setProducts([]);
      }
    }

    loadPopularProducts();
  }, []);

  if (!products.length) {
    return (
      <section className="popular-parts-section section">
        <div className="container">
          <div className="section-heading-row popular-parts-heading">
            <h2 className="section-title">Popular Spare Parts</h2>
          </div>

          <div className="popular-parts-list">
            {Array.from({ length: 5 }).map((_, index) => (
              <article className="popular-part-row" key={index}>
                <div className="popular-part-main">
                  <div className="skeleton-box skeleton-popular-image" />
                  <div style={{ flex: 1, marginLeft: 16 }}>
                    <div className="skeleton-line" />
                    <div className="skeleton-line skeleton-short" />
                  </div>
                </div>

                <div className="skeleton-line" style={{ width: 80, marginBottom: 0 }} />
                <div className="skeleton-line" style={{ width: 90, marginBottom: 0 }} />
                <div className="skeleton-line" style={{ width: 130, height: 40, marginBottom: 0 }} />
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="popular-parts-section section">
      <div className="container">
        <div className="section-heading-row popular-parts-heading">
          <h2 className="section-title">Popular Spare Parts</h2>
          <Link href="/parts">Browse all →</Link>
        </div>

        <div className="popular-parts-list">
          {products.map((product, index) => {
            const brand = formatBrand(product.collection || product.vendor);
            const { thumbnail: image, original: originalImage } =
              getCatalogImageUrls(product);
            const imageBroken = brokenImages[product.handle];

            return (
              <article className="popular-part-row" key={product.handle}>
                <Link href={`/products/${product.handle}`} className="popular-part-main">
                  <div className="popular-part-image">
                    {image && !imageBroken ? (
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

                          setBrokenImages((prev) => ({
                            ...prev,
                            [product.handle]: true,
                          }));
                        }}
                      />
                    ) : (
                      <span>{product.partNumber || product.title}</span>
                    )}
                  </div>

                  <div className="popular-part-info">
                    <h3>{product.title}</h3>
                  </div>
                </Link>

                <div className="popular-part-brand">{brand}</div>

                <div className={index === 2 ? "popular-stock-badge low" : "popular-stock-badge"}>
                  {index === 2 ? "Low Stock" : "In Stock"}
                </div>

                <button
                  type="button"
                  className="popular-quote-button"
                  onClick={() =>
                    addItem({
                      id: product.partNumber
                        ? `${product.handle}-${product.partNumber}`
                        : product.handle,
                      handle: product.handle,
                      title: product.title,
                      image,
                      partNumber: product.partNumber || product.title,
                      vendor: brand,
                      price: product.price || 0,
                    })
                  }
                >
                  Add To Enquiry
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}