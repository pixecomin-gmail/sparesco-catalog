"use client";

import Link from "next/link";
import { getCatalogImageUrls, type ProductIndexItem } from "@/lib/products";
import { useEnquiry } from "@/context/EnquiryContext";

function replaceFilterFinder(value?: string) {
  if (!value) return "";

  return String(value)
    .replace(/\bfilter\s*finder\b/gi, "Sparesco")
    .replace(/\bfilterfinder\b/gi, "Sparesco")
    .replace(/\s+/g, " ")
    .trim();
}

export default function CollectionProductCard({
  product,
}: {
  product: ProductIndexItem;
}) {
  const { addItem } = useEnquiry();

  const safeTitle = replaceFilterFinder(product.title);
  const safePartNumber = replaceFilterFinder(product.partNumber);
  const safeVendor = replaceFilterFinder(
    product.vendor || product.collection || ""
  );

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
        prefetch={false}
        className="parts-product-image"
        aria-label={safeTitle}
      >
        <img
          src={imageSrc || originalImageSrc || "/images/product-placeholder.webp"}
          alt={safeTitle || safePartNumber || "Spare part"}
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
          <Link
            href={`/products/${product.handle}`}
            prefetch={false}
          >
            {safeTitle}
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
              title: safeTitle,
              image:
                imageSrc ||
                originalImageSrc ||
                "/images/product-placeholder.webp",
              partNumber: safePartNumber || safeTitle,
              vendor: safeVendor,
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