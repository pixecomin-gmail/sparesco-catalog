"use client";

import { useParams } from "next/navigation";
import { useEnquiry } from "@/context/EnquiryContext";

export default function ProductPage() {
  const params = useParams();
  const handle = String(params.handle);

  const { addItem } = useEnquiry();

  const product = {
    handle,
    title: handle.replaceAll("-", " "),
    brand: "Caterpillar",
    category: "Sensors",
  };

  return (
    <main>
      <section className="section">
        <div className="container">
          <div className="breadcrumb">Home / Parts / Product</div>

          <div className="product-page-layout">
            <div className="product-gallery">
              <div className="main-product-image">Product Image</div>

              <div className="thumbnail-row">
                <div className="thumbnail"></div>
                <div className="thumbnail"></div>
                <div className="thumbnail"></div>
                <div className="thumbnail"></div>
              </div>
            </div>

            <div className="product-details">
              <span className="product-brand">{product.brand}</span>

              <h1 className="product-title">{product.title}</h1>

              <div className="product-meta">
                <div>
                  <strong>Part Number</strong>
                  <span>130-9811</span>
                </div>

                <div>
                  <strong>Category</strong>
                  <span>{product.category}</span>
                </div>

                <div>
                  <strong>Availability</strong>
                  <span>Available on enquiry</span>
                </div>
              </div>

              <p className="product-description">
                High quality industrial spare part suitable for heavy equipment
                and machinery applications.
              </p>

              <div className="product-actions">
                <button
                  className="primary-button"
                  onClick={() => addItem(product)}
                >
                  Add To Enquiry
                </button>

                <button
                  className="secondary-button"
                  onClick={() => addItem(product)}
                >
                  Request Quote
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}