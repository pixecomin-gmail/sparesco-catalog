"use client";

import Link from "next/link";
import type { ProductIndexItem } from "@/lib/products";
import { useEnquiry } from "@/context/EnquiryContext";

function getImageSrc(product: ProductIndexItem) {
  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, "");

  if (!product.image) return "";
  if (product.image.startsWith("http")) return product.image;
  if (!r2Base) return "";

  if (product.image.startsWith("catalog/images/")) {
    return `${r2Base}/${product.image}`;
  }

    const folder =
    product.collectionHandle ||
    product.collection ||
    product.category ||
    "";

    if (!folder) return "";

    return `${r2Base}/catalog/images/${folder}/${product.image}`;
}

export default function CollectionProductCard({
  product,
}: {
  product: ProductIndexItem;
}) {
  const { addItem } = useEnquiry();

  const imageSrc = getImageSrc(product);

  const hasPrice = typeof product.price === "number" && product.price > 0;
  const hasMultipleOptions = product.variantCount > 1;

  const priceText = hasPrice
    ? hasMultipleOptions
      ? `From ₹${product.price.toLocaleString("en-IN")}`
      : `₹${product.price.toLocaleString("en-IN")}`
    : "Price On Request";

  const metaText = hasMultipleOptions
    ? `${priceText} • ${product.variantCount} Options`
    : priceText;

  return (
    <article className="parts-product-card">
      <Link
        href={`/products/${product.handle}`}
        className="parts-product-image"
        aria-label={product.title}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.title}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span>No Image</span>
        )}
      </Link>

      <div className="parts-product-info">
        <h3>
          <Link href={`/products/${product.handle}`}>
            {product.title}
          </Link>
        </h3>

        <p className="parts-product-meta">{metaText}</p>

        <button
          type="button"
          className="parts-enquiry-button"
          onClick={() =>
            addItem({
              id: product.handle,
              handle: product.handle,
              title: product.title,
              image: imageSrc,
              partNumber: product.partNumber || product.title,
              vendor: product.vendor || product.collection || "",
              price: product.price || 0,
            })
          }
        >
          Add To Enquiry
        </button>
      </div>
    </article>
  );
}