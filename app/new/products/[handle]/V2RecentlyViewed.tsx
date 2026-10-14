"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type V2Variant = { partNumber?: string; sku?: string; vendor?: string; price?: string | number };
type V2Product = {
  handle: string;
  title: string;
  vendor?: string;
  collectionHandle?: string;
  images?: Array<{ src?: string; alt?: string }>;
  variants?: V2Variant[];
};

const STORAGE_KEY = "sparesco-v2-recent";
const CART_KEY = "sparesco-v2-enquiry";

function clean(value: string | undefined) {
  return (value || "").replace(/\bfilter\s*finder\b/gi, "Sparesco").replace(/\s+/g, " ").trim();
}

function V2ProductCard({ product }: { product: V2Product }) {
  const router = useRouter();
  const variant = product.variants?.[0];
  const title = clean(product.title);
  const partNumber = clean(variant?.partNumber || variant?.sku || title);
  const vendor = clean(variant?.vendor || product.vendor || product.collectionHandle);
  const image = product.images?.[0]?.src || "/images/product-placeholder.webp";
  const price = Number(variant?.price || 0);
  const variantCount = product.variants?.length || 1;
  const priceText = Number.isFinite(price) && price > 0
    ? `${variantCount > 1 ? "From " : ""}₹${price.toLocaleString("en-IN")}`
    : "Price On Request";

  function addToEnquiry() {
    try {
      const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      const items: Record<string, unknown>[] = Array.isArray(stored) ? stored : [];
      const existing = items.find((item) => item.handle === product.handle && (item.partNumber || item.sku) === partNumber);
      if (existing) {
        existing.quantity = Number(existing.quantity || 0) + 1;
      } else {
        items.push({
          id: `${product.handle}-${partNumber}`,
          handle: product.handle,
          title,
          sku: partNumber,
          partNumber,
          variantDescription: clean(variant?.partNumber || variant?.sku),
          image,
          vendor,
          price: Number.isFinite(price) ? price : 0,
          quantity: 1,
        });
      }
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event("sparesco-v2-enquiry-updated"));
      router.push("/new/enquiry");
    } catch (error) {
      console.error("Unable to update V2 enquiry cart", error);
      window.alert("Could not add this product to the enquiry list. Please try again.");
    }
  }

  return (
    <article className="parts-product-card">
      <Link href={`/new/products/${encodeURIComponent(product.handle)}`} prefetch={false} className="parts-product-image" aria-label={title}>
        <img src={image} alt={product.images?.[0]?.alt || title} loading="lazy" onError={(event) => {
          if (!event.currentTarget.src.endsWith("/images/product-placeholder.webp")) event.currentTarget.src = "/images/product-placeholder.webp";
        }} />
      </Link>
      <div className="parts-product-info">
        <h3><Link href={`/new/products/${encodeURIComponent(product.handle)}`} prefetch={false}>{title}</Link></h3>
        <p className="parts-product-meta">{variantCount > 1 ? `${priceText} • ${variantCount} Options` : priceText}</p>
        <button type="button" className="parts-enquiry-button" onClick={addToEnquiry}>Add To Enquiry</button>
      </div>
    </article>
  );
}

export default function V2RecentlyViewed({ currentHandle }: { currentHandle: string }) {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [recentProducts, setRecentProducts] = useState<V2Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [placeholderCount, setPlaceholderCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      let savedHandles: string[] = [];
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (Array.isArray(saved)) savedHandles = saved.filter((value): value is string => typeof value === "string");
      } catch { /* invalid old history */ }
      const previous = [...new Set(savedHandles)].filter((handle) => handle !== currentHandle).slice(0, 12);
      setPlaceholderCount(previous.length);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([currentHandle, ...previous].slice(0, 12)));
      const results = await Promise.all(previous.map(async (handle) => {
        try {
          const response = await fetch(`/api/new/products/${encodeURIComponent(handle)}`, { cache: "no-store" });
          return response.ok ? await response.json() as V2Product : null;
        } catch { return null; }
      }));
      if (!cancelled) {
        setRecentProducts(results.filter((product): product is V2Product => !!product));
        setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [currentHandle]);

  if (!loading && !recentProducts.length) return null;
  if (loading && placeholderCount === 0) return null;

  return (
    <section className="recently-viewed-products-section">
      <div className="container">
        <div className="recently-viewed-top">
          <div className="recently-viewed-heading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
            <h2>Continue Where You Left Off</h2>
          </div>
          <div className="recently-viewed-controls">
            <button type="button" aria-label="Scroll recently viewed left" onClick={() => sliderRef.current?.scrollBy({ left: -320, behavior: "smooth" })}>←</button>
            <button type="button" aria-label="Scroll recently viewed right" onClick={() => sliderRef.current?.scrollBy({ left: 320, behavior: "smooth" })}>→</button>
          </div>
        </div>
        <div className="recently-viewed-slider" ref={sliderRef}>
          {loading
            ? Array.from({ length: Math.min(placeholderCount, 5) }).map((_, index) => (
                <div key={index} className="recently-viewed-slide" aria-hidden="true">
                  <article className="parts-product-card">
                    <div className="parts-product-image" style={{ minHeight: 228, background: "#eeeeee" }} />
                    <div className="parts-product-info"><div style={{ width: "76%", height: 22, background: "#e6e6e6", marginBottom: 16 }} /><div style={{ width: "58%", height: 16, background: "#ededed", marginBottom: 24 }} /><div style={{ width: "100%", height: 52, background: "#e2e2e2" }} /></div>
                  </article>
                </div>
              ))
            : recentProducts.map((product) => <div key={product.handle} className="recently-viewed-slide"><V2ProductCard product={product} /></div>)}
        </div>
      </div>
    </section>
  );
}
