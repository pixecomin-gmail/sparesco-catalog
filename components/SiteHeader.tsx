"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEnquiry } from "@/context/EnquiryContext";
import { searchProducts } from "@/lib/products";

export default function SiteHeader() {
  const router = useRouter();
  const { items, hasLoaded, openDrawer } = useEnquiry();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const filteredResults = useMemo(() => {
    return searchProducts(query, 4);
  }, [query]);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  const submitSearch = () => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) return;

    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    closeSearch();
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

          <Link href="/" className="logo-link">
            <img src="/logo.png" alt="Sparesco" className="site-logo" />
          </Link>

          <nav className="desktop-nav">
            <Link href="/parts">Spare Parts</Link>
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      submitSearch();
                    }
                  }}
                  placeholder="Search by part number, brand or description..."
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
                    filteredResults.map((product) => (
                      <Link
                        href={`/products/${product.handle}`}
                        key={product.handle}
                        onClick={closeSearch}
                      >
                        <strong>{product.title}</strong>
                        <span>
                          {product.collection}
                          {product.variantCount > 1
                            ? ` • ${product.variantCount} options`
                            : ""}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <span>No results found</span>
                  )}

                  <button
                    type="button"
                    className="header-view-all"
                    onClick={submitSearch}
                  >
                    View all results
                  </button>
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
              <Link href="/parts" onClick={() => setMobileMenuOpen(false)}>
                Spare Parts
              </Link>

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