export default function EnquiryPage() {
  return (
    <main>
      <section className="section">
        <div className="container">
          <h1 className="page-title">Submit Enquiry</h1>
          <p className="page-intro">
            Review your selected products and share your details. Our team will contact you.
          </p>

          <div className="enquiry-page-layout">
            <div className="enquiry-summary">
              <h2>Products Summary</h2>

              <div className="enquiry-item">
                <div>
                  <strong>130-9811 Temperature Sensor</strong>
                  <span>Caterpillar • Sensors</span>
                </div>

                <div className="qty-control">
                  <button>-</button>
                  <span>1</span>
                  <button>+</button>
                </div>

                <button className="remove-button">Remove</button>
              </div>

              <label className="form-field">
                General Notes
                <textarea placeholder="Mention required quantity, machine model, urgency or any other details..." />
              </label>
            </div>

            <form className="enquiry-form">
              <label className="form-field">
                Name *
                <input placeholder="Your full name" />
              </label>

              <label className="form-field">
                Company *
                <input placeholder="Company name" />
              </label>

              <label className="form-field">
                Email *
                <input placeholder="Email address" />
              </label>

              <label className="form-field">
                Phone *
                <input placeholder="Phone number" />
              </label>

              <label className="form-field">
                Message
                <textarea placeholder="Additional message" />
              </label>

              <button className="primary-button">Submit Enquiry</button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}