"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import collectionsData from "@/data/collections.json";

type CollectionItem = {
  title: string;
  handle: string;
};

type ProductBreadcrumbInfo = {
  title?: string;
  collection?: string;
  collectionHandle?: string;
};

const collections = collectionsData as CollectionItem[];

function formatSlug(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getCollectionByHandle(handle?: string) {
  if (!handle) return null;
  return collections.find((item) => item.handle === handle) || null;
}

function getCollectionByTitle(title?: string) {
  if (!title) return null;
  return (
    collections.find(
      (item) => item.title.toLowerCase() === title.toLowerCase()
    ) || null
  );
}

function getStaticLabel(segment: string) {
  if (segment === "spareshunt") return "Spares Hunt";
  if (segment === "sellwithus") return "Sell With Us";
  if (segment === "parts") return "Spare Parts";
  if (segment === "products") return "Products";

  const collection = getCollectionByHandle(segment);
  if (collection) return collection.title;

  return formatSlug(segment);
}

export default function Breadcrumb() {
  const pathname = usePathname();
  const [productInfo, setProductInfo] = useState<ProductBreadcrumbInfo | null>(
    null
  );

  useEffect(() => {
    async function loadProductBreadcrumb() {
      const segments = pathname.split("/").filter(Boolean);

      if (segments[0] !== "products" || !segments[1]) {
        setProductInfo(null);
        return;
      }

      try {
        const res = await fetch(`/data/products/${segments[1]}.json`);

        if (!res.ok) {
          setProductInfo(null);
          return;
        }

        const product = (await res.json()) as ProductBreadcrumbInfo;
        setProductInfo(product);
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
      const collection =
        getCollectionByHandle(productInfo?.collectionHandle) ||
        getCollectionByTitle(productInfo?.collection);

      if (collection) {
        return [
          { label: "Home", href: "/" },
          { label: "Collections", href: "/collections" },
          {
            label: collection.title,
            href: `/collections/${collection.handle}`,
          },
          { label: productInfo?.title || formatSlug(segments[1]) },
        ];
      }

      return [
        { label: "Home", href: "/" },
        { label: "Spare Parts", href: "/parts" },
        { label: productInfo?.title || formatSlug(segments[1]) },
      ];
    }

    return [
      { label: "Home", href: "/" },
      ...segments.map((segment, index) => ({
        label: getStaticLabel(segment),
        href:
          index === segments.length - 1
            ? undefined
            : "/" + segments.slice(0, index + 1).join("/"),
      })),
    ];
  }, [pathname, productInfo]);

  if (!items.length) return null;

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
                <Link href={item.href}>{item.label}</Link>
              )}
            </span>
          );
        })}
      </div>

      <style>{`
        .breadcrumb-wrap {
          background: #ffffff;
          border-bottom: 1px solid var(--border);
        }

        .breadcrumb-inner {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 42px;
          font-size: 13px;
          overflow-x: auto;
          white-space: nowrap;
        }

        .breadcrumb-inner a {
          color: var(--accent);
          text-decoration: none;
          font-weight: 700;
        }

        .breadcrumb-current {
          color: #6b7280;
          font-weight: 700;
        }

        .breadcrumb-separator {
          color: #9ca3af;
        }

        .breadcrumb-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </nav>
  );
}