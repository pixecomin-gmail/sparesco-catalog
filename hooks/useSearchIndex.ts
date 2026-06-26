"use client";

import { useEffect, useState } from "react";
import { searchProductList, type ProductIndexItem } from "@/lib/products";

let cache: ProductIndexItem[] | null = null;
let loading: Promise<ProductIndexItem[]> | null = null;

async function loadSearchIndex() {
  if (cache) return cache;

  if (!loading) {
    loading = fetch("/data/search-index.json")
      .then((r) => r.json())
      .then((data: ProductIndexItem[]) => {
        cache = data;
        return data;
      });
  }

  return loading;
}

export function useSearchIndex() {
  const [products, setProducts] = useState<ProductIndexItem[]>(cache || []);

  useEffect(() => {
    if (cache) return;

    loadSearchIndex().then(setProducts);
  }, []);

  return products;
}

export function useSearchResults(query: string, limit?: number) {
  const products = useSearchIndex();
  return searchProductList(products, query, limit);
}