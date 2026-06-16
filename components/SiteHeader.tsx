"use client";

import { useState } from "react";
import { useEnquiry } from "@/context/EnquiryContext";

const searchSuggestions = [
  "130-9811 Temperature Sensor",
  "5S0484 Oil Filter",
  "6.4139C Air Filter Assy",
  "Hydraulic Pump Assembly",
];

export default function SiteHeader() {
  const { items, hasLoaded, openDrawer } = useEnquiry();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const filteredResults = searchSuggestions.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <>
      <header className="site-header">
        <div className="container header-inner mobile-header-layout">
          <button
            className="hamburger-button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <a href="/" className="logo-link">
            <img src="/logo.png" alt="Sparesco" className="site-logo" />
          </a>

          <nav className="desktop-nav">
            <a href="/parts">Spare Parts</a>
            <a>Vendor List</a>
            <a>Spares Hunt</a>
            <a className="nav-button">Sell With Us</a>
          </nav>

          <div className="header-icons">
            <button
              className="icon-button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label="Search"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="16.65" y1="16.65" x2="21" y2="21" />
              </svg>
            </button>

            <button
              className="enquiry-icon-button"
              onClick={openDrawer}
              aria-label="Open enquiry list"
            >
              <span className="rfq-icon">▣</span>

              {hasLoaded && totalItems > 0 && (
                <span className="enquiry-count">{totalItems}</span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="header-search-panel">
            <div className="container">
              <div className="header-search-top">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search spare parts..."
                  autoFocus
                />

                <button
                  type="button"
                  className="close-search-button"
                  onClick={closeSearch}
                  aria-label="Close search"
                >
                  ×
                </button>
              </div>

              {query && (
                <div className="header-search-results">
                  {filteredResults.length > 0 ? (
                    filteredResults.map((item) => (
                      <a href="/parts" key={item} onClick={closeSearch}>
                        {item}
                      </a>
                    ))
                  ) : (
                    <span>No results found</span>
                  )}

                  <a
                    className="header-view-all"
                    href={`/parts?search=${encodeURIComponent(query)}`}
                    onClick={closeSearch}
                  >
                    View all results
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="mobile-menu-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-menu-header">
              <img src="/logo.png" alt="Sparesco" className="mobile-menu-logo" />

              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <nav className="mobile-nav">
              <a href="/parts" onClick={() => setMobileMenuOpen(false)}>
                Spare Parts
              </a>

              <a onClick={() => setMobileMenuOpen(false)}>Vendor List</a>

              <a onClick={() => setMobileMenuOpen(false)}>Spares Hunt</a>

              <a
                className="mobile-nav-button"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sell With Us
              </a>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}