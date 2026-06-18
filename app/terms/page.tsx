import Link from "next/link";
import "./terms.css";

export default function TermsPage() {
  return (
     <main className="legal-page">
     <section className="legal-body">
        <div className="legal-layout">
        <aside className="legal-summary">
            <div className="legal-summary-inner">
                <h1>Terms & Conditions</h1>
                <p>Last Updated: June 2026</p>
            </div>
          </aside>

          <div className="legal-content">
            <section>
              <h2>1. About Sparesco</h2>
              <p>
                Sparesco is a catalogue and sourcing platform. We connect Buyers
                with Vendors. We do not manufacture, stock or sell spare parts
                directly. All transactions are between Buyer and Vendor only.
              </p>
            </section>

            <section>
              <h2>2. For Buyers</h2>
              <ul>
                <li>Submit enquiries for spare parts through our platform.</li>
                <li>Enquiries are non-binding until you accept a Vendor quotation.</li>
                <li>Verify part compatibility with your equipment before ordering.</li>
                <li>Sparesco does not guarantee availability, pricing or delivery timelines.</li>
                <li>All product information comes from Vendors and should be verified before purchase.</li>
              </ul>
            </section>

            <section>
              <h2>3. For Vendors</h2>
              <ul>
                <li>Provide accurate product information, pricing and stock levels.</li>
                <li>Ensure products meet quality standards and comply with applicable laws.</li>
                <li>Fulfil orders on time and handle your own shipping.</li>
                <li>Honour your own warranty, return and refund policies.</li>
                <li>Pay Sparesco commission or fees as per the Vendor Agreement.</li>
              </ul>
            </section>

            <section>
              <h2>4. Pricing & Payment</h2>
              <p>
                Prices shown are provided by Vendors and exclude taxes, duties,
                insurance and shipping unless clearly stated. Payment terms are
                agreed directly between Buyer and Vendor. Sparesco may assist
                with payment processing where applicable, but payment disputes
                remain between the transacting parties.
              </p>
            </section>

            <section>
              <h2>5. Shipping & Delivery</h2>
              <p>
                Vendors arrange shipping and delivery. Delivery timelines are
                estimates and not guarantees. International Buyers are
                responsible for import duties, taxes and customs requirements.
                Buyers should inspect goods on delivery and report damage within
                48 hours.
              </p>
            </section>

            <section>
              <h2>6. Returns & Refunds</h2>
              <p>
                Return and refund policies are set by each Vendor. Sparesco does
                not process returns or issue refunds. Buyers should check the
                Vendor&apos;s return policy before confirming an order. Sparesco
                may help mediate disputes but is not liable for the outcome.
              </p>
            </section>

            <section>
              <h2>7. Our Liability</h2>
              <p>
                Sparesco is not liable for product quality, defects,
                non-delivery, delays or disputes between Buyers and Vendors. We
                are not liable for direct, indirect or consequential damages
                arising from use of the platform.
              </p>
            </section>

            <section>
              <h2>8. Your Data</h2>
              <p>
                We collect information you provide, such as name, email, company
                details and enquiries. Enquiry details may be shared with
                relevant Vendors to facilitate quotations. Please refer to our
                Privacy Policy for more information.
              </p>
            </section>

            <section>
              <h2>9. Account & Termination</h2>
              <p>
                Users must keep account information accurate and secure.
                Sparesco may suspend accounts, remove listings or restrict
                access for fraud, abuse or policy violations.
              </p>
            </section>

            <section>
              <h2>10. Legal</h2>
              <p>
                These Terms are governed by the laws of India. Disputes shall be
                resolved by arbitration in Gurgaon, Haryana. If any clause is
                found invalid, the remaining terms remain effective.
              </p>
            </section>

            <section>
              <h2>Contact</h2>
              <p>
                For questions regarding these Terms, contact us at{" "}
                <strong>legal@sparesco.com</strong>.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}