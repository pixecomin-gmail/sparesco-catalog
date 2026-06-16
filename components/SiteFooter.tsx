"use client";

import { useState } from "react";

const footerSections = [
  {
    title: "Catalogue",
    links: ["Spare Parts", "Popular Categories", "Featured Products"],
  },
  {
    title: "Company",
    links: ["About Us", "Join Our Team", "Contact Us"],
  },
  {
    title: "For Vendors",
    links: ["Sell With Sparesco", "Vendor List", "Spares Hunt"],
  },
];

export default function SiteFooter() {
  const [openSection, setOpenSection] = useState<string | null>("Catalogue");

  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <img src="/logo.png" alt="Sparesco" className="footer-logo" />

          <p>
            Trusted industrial spare parts sourcing platform for construction,
            mining, power systems and heavy equipment.
          </p>
        </div>

        <div className="footer-links footer-links-desktop">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4>{section.title}</h4>
              {section.links.map((link) => (
                <a key={link}>{link}</a>
              ))}
            </div>
          ))}
        </div>

        <div className="footer-accordion">
          {footerSections.map((section) => {
            const isOpen = openSection === section.title;

            return (
              <div className="footer-accordion-item" key={section.title}>
                <button
                  type="button"
                  onClick={() => setOpenSection(isOpen ? null : section.title)}
                >
                  <span>{section.title}</span>
                  <span>{isOpen ? "−" : "+"}</span>
                </button>

                {isOpen && (
                  <div className="footer-accordion-links">
                    {section.links.map((link) => (
                      <a key={link}>{link}</a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="container footer-bottom-new">
        <span>© 2026 Sparesco. All rights reserved.</span>
        <span>Built for industrial spare parts sourcing.</span>
      </div>
    </footer>
  );
}