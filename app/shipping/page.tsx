import "../terms/terms.css";

export default function ShippingPage() {
  return (
    <main className="legal-page">
      <section className="legal-body">
        <div className="legal-layout">
          <aside className="legal-summary">
            <div className="legal-summary-inner">
              <h1>Shipping Policy</h1>
              <p>Last Updated: June 2026</p>
            </div>
          </aside>

          <div className="legal-content">
            <section>
              <h2>1. Our Role</h2>
              <p>
                Sparesco is a platform connecting Buyers and Vendors. Shipping,
                dispatch and delivery are managed directly by the Vendor. Shipping
                terms may vary depending on the product, location and Vendor.
              </p>
            </section>

            <section>
              <h2>2. Shipping Methods</h2>
              <ul>
                <li>Road transport for domestic deliveries.</li>
                <li>Air freight for urgent shipments.</li>
                <li>Sea freight for international and bulk orders.</li>
                <li>Courier services for smaller packages and spare parts.</li>
              </ul>
            </section>

            <section>
              <h2>3. Delivery Timelines</h2>
              <ul>
                <li>Domestic deliveries typically take 5–10 business days.</li>
                <li>International deliveries typically take 10–25 business days.</li>
                <li>Custom-made or special-order items may require additional lead time.</li>
                <li>Delivery estimates provided by Vendors are indicative only.</li>
              </ul>
            </section>

            <section>
              <h2>4. Shipping Costs</h2>
              <p>
                Shipping charges are determined by the Vendor and may depend on
                product weight, dimensions, destination and shipping method.
                Applicable duties, taxes and customs fees are the responsibility
                of the Buyer unless otherwise agreed.
              </p>
            </section>

            <section>
              <h2>5. Tracking Information</h2>
              <p>
                Where available, Vendors will provide shipment tracking details
                after dispatch. Tracking availability depends on the selected
                shipping service.
              </p>
            </section>

            <section>
              <h2>6. Damaged or Lost Shipments</h2>
              <ul>
                <li>Inspect all shipments upon delivery.</li>
                <li>Report visible damage within 48 hours of receipt.</li>
                <li>Retain packaging and supporting documentation where possible.</li>
                <li>Claims for damaged or lost shipments are handled by the Vendor.</li>
              </ul>
            </section>

            <section>
              <h2>7. International Orders</h2>
              <p>
                International Buyers are responsible for complying with local
                import regulations and paying any applicable duties, taxes,
                customs charges or clearance fees.
              </p>
            </section>

            <section>
              <h2>Contact</h2>
              <p>
                For shipping-related enquiries, contact:
              </p>

              <p>
                <strong>logistics@sparesco.com</strong>
                <br />
                +91 124 456 7890
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}