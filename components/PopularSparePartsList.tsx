"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import popularSpareParts from "@/data/popular-spare-parts.json";
import { useEnquiry } from "@/context/EnquiryContext";

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

export default function PopularSparePartsList() {
  const { addItem } = useEnquiry();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadPopularProducts() {
      const handles = (popularSpareParts as string[]).slice(0, 5);

      const loadedProducts = await Promise.all(
        handles.map(async (handle) => {
          const res = await fetch(`/data/products/${handle}.json`);
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
        })
      );

      setProducts(
        loadedProducts.filter(
          (product): product is Product => product !== null
        )
      );
    }

    loadPopularProducts();
  }, []);

  if (!products.length) return null;

  return (
    <section className="popular-parts-section section">
      <div className="container">
        <div className="section-heading-row popular-parts-heading">
          <h2 className="section-title">Popular Spare Parts</h2>
          <Link href="/parts">Browse all →</Link>
        </div>

        <div className="popular-parts-list">
          {products.map((product, index) => {
            const brand = product.collection || product.vendor || "Sparesco";

            return (
              <article className="popular-part-row" key={product.handle}>
                <Link
                  href={`/products/${product.handle}`}
                  className="popular-part-main"
                >
                  <div className="popular-part-image">
                    {product.image ? (
                      <img src={product.image} alt={product.title} />
                    ) : (
                      <span>Part</span>
                    )}
                  </div>

                  <div className="popular-part-info">
                    <h3>{product.title}</h3>
                  </div>
                </Link>

                <div className="popular-part-brand">{brand}</div>

                <div
                  className={
                    index === 2
                      ? "popular-stock-badge low"
                      : "popular-stock-badge"
                  }
                >
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
                      image: product.image || "",
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