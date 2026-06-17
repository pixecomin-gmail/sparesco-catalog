"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Product } from "@/lib/products";
import { useEnquiry } from "@/context/EnquiryContext";

function cleanVariantTitle(title: string) {
  return title
    .split("| Replaces")[0]
    .split("| replaces")[0]
    .split(" Replaces")[0]
    .split(" replaces")[0]
    .trim();
}

export default function ProductPage() {
  const params = useParams();
  const handle = String(params.handle);
  const { addItem } = useEnquiry();

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState("");
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);

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

  const activeVariant = product.variants[activeVariantIndex];

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="breadcrumb">
            Home / Parts / {product.collection} / {product.title}
          </div>

          <div className="product-page-layout product-page-compact-layout">
            <div className="product-gallery">
              <div className="main-product-image">
                {activeImage ? (
                  <img src={activeImage} alt={product.title} />
                ) : (
                  <span>Product Image</span>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="thumbnail-row">
                  {product.images.map((image) => (
                    <button
                      key={image}
                      className={
                        activeImage === image ? "thumbnail active" : "thumbnail"
                      }
                      onClick={() => setActiveImage(image)}
                    >
                      <img src={image} alt={product.title} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="product-details">
              <div className="selected-variant-name">
                {cleanVariantTitle(activeVariant.title)}
              </div>

              <h1 className="product-title">{product.title}</h1>

              <div className="variant-section product-variant-inline">
                <div className="variant-list compact-variant-list">
                  {product.variants.map((variant, index) => (
                    <button
                      key={variant.sku}
                      className={
                        index === activeVariantIndex
                          ? "variant-card compact-variant-card active"
                          : "variant-card compact-variant-card"
                      }
                      onClick={() => {
                        setActiveVariantIndex(index);
                        if (variant.image) setActiveImage(variant.image);
                      }}
                    >
                      <span>{cleanVariantTitle(variant.title)}</span>
                      <strong>
                      {variant.price > 0
                        ? `₹${variant.price.toLocaleString("en-IN")}`
                        : "Price On Request"}
                    </strong>
                    </button>
                  ))}
                </div>
              </div>

              <div className="product-actions">
                <button
                  className="primary-button"
                  onClick={() =>
                    addItem({
                      id: `${product.handle}-${activeVariant.partNumber}`,
                      handle: product.handle,
                      title: product.title,
                      image: activeVariant.image || activeImage || product.images?.[0] || "",
                      partNumber: activeVariant.partNumber,
                      vendor: cleanVariantTitle(activeVariant.title),
                      price: activeVariant.price,
                    })
                  }
                >
                  Add To Enquiry
                </button>
              </div>
            </div>

            <div className="specification-table product-specs-compact">
              <h2>Technical Specifications</h2>

              <div>
                <strong>Part Number</strong>
                <span>{activeVariant.partNumber}</span>
              </div>

              {activeVariant.hsCode && (
                <div>
                  <strong>HS Code</strong>
                  <span>{activeVariant.hsCode}</span>
                </div>
              )}

              {activeVariant.countryOfOrigin && (
                <div>
                  <strong>Country of Origin</strong>
                  <span>{activeVariant.countryOfOrigin}</span>
                </div>
              )}

              {activeVariant.unitWeight && (
                <div>
                  <strong>Unit Weight</strong>
                  <span>{activeVariant.unitWeight}</span>
                </div>
              )}

              {activeVariant.shippingVolume && (
                <div>
                  <strong>Shipping Volume</strong>
                  <span>{activeVariant.shippingVolume}</span>
                </div>
              )}

              {activeVariant.specifications.map((spec) => {
                const [label, ...valueParts] = spec.split(":");

                return (
                  <div key={spec}>
                    <strong>{label}</strong>
                    <span>{valueParts.join(":").trim()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="product-description-box product-description-full">
            <h2>Description</h2>
            <p>{activeVariant.description || "Description not available."}</p>
          </div>
        </div>
      </section>
    </main>
  );
}