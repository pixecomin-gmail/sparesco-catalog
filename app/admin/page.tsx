export const runtime = "edge";

export default function AdminHomePage() {
  return (
    <main className="admin-dashboard">
      <div className="admin-page-heading">
        <div>
          <h1>Home</h1>
          <p>
            Overview of your Sparesco catalogue and vendor activity.
          </p>
        </div>
      </div>

      <section className="admin-dashboard-section">
        <h2>Catalogue</h2>

        <div className="admin-stat-grid">
          <div className="admin-stat-card">
            <span>Total Products</span>
            <strong>—</strong>
            <small>Catalogue products</small>
          </div>

          <div className="admin-stat-card">
            <span>Collections</span>
            <strong>—</strong>
            <small>Product collections</small>
          </div>

          <div className="admin-stat-card">
            <span>Recently Added</span>
            <strong>—</strong>
            <small>New catalogue products</small>
          </div>
        </div>
      </section>

      <section className="admin-dashboard-section">
        <h2>Vendor Activity</h2>

        <div className="admin-stat-grid">
          <div className="admin-stat-card">
            <span>Total Vendors</span>
            <strong>—</strong>
            <small>Registered vendors</small>
          </div>

          <div className="admin-stat-card">
            <span>Pending Vendors</span>
            <strong>—</strong>
            <small>Waiting for approval</small>
          </div>

          <div className="admin-stat-card">
            <span>Pending Products</span>
            <strong>—</strong>
            <small>Vendor products awaiting review</small>
          </div>
        </div>
      </section>
    </main>
  );
}