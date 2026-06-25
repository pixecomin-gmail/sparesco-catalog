"use client";

import { useState } from "react";
import Link from "next/link";

const footerSections = [
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/contact" },
      { label: "Sell With Sparesco", href: "/sellwithus" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Return & Refund Policy", href: "/returns" },
      { label: "Shipping Policy", href: "/shipping" },
    ],
  },
];

export default function SiteFooter() {
  const [openSection, setOpenSection] = useState<string | null>("Company");

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
                <Link key={link.label} href={link.href}>
                  {link.label}
                </Link>
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
                      <Link key={link.label} href={link.href}>
                        {link.label}
                      </Link>
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