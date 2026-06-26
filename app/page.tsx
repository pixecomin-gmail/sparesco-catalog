import HomeHero from "@/components/HomeHero";
import StatsCounter from "@/components/StatsCounter";
import FeaturedProductsSlider from "@/components/FeaturedProductsSlider";
import PopularSparePartsList from "@/components/PopularSparePartsList";
import HomePopularCategories from "@/components/HomePopularCategories";

export default function Home() {
  return (
    <main>
      <HomeHero />

      <StatsCounter />

      <FeaturedProductsSlider />

      <HomePopularCategories />

      <section className="section industry-section">
        <div className="container">
          <div className="industry-header">
            <span className="tagline">Industries We Serve</span>

            <h2>Parts For Every Industry</h2>

            <p>
              Sparesco helps equipment owners, contractors, fleet operators and
              vendors source spare parts for construction, mining, lifting and
              road-building machinery.
            </p>
          </div>

          <div className="industry-grid industry-grid-modern">
            <div className="industry-card industry-card-modern">
              <h3>Mining</h3>
              <p>
                Crushers, conveyors, drilling rigs, haul trucks — every part,
                any brand.
              </p>
            </div>

            <div className="industry-card industry-card-modern">
              <h3>Construction</h3>
              <p>
                Excavators, loaders, compactors, graders — OEM and aftermarket.
              </p>
            </div>

            <div className="industry-card industry-card-modern">
              <h3>Power Systems</h3>
              <p>
                Generators, turbines, and industrial engines — filters to
                injectors.
              </p>
            </div>

            <div className="industry-card industry-card-modern">
              <h3>Heavy Lifts</h3>
              <p>
                Mobile, tower, and overhead cranes — slewing rings to control
                systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      <PopularSparePartsList />

      <section className="section dark-cta-section">
        <div className="container dark-cta-grid">
          <div className="dark-cta-card">
            <span>Careers</span>
            <h3>Join Our Team</h3>
            <p>
              Build your career with a fast-growing industrial marketplace
              serving construction, mining and heavy equipment industries.
            </p>
            <button>Apply Now</button>
          </div>

          <div className="dark-cta-card">
            <span>Support</span>
            <h3>Contact Us</h3>
            <p>
              Looking for a hard-to-find spare part? Our team can help you
              connect with genuine vendors and source the right part faster.
            </p>
            <button>Contact Us</button>
          </div>
        </div>
      </section>

      <section className="section partner-section">
        <div className="container">
          <div className="partner-heading">
            <span className="tagline">Partner With Us</span>

            <h2>Sell With Sparesco</h2>

            <p>
              List your spare parts inventory on Sparesco and reach thousands of
              verified buyers globally. Fast onboarding, zero upfront fees.
            </p>
          </div>

          <form className="partner-form-wide">
            <input placeholder="First Name *" />
            <input placeholder="Company Name" />
            <input placeholder="Email *" />
            <input placeholder="Phone *" />
            <textarea placeholder="Products to List *" />
            <button type="submit">Submit Application</button>
          </form>
        </div>
      </section>

      <section className="marquee-section">
        <div className="container marquee-container">
          <div className="marquee-label">We Work With :</div>

          <div className="marquee-wrapper">
            <div className="marquee-track">
              <span>
                Dealers | Auctioneers | Manufacturers | Other Equipment Owners
                | Dealers | Auctioneers | Manufacturers | Equipment Owners |
              </span>

              <span>
                Dealers | Auctioneers | Manufacturers | Other Equipment Owners
                | Dealers | Auctioneers | Manufacturers | Equipment Owners |
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}