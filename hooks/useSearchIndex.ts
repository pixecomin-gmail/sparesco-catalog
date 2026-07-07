"use client";

import { useEffect, useState } from "react";
import type { ProductIndexItem } from "@/lib/products";

const cache = new Map<string, ProductIndexItem[]>();

export function useSearchResults(query: string, limit?: number) {
  const [results, setResults] = useState<ProductIndexItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();

    if (!q) {
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
          cache: "force-cache",
        });

        if (!res.ok) {
          setResults([]);
          return;
        }

        const data = (await res.json()) as ProductIndexItem[];

        cache.set(key, data);
        setResults(limit ? data.slice(0, limit) : data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, limit]);

  return { results, loading };
}