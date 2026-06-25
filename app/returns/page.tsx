import "../terms/terms.css";

export default function ReturnsPage() {
  return (
    <main className="legal-page">
      <section className="legal-body">
        <div className="legal-layout">
          <aside className="legal-summary">
            <div className="legal-summary-inner">
              <h1>Return & Refund Policy</h1>
              <p>Last Updated: June 2026</p>
            </div>
          </aside>

          <div className="legal-content">
            <section>
              <h2>1. Our Role</h2>
              <p>
                Sparesco is a platform connecting Buyers and Vendors. We do not
                handle returns or issue refunds directly. All return and refund
                requests are managed by the Vendor from whom the product was
                purchased.
              </p>
            </section>

            <section>
              <h2>2. Eligible Returns</h2>
              <ul>
                <li>Defective or damaged goods.</li>
                <li>Incorrect part number or specification supplied.</li>
                <li>Products that do not match the agreed quotation.</li>
                <li>Returns accepted under the Vendor's individual return policy.</li>
              </ul>
            </section>

            <section>
              <h2>3. Non-Returnable Items</h2>
              <ul>
                <li>Products no longer required by the Buyer.</li>
                <li>Installed, used or modified parts.</li>
                <li>Custom-made or special-order items.</li>
                <li>Electrical components unless confirmed defective.</li>
                <li>Opened consumables such as filters, seals and lubricants.</li>
              </ul>
            </section>

            <section>
              <h2>4. Return Process</h2>
              <ul>
                <li>Notify the Vendor within the applicable return period.</li>
                <li>Provide order details and photographs of the issue.</li>
                <li>Wait for Vendor approval before returning the item.</li>
                <li>Follow Vendor instructions for packaging and shipment.</li>
                <li>Refunds or replacements are processed after inspection.</li>
              </ul>
            </section>

            <section>
              <h2>5. Shipping Costs</h2>
              <ul>
                <li>Vendor pays return shipping for defective or incorrect products.</li>
                <li>Buyer pays return shipping where returns are accepted for other reasons.</li>
                <li>International returns may involve duties, taxes and customs charges.</li>
              </ul>
            </section>

            <section>
              <h2>6. Refund Options</h2>
              <ul>
                <li>Full refund where a Vendor cannot fulfil an order correctly.</li>
                <li>Partial refund for minor defects or quantity discrepancies.</li>
                <li>Replacement product where available.</li>
                <li>Store credit where offered by the Vendor.</li>
              </ul>
            </section>

            <section>
              <h2>7. Warranty Claims</h2>
              <p>
                Product warranties are provided by the Vendor or manufacturer.
                Warranty claims should be submitted directly to the Vendor.
                Sparesco may assist with contact information but does not process
                warranty claims.
              </p>
            </section>

            <section>
              <h2>Contact</h2>
              <p>
                For return and refund related enquiries, contact:
              </p>

              <p>
                <strong>returns@sparesco.com</strong>
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