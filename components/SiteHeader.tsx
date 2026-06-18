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
  const [query, setQuery] = useState("");

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const filteredResults = useMemo(() => searchProducts(query, 4), [query]);

  const submitSearch = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
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

          <Link href="/" className="logo-link">
            <img src="/logo.png" alt="Sparesco" className="site-logo" />
          </Link>

          <nav className="desktop-nav">
            <Link href="/collections">Categories</Link>
            <Link href="/parts">Spare Parts</Link>
            <Link href="/spareshunt">Spares Hunt</Link>
            <Link href="/sellwithus" className="nav-button">
              Sell With Us
            </Link>
          </nav>

          <div className="header-search-inline">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch();
              }}
              placeholder="Search parts..."
            />

            <button type="button" onClick={submitSearch} aria-label="Search">
              <svg
                width="18"
                height="18"
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

            {query && (
              <div className="header-inline-results">
                {filteredResults.length > 0 ? (
                  filteredResults.map((product) => (
                    <Link
                      href={`/products/${product.handle}`}
                      key={product.handle}
                      onClick={() => setQuery("")}
                    >
                      <strong>{product.title}</strong>
                    </Link>
                  ))
                ) : (
                  <span>No results found</span>
                )}

                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  className="header-view-all"
                  onClick={() => setQuery("")}
                >
                  View all results
                </Link>
              </div>
            )}
          </div>

          <div className="header-icons">
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
              <Link href="/categories" onClick={() => setMobileMenuOpen(false)}>
                Categories
              </Link>

              <Link href="/parts" onClick={() => setMobileMenuOpen(false)}>
                Spare Parts
              </Link>

              <Link href="/request-part" onClick={() => setMobileMenuOpen(false)}>
                Spares Hunt
              </Link>

              <Link
                href="/become-supplier"
                className="mobile-nav-button"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sell With Us
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}