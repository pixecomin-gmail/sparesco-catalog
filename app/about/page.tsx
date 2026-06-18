import Link from "next/link";

export const metadata = {
  title: "About Sparesco | Global Construction & Industrial Spare Parts Catalogue",
  description:
    "Sparesco is a global spare parts catalogue and sourcing platform for construction, mining, material handling and industrial equipment spare parts.",
};

const industries = [
  {
    title: "Construction Equipment",
    text: "Spare parts support for excavators, loaders, backhoe loaders, compactors, cranes and site machinery.",
  },
  {
    title: "Mining Equipment",
    text: "Heavy-duty replacement parts for drilling equipment, mining machinery and demanding worksite operations.",
  },
  {
    title: "Material Handling",
    text: "Parts for forklifts, reach stackers, lifting equipment, handlers and warehouse support machinery.",
  },
  {
    title: "Industrial Machinery",
    text: "Components for generators, compressors, pumps, engines, hydraulic systems and industrial applications.",
  },
];

const reasons = [
  {
    title: "Extensive Parts Catalogue",
    text: "A growing catalogue of spare parts across equipment categories, part numbers and technical specifications.",
  },
  {
    title: "Global Supplier Network",
    text: "Sourcing support through trusted manufacturers, distributors and spare parts supply partners.",
  },
  {
    title: "Fast Part Identification",
    text: "Search by category, part number, brand, product name or equipment application to identify parts faster.",
  },
  {
    title: "Enquiry-Based Support",
    text: "Submit your requirement and receive assistance for availability, compatibility and sourcing options.",
  },
];

const process = [
  {
    title: "Search Catalogue",
    text: "Browse by category, equipment type or part number.",
  },
  {
    title: "Submit Enquiry",
    text: "Add products or share your requirements.",
  },
  {
    title: "Review & Verify",
    text: "Availability, compatibility and sourcing review.",
  },
  {
    title: "Receive Support",
    text: "Quotation and procurement assistance.",
  },
];

const brands = [
  "Caterpillar",
  "Komatsu",
  "Volvo",
  "Hitachi",
  "JCB",
  "Liebherr",
  "Doosan",
  "Hyundai",
  "Kobelco",
  "Sany",
  "Case",
  "New Holland",
  "Terex",
  "Bobcat",
  "Perkins",
  "Cummins",
  "Deutz",
  "Kubota",
  "Atlas Copco",
  "Epiroc",
  "Sandvik",
  "Manitou",
  "Toyota",
  "Mitsubishi",
];

const stats = [
  ["100,000+", "Parts Catalogue"],
  ["50+", "Equipment Categories"],
  ["Global", "Supplier Network"],
  ["Worldwide", "Customer Reach"],
];

export default function AboutPage() {
  return (
    <main>
      <section className="about-page-hero">
        <div className="container">
          <span className="tagline">About Sparesco</span>

          <h1>
            Construction, Mining & Industrial Spare Parts Catalogue
          </h1>

          <p>
            Discover spare parts for heavy equipment, mining machinery, material
            handling equipment and industrial applications. Browse by category,
            equipment type or part number and submit enquiries for sourcing support.
          </p>

          <div className="button-row">
            <Link href="/collections">Browse Categories</Link>
            <Link href="/enquiry" className="secondary">
              Submit Part Enquiry
            </Link>
          </div>
        </div>
      </section>

      <section className="section about-white-section">
        <div className="container about-intro-grid">
          <div className="about-image-box">
            <img
              src="/images/about-spare-parts.png"
              alt="Industrial spare parts warehouse with mechanical components"
            />
          </div>

          <div className="about-text-box">
            <h2>About Sparesco</h2>
            <p>
              Sparesco is a global spare parts catalogue and sourcing platform
              built for construction equipment, mining machinery, material
              handling equipment and industrial applications.
            </p>
            <p>
              Whether you are searching for filters, hydraulic components,
              engine parts, electrical systems, undercarriage parts or other
              replacement components, our catalogue helps businesses identify
              and source the right parts quickly.
            </p>
          </div>
        </div>
      </section>

      <section className="section about-blue-section">
        <div className="container">
          <div className="about-section-heading">
            <h2>Industries We Serve</h2>
            <p>
              Supporting spare parts requirements across construction, mining,
              material handling and industrial machinery sectors.
            </p>
          </div>

          <div className="about-card-grid">
            {industries.map((item) => (
              <article className="about-info-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-white-section">
        <div className="container">
            <div className="about-section-heading">
            <h2>Why Businesses Choose Sparesco</h2>
            <p>
                Built for equipment owners, dealers, service teams and industrial buyers
                who need reliable spare parts sourcing support.
            </p>
            </div>

            <div className="about-why-layout">
            <article className="about-why-main">
                <h3>Built for Spare Parts Procurement</h3>
            <p>
                Sparesco brings product discovery, part number search and enquiry-based
                sourcing into one catalogue experience for heavy equipment and
                industrial businesses.
                </p>

                <div className="about-why-stats-grid">
                {stats.map(([number, label]) => (
                    <div key={label}>
                    <strong>{number}</strong>
                    <span>{label}</span>
                    </div>
                ))}
                </div>
            </article>

            <div className="about-why-list">
                {reasons.slice(1).map((item) => (
                <article className="about-why-row" key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                </article>
                ))}
            </div>
            </div>
        </div>
      </section>

      <section className="section about-brand-cta-section">
        <div className="container">
            <div className="about-brand-cta-box">

            <h2>Equipment Brands We Support</h2>

            <p>
                Supporting equipment owners, dealers, rental companies,
                service providers and industrial buyers worldwide.
            </p>

            <div className="about-brand-pills">
                {brands.map((brand) => (
                <span key={brand}>{brand}</span>
                ))}
            </div>

            <div className="about-brand-divider" />

            <div className="about-brand-cta">
                <div>
                <h3>Can&apos;t Find the Spare Part You Need?</h3>

                <p>
                    Share your part number, equipment model or technical
                    requirement and our team will help you source suitable
                    options.
                </p>
                </div>

                <Link href="/enquiry">Submit Enquiry</Link>
            </div>

            </div>
        </div>
        </section>
    </main>
  );
}