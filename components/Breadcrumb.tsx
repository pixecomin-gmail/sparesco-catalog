"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import collectionsData from "@/data/collections.json";
import productsIndex from "@/data/products-index.json";

type CollectionItem = {
  title: string;
  handle: string;
};

type ProductItem = {
  title: string;
  handle: string;
  collection?: string;
  collectionHandle?: string;
};

const collections = collectionsData as CollectionItem[];
const products = productsIndex as ProductItem[];

function formatSlug(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getProductCollection(product?: ProductItem) {
  if (!product) return null;

  if (product.collectionHandle) {
    const matched = collections.find(
      (item) => item.handle === product.collectionHandle
    );

    if (matched) {
      return {
        title: matched.title,
        href: `/collections/${matched.handle}`,
      };
    }
  }

  if (product.collection) {
    const matched = collections.find(
      (item) =>
        item.title.toLowerCase() === product.collection?.toLowerCase()
    );

    if (matched) {
      return {
        title: matched.title,
        href: `/collections/${matched.handle}`,
      };
    }

    return {
      title: product.collection,
      href: "/collections",
    };
  }

  return null;
}

export default function Breadcrumb() {
  const pathname = usePathname();
  const [cameFromCollection, setCameFromCollection] = useState(false);

  useEffect(() => {
    try {
      const referrerPath = document.referrer
        ? new URL(document.referrer).pathname
        : "";

      setCameFromCollection(referrerPath.startsWith("/collections/"));
    } catch {
      setCameFromCollection(false);
    }
  }, []);

  const items = useMemo(() => {
    if (pathname === "/") return [];

    const segments = pathname.split("/").filter(Boolean);

    if (segments[0] === "products" && segments[1]) {
      const product = products.find((item) => item.handle === segments[1]);
      const productCollection = getProductCollection(product);

      if (productCollection) {
        return [
          { label: "Home", href: "/" },
          { label: "Collections", href: "/collections" },
          {
            label: productCollection.title,
            href: productCollection.href,
          },
          { label: product?.title || formatSlug(segments[1]) },
        ];
      }

      return [
        { label: "Home", href: "/" },
        { label: "Spare Parts", href: "/parts" },
        { label: product?.title || formatSlug(segments[1]) },
      ];
    }

    return [
      { label: "Home", href: "/" },
      ...segments.map((segment, index) => {
        const href =
          index === segments.length - 1
            ? undefined
            : "/" + segments.slice(0, index + 1).join("/");

        const collection = collections.find((item) => item.handle === segment);

        return {
          label:
            collection?.title ||
            (segment === "spareshunt"
              ? "Spares Hunt"
              : segment === "sellwithus"
                ? "Sell With Us"
                : formatSlug(segment)),
          href,
        };
      }),
    ];
  }, [pathname, cameFromCollection]);

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