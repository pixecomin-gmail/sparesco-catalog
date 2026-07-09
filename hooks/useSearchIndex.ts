"use client";

import { useEffect, useState } from "react";
import type { ProductIndexItem } from "@/lib/products";

const cache = new Map<string, ProductIndexItem[]>();

function text(value?: string) {
  return (value || "").toLowerCase();
}

function compact(value?: string) {
  return (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function scoreProduct(product: ProductIndexItem, query: string) {
  const q = query.toLowerCase();
  const cq = compact(query);

  const title = text(product.title);
  const partNumber = text(product.partNumber);
  const collection = text(product.collection);
  const category = text(product.category);
  const vendor = text(product.vendor);

  const compactTitle = compact(product.title);
  const compactPartNumber = compact(product.partNumber);

  if (compactTitle === cq) return 2000;
  if (compactPartNumber === cq) return 1900;

  if (compactTitle.startsWith(cq)) return 1800;
  if (compactPartNumber.startsWith(cq)) return 1700;

  if (title === q) return 1600;
  if (partNumber === q) return 1500;

  if (title.startsWith(q)) return 1400;
  if (partNumber.startsWith(q)) return 1300;

  if (compactTitle.includes(cq)) return 1200;
  if (compactPartNumber.includes(cq)) return 1100;

  if (title.includes(q)) return 1000;
  if (partNumber.includes(q)) return 900;

  if (vendor.includes(q)) return 300;
  if (collection.includes(q)) return 200;
  if (category.includes(q)) return 100;

  return 0;
}

function cleanResults(products: ProductIndexItem[], query: string) {
  const unique = new Map<string, ProductIndexItem>();

  products.forEach((product) => {
    if (!product.handle) return;
    if (!unique.has(product.handle)) {
      unique.set(product.handle, product);
    }
  });

  return Array.from(unique.values())
    .map((product) => ({
      product,
      score: scoreProduct(product, query),
    }))
    .filter((item) => item.score >= 900)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.product);
}

export function useSearchResults(query: string, limit?: number) {
  const [results, setResults] = useState<ProductIndexItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();

    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const key = q.toLowerCase();

        if (cache.has(key)) {
          const cached = cache.get(key) || [];
          setResults(limit ? cached.slice(0, limit) : cached);
          return;
        }

        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          setResults([]);
          return;
        }

        const data = (await res.json()) as ProductIndexItem[];
        const sorted = cleanResults(data, q);

        cache.set(key, sorted);
        setResults(limit ? sorted.slice(0, limit) : sorted);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, limit]);

  return { results, loading };
}