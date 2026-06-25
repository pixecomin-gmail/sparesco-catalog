"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/types/product";
import { useEnquiry } from "@/context/EnquiryContext";
import ProductFaqTrustSection from "@/components/ProductFaqTrustSection";
import RecentlyViewed from "@/components/RecentlyViewed";

function cleanVariantTitle(title: string) {
  return title
    .split("| Replaces")[0]
    .split("| replaces")[0]
    .split(" Replaces")[0]
    .split(" replaces")[0]
    .trim();
}

function getCleanSpecs(specifications: string[]) {
  return specifications.filter((spec) => {
    if (!spec.includes(":")) return false;

    const [label, ...valueParts] = spec.split(":");
    const cleanLabel = label.trim();
    const cleanValue = valueParts.join(":").trim();

    return cleanLabel && cleanValue && cleanLabel.length <= 45;
  });
}

export default function ProductPageClient({ handle }: { handle: string }) {
  const { addItem } = useEnquiry();

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState("");
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  useEffect(() => {
    fetch(`/data/products/${handle}.json`)
      .then((res) => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
      })
      .then((data: Product) => {
        setProduct(data);
        setActiveImage(data.images?.[0] || "");
      })
      .catch(() => setProduct(null));
  }, [handle]);

  if (!product) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <h1>Product not found</h1>
          </div>
        </section>
      </main>
    );
  }

  const currentProduct = product;
  const activeVariant = currentProduct.variants[activeVariantIndex];

  if (!activeVariant) return null;

  const activeVariantTitle = cleanVariantTitle(activeVariant.title);

  const activePrice =
    activeVariant.price > 0
      ? `₹${activeVariant.price.toLocaleString("en-IN")}`
      : "Price On Request";

  const stickyImage =
    activeVariant.image || activeImage || currentProduct.images?.[0] || "";

  const specs = Array.from(
    new Set(
      [
        `Part Number: ${activeVariant.partNumber}`,
        activeVariant.hsCode ? `HS Code: ${activeVariant.hsCode}` : "",
        activeVariant.countryOfOrigin
          ? `Country of Origin: ${activeVariant.countryOfOrigin}`
          : "",
        activeVariant.unitWeight
          ? `Unit Weight: ${activeVariant.unitWeight}`
          : "",
        activeVariant.shippingVolume
          ? `Shipping Volume: ${activeVariant.shippingVolume}`
          : "",
        ...getCleanSpecs(activeVariant.specifications || []),
      ].filter(Boolean)
    )
  );

  function addActiveVariantToEnquiry() {
    addItem({
      id: `${currentProduct.handle}-${activeVariant.partNumber}`,
      handle: currentProduct.handle,
      title: currentProduct.title,
      image: stickyImage,
      partNumber: activeVariant.partNumber,
      vendor: activeVariantTitle,
      price: activeVariant.price,
    });
  }

  return (
    <main>
      <section className="section product-page-section">
        <div className="container">
          <div className="product-page-layout product-redesign-layout">
            <div className="product-gallery product-gallery-sticky">
              <div className="main-product-image">
                {activeImage ? (
                  <img src={activeImage} alt={currentProduct.title} />
                ) : (
                  <span>Product Image</span>
                )}
              </div>

              {currentProduct.images.length > 1 && (
                <div className="thumbnail-row">
                  {currentProduct.images.map((image) => (
                    <button
                      key={image}
                      type="button"
                      className={
                        activeImage === image ? "thumbnail active" : "thumbnail"
                      }
                      onClick={() => setActiveImage(image)}
                    >
                      <img src={image} alt={currentProduct.title} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="product-redesign-details">
              <div className="product-heading-block">
                <div className="product-title-price-row">
                  <div className="selected-variant-name">
                    {activeVariantTitle}
                  </div>

                  <div className="product-top-price">{activePrice}</div>
                </div>

                <h1 className="product-title">{currentProduct.title}</h1>
              </div>

              <div className="variant-section">
                <div className="variant-list variant-list-two-column">
                  {currentProduct.variants.map((variant, index) => (
                    <button
                      key={variant.sku || `${variant.partNumber}-${index}`}
                      type="button"
                      className={
                        index === activeVariantIndex
                          ? "variant-card variant-card-simple active"
                          : "variant-card variant-card-simple"
                      }
                      onClick={() => {
                        setActiveVariantIndex(index);
                        setSpecsOpen(false);
                        setDescriptionOpen(false);
                        if (variant.image) setActiveImage(variant.image);
                      }}
                    >
                      <span>{cleanVariantTitle(variant.title)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="product-specs-panel">
                <button
                  type="button"
                  className="product-section-header"
                  onClick={() => setSpecsOpen((current) => !current)}
                >
                  <span>Technical Specifications</span>
                  <strong>{specsOpen ? "−" : "+"}</strong>
                </button>

                <div
                  className={
                    specsOpen
                      ? "specification-table product-specs-preview open"
                      : "specification-table product-specs-preview closed"
                  }
                >
                  {specs.map((spec) => {
                    const [label, ...valueParts] = spec.split(":");
                    const cleanLabel = label.trim();
                    const cleanValue = valueParts.join(":").trim();

                    return (
                      <div key={spec}>
                        <strong>{cleanLabel}</strong>
                        <span>{cleanValue}</span>
                      </div>
                    );
                  })}

                  {!specsOpen && <div className="specs-fade" />}
                </div>
              </div>

              <div className="product-description-accordion">
                <button
                  type="button"
                  className="product-section-header"
                  onClick={() => setDescriptionOpen((current) => !current)}
                >
                  <span>Description</span>
                  <strong>{descriptionOpen ? "−" : "+"}</strong>
                </button>

                <div
                  className={
                    descriptionOpen
                      ? "product-description-box open"
                      : "product-description-box closed"
                  }
                >
                  <p>
                    {activeVariant.description || "Description not available."}
                  </p>

                  {!descriptionOpen && <div className="description-fade" />}
                </div>
              </div>
            </div>
          </div>
        </div>
        <ProductFaqTrustSection onRequestQuote={addActiveVariantToEnquiry} />
        <RecentlyViewed currentHandle={currentProduct.handle} />
      </section>

      <div className="sticky-enquiry-bar">
        <div className="sticky-enquiry-inner">
          <div className="sticky-selected-variant">
            <div className="sticky-selected-image">
              {stickyImage ? (
                <img src={stickyImage} alt={activeVariantTitle} />
              ) : null}
            </div>

            <div>
              <span>Selected Variant</span>
              <strong>{activeVariantTitle}</strong>
            </div>
          </div>

          <div className="sticky-enquiry-actions">
            <strong>{activePrice}</strong>

            <button
              type="button"
              className="primary-button"
              onClick={addActiveVariantToEnquiry}
            >
              Add To Enquiry
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}