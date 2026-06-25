import "../terms/terms.css";

export default function PrivacyPage() {
  return (
    <main className="legal-page">
    <section className="legal-body">
        <div className="legal-layout">
        <aside className="legal-summary">
            <div className="legal-summary-inner">
              <h1>Privacy Policy</h1>
              <p>Last Updated: June 2026</p>
            </div>
          </aside>

          <div className="legal-content">
            <section>
              <h2>1. What We Collect</h2>
              <ul>
                <li>Account information such as name, email, phone and company details.</li>
                <li>Enquiry details including part numbers, equipment specifications and quantities required.</li>
                <li>Vendor information such as business details, product catalogues and pricing.</li>
                <li>Technical data including IP address, browser, device, pages visited and cookies.</li>
              </ul>
            </section>

            <section>
              <h2>2. How We Use It</h2>
              <ul>
                <li>To run and improve the Sparesco platform.</li>
                <li>To connect Buyers with relevant Vendors for enquiries and quotations.</li>
                <li>To verify Vendor identities and maintain platform security.</li>
                <li>To send account updates, enquiry notifications and service messages.</li>
                <li>To send marketing emails only where consent is provided.</li>
                <li>To prevent fraud, misuse and security issues.</li>
              </ul>
            </section>

            <section>
              <h2>3. Who We Share With</h2>
              <ul>
                <li>Relevant Vendors may receive enquiry details so they can provide quotations.</li>
                <li>Service providers may help with hosting, email, payment processing and analytics.</li>
                <li>Legal authorities may receive information where required by law.</li>
                <li>We do not sell your personal information to marketers.</li>
              </ul>
            </section>

            <section>
              <h2>4. Your Rights</h2>
              <ul>
                <li>You may request access to personal information we hold about you.</li>
                <li>You may request correction of inaccurate information.</li>
                <li>You may request deletion of your data, subject to legal requirements.</li>
                <li>You may opt out of marketing emails at any time.</li>
                <li>You may contact us for privacy-related questions or requests.</li>
              </ul>
            </section>

            <section>
              <h2>5. Security</h2>
              <p>
                We use reasonable security measures including encryption, access controls
                and secure infrastructure. However, no online system can be guaranteed
                to be completely secure.
              </p>
            </section>

            <section>
              <h2>6. Cookies</h2>
              <ul>
                <li>Essential cookies are required for the website to work.</li>
                <li>Preference cookies help remember your settings.</li>
                <li>Analytics cookies help us understand website usage and performance.</li>
                <li>You can block cookies through your browser settings.</li>
              </ul>
            </section>

            <section>
              <h2>7. Contact</h2>
              <p>
                For privacy-related questions, contact us at{" "}
                <strong>privacy@sparesco.com</strong>.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}