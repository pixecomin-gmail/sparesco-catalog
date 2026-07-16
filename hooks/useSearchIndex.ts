"use client";

import { useEffect, useState } from "react";
import type { ProductIndexItem } from "@/lib/products";

const cache = new Map<string, ProductIndexItem[]>();

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

    const key = q.toLowerCase();
    const cached = cache.get(key);

    if (cached) {
      setResults(limit ? cached.slice(0, limit) : cached);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(q)}`,
          {
            signal: controller.signal,
            cache: "force-cache",
          }
        );

        if (!response.ok) {
          setResults([]);
          return;
        }

        const data = (await response.json()) as ProductIndexItem[];

        const unique = Array.from(
          new Map(
            data
              .filter((product) => product.handle)
              .map((product) => [product.handle, product])
          ).values()
        );

        cache.set(key, unique);
        setResults(limit ? unique.slice(0, limit) : unique);
      } catch (error) {
        if (!(error instanceof DOMException) || error.name !== "AbortError") {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, limit]);

  return { results, loading };
}
