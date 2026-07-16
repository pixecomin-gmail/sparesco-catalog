"use client";

import Link from "next/link";
import { getCatalogImageUrls, type ProductIndexItem } from "@/lib/products";
import { useEnquiry } from "@/context/EnquiryContext";

export default function CollectionProductCard({
  product,
}: {
  product: ProductIndexItem;
}) {
  const { addItem } = useEnquiry();

  const { thumbnail: imageSrc, original: originalImageSrc } = getCatalogImageUrls(product);

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
          <img
            src={imageSrc || originalImageSrc || "/images/product-placeholder.webp"}
            alt={product.title || product.partNumber || "Spare part"}
            loading="lazy"
            onError={(event) => {
              const img = event.currentTarget;

              if (
                originalImageSrc &&
                img.src !== originalImageSrc
              ) {
                img.src = originalImageSrc;
                return;
              }

              if (!img.src.endsWith("/images/product-placeholder.webp")) {
                img.src = "/images/product-placeholder.webp";
              }
            }}
          />
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
              image: imageSrc ||
                originalImageSrc ||
                "/images/product-placeholder.webp",
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