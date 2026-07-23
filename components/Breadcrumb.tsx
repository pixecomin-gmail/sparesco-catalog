"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import "@/app/styles/breadcrumb.css";

type CollectionItem = {
  title: string;
  handle: string;
};

type ProductBreadcrumbInfo = {
  title?: string;
  collection?: string;
  collectionHandle?: string;
};

function formatSlug(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getCollectionByHandle(
  collections: CollectionItem[],
  handle?: string
) {
  if (!handle) return null;
  return collections.find((item) => item.handle === handle) || null;
}

function getCollectionByTitle(collections: CollectionItem[], title?: string) {
  if (!title) return null;

  return (
    collections.find(
      (item) => item.title.toLowerCase() === title.toLowerCase()
    ) || null
  );
}

function getStaticLabel(collections: CollectionItem[], segment: string) {
  if (segment === "spareshunt") return "Spares Hunt";
  if (segment === "sellwithus") return "Sell With Us";
  if (segment === "parts") return "Spare Parts";
  if (segment === "products") return "Products";

  const collection = getCollectionByHandle(collections, segment);
  if (collection) return collection.title;

  return formatSlug(segment);
}

export default function Breadcrumb() {
  const pathname = usePathname();

  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [productInfo, setProductInfo] = useState<ProductBreadcrumbInfo | null>(
    null
  );

  useEffect(() => {
    fetch("/api/collections")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CollectionItem[]) => setCollections(data))
      .catch(() => setCollections([]));
  }, []);

  useEffect(() => {
    async function loadProductBreadcrumb() {
      const segments = pathname.split("/").filter(Boolean);

      if (segments[0] !== "products" || !segments[1]) {
        setProductInfo(null);
        return;
      }

      try {
        const res = await fetch(`/api/product/${segments[1]}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          setProductInfo(null);
          return;
        }

        const product = await res.json();

        setProductInfo({
          title: product.title,
          collection: product.collection,
          collectionHandle: product.collection,
        });
      } catch {
        setProductInfo(null);
      }
    }

    loadProductBreadcrumb();
  }, [pathname]);

  const items = useMemo(() => {
    if (pathname === "/") return [];

    const segments = pathname.split("/").filter(Boolean);

    if (segments[0] === "products" && segments[1]) {
      if (!productInfo) {
        return [];
      }
      const collection =
        getCollectionByHandle(collections, productInfo?.collectionHandle) ||
        getCollectionByTitle(collections, productInfo?.collection);

      if (collection) {
        return [
          { label: "Collections", href: "/collections/all" },
          {
            label: collection.title,
            href: `/collections/${collection.handle}`,
          },
          { label: productInfo?.title || formatSlug(segments[1]) },
        ];
      }

      return [
        { label: "Collections", href: "/collections/all" },
        { label: productInfo?.title || formatSlug(segments[1]) },
      ];
    }

    return [
      
      ...segments.map((segment, index) => ({
        label: getStaticLabel(collections, segment),
        href:
          index === segments.length - 1
            ? undefined
            : "/" + segments.slice(0, index + 1).join("/"),
      })),
    ];
  }, [pathname, productInfo, collections]);

  const isProductPage =
  pathname.split("/").filter(Boolean)[0] === "products";

  if (!items.length) {
    if (!isProductPage) return null;

    return (
      <nav
        className="breadcrumb-wrap breadcrumb-loading"
        aria-hidden="true"
      >
        <div className="container breadcrumb-inner">
          <span className="breadcrumb-item">
            Collections
          </span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="breadcrumb-wrap" aria-label="Breadcrumb">
      <div className="container breadcrumb-inner">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <span key={`${item.label}-${index}`} className="breadcrumb-item">
              {index > 0 && <span className="breadcrumb-separator">/</span>}

              {isLast || !item.href ? (
                <span className="breadcrumb-current">{item.label}</span>
              ) : (
                <Link href={item.href} prefetch={false}>
                  {item.label}
                </Link>
              )}
            </span>
          );
        })}
      </div>
    </nav>
  );
}