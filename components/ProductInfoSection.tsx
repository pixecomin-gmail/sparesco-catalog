import Link from "next/link";

export default function ProductInfoSection() {
  return (
    <section className="product-info-section">
      <div className="product-info-left">
        <details open>
          <summary>FAQ</summary>

          <div className="product-info-content">
            <h4>Is this an OEM or aftermarket part?</h4>
            <p>
              We supply both genuine OEM and high-quality aftermarket spare
              parts. If you require a specific option, mention it in your
              enquiry.
            </p>

            <h4>How do I confirm compatibility?</h4>
            <p>
              Share your machine make, model, serial number, or existing part
              number. Our team will help verify the correct replacement.
            </p>

            <h4>Can you source hard-to-find parts?</h4>
            <p>
              Yes. Through our supplier network, we can help source obsolete,
              discontinued, or difficult-to-find spare parts.
            </p>
          </div>
        </details>

        <details>
          <summary>Shipping & Delivery</summary>
          <div className="product-info-content">
            <p>
              Worldwide shipping is available with standard and express delivery
              options. Delivery time depends on stock availability and location.
            </p>
          </div>
        </details>

        <details>
          <summary>Returns & Support</summary>
          <div className="product-info-content">
            <p>
              Technical support is available before ordering. Please contact our
              team before initiating any return or replacement request.
            </p>
          </div>
        </details>
      </div>

      <aside className="product-info-card">
        <h3>Why Choose Sparesco</h3>

        <div className="product-info-point">
          <strong>OEM & Aftermarket Parts</strong>
          <span>Genuine and premium replacement spare parts.</span>
        </div>

        <div className="product-info-point">
          <strong>Global Supplier Network</strong>
          <span>Parts sourced from trusted manufacturers and distributors.</span>
        </div>

        <div className="product-info-point">
          <strong>Technical Part Identification</strong>
          <span>Support for matching part numbers and equipment details.</span>
        </div>

        <div className="product-info-point">
          <strong>Worldwide Shipping</strong>
          <span>Reliable delivery options for domestic and international orders.</span>
        </div>

        <div className="product-info-help">
          <h4>Need Help Finding This Part?</h4>
          <p>
            Our specialists can help identify compatible or replacement parts for
            your equipment.
          </p>

          <Link href="/enquiry" className="product-info-btn">
            Request a Quote
          </Link>
        </div>
      </aside>
    </section>
  );
}