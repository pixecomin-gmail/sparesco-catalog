"use client";
import { useEffect } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEnquiry } from "@/context/EnquiryContext";
import { searchProducts } from "@/lib/products";

const megaMenuGroups = [
  {
    title: "Air & Process",
    icon: "💨",
    items: [
      ["Air Filter", "air-filters"],
      ["Compressed Air Filters", "compressed-air-filters"],
      ["Process Filters", "process-filters"],
      ["Domnic Hunter", "domnic-hunter"],
    ],
  },
  {
    title: "Hydraulic",
    icon: "💧",
    items: [
      ["Hydraulic Filters", "hydraulic-filters"],
      ["Hydac", "hydac"],
      ["Hy-Pro", "hy-pro"],
      ["Parker", "parker"],
      ["Rexroth", "rexroth"],
      ["Stauff", "stauff"],
      ["Pall", "pall"],
      ["Schroeder", "schroeder"],
      ["MP Filtri", "mp-filtri"],
      ["Ikron", "ikron"],
    ],
  },
  {
    title: "Oil & Engine",
    icon: "🛢️",
    items: [
      ["Oil Filters", "oil-filters"],
      ["Fleetguard", "fleetguard"],
      ["Mann Filter", "mann-filter"],
      ["Mahle", "mahle"],
      ["Hengst", "hengst"],
      ["UFI", "ufi"],
      ["Sofima", "sofima"],
      ["Donaldson", "donaldson"],
    ],
  },
  {
    title: "Industrial",
    icon: "🏭",
    items: [
      ["Filtration Group", "filtration-group"],
      ["Filtrec", "filtrec"],
      ["Granch Filtration", "granch-filtration"],
      ["Hifi Filter", "hifi-filter"],
      ["Internormen", "internormen"],
      ["Eppensteiner", "eppensteiner"],
      ["Fairey-Arlon", "fairey-arlon"],
      ["Agro Hytos", "agro-hytos"],
      ["OMT", "omt"],
      ["SF Filter", "sf-filter"],
      ["Microfit", "microfit"],
      ["Filterfinder", "filterfinder"],
      ["Parker UCC", "parker-ucc"],
    ],
  },
];

export default function SiteHeader() {
  const router = useRouter();
  const { items, hasLoaded, openDrawer } = useEnquiry();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mobileView, setMobileView] = useState<"main" | "categories" | "group">("main");
  const [activeGroup, setActiveGroup] = useState<(typeof megaMenuGroups)[0] | null>(null);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const filteredResults = useMemo(() => searchProducts(query, 4), [query]);

  const submitSearch = () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    setQuery("");
  };

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <button
            className="hamburger-button"
              onClick={() => {
              setMobileMenuOpen(true);
              setMobileView("main");
              setActiveGroup(null);
            }}
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
            <div className="nav-mega-wrap">
              <Link href="/collections" className="nav-mega-trigger">
                Categories <span>▾</span>
              </Link>

              <div className="mega-menu">
                <div className="mega-menu-inner">

                  <div className="mega-menu-grid">

                    <div className="mega-menu-column">
                      <h4>AIR & PROCESS</h4>

                      {megaMenuGroups[0].items.map(([label, handle]) => (
                        <Link href={`/collections/${handle}`} key={handle}>
                          {label}
                        </Link>
                      ))}
                    </div>

                    <div className="mega-menu-column">
                      <h4>HYDRAULIC</h4>

                      {megaMenuGroups[1].items.map(([label, handle]) => (
                        <Link href={`/collections/${handle}`} key={handle}>
                          {label}
                        </Link>
                      ))}
                    </div>

                    <div className="mega-menu-column">
                      <h4>OIL & ENGINE</h4>

                      {megaMenuGroups[2].items.map(([label, handle]) => (
                        <Link href={`/collections/${handle}`} key={handle}>
                          {label}
                        </Link>
                      ))}
                    </div>

                    <div className="mega-menu-column industrial-column">
                      <h4>INDUSTRIAL</h4>

                      <div className="industrial-grid">
                        {megaMenuGroups[3].items.map(([label, handle]) => (
                          <Link href={`/collections/${handle}`} key={handle}>
                            {label}
                          </Link>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            </div>

            <Link href="/parts">Spare Parts</Link>
            <Link href="/spareshunt">Spares Hunt</Link>
            <Link href="/sellwithus" className="nav-button-new">
              Sell With Us
            </Link>
          </nav>

          <div className="header-actions">
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

            <button className="enquiry-icon-button" onClick={openDrawer}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>

              {hasLoaded && totalItems > 0 && (
                <span className="enquiry-count">{totalItems}</span>
              )}

              <span className="enquiry-label">Enquiry</span>
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              {mobileView === "main" && (
                <span className="mobile-menu-title">Menu</span>
              )}

              {mobileView === "categories" && (
                <button
                  className="mobile-back-button"
                  onClick={() => setMobileView("main")}
                >
                  ← Categories
                </button>
              )}

              {mobileView === "group" && activeGroup && (
                <button
                  className="mobile-back-button"
                  onClick={() => setMobileView("categories")}
                >
                  ← {activeGroup.title}
                </button>
              )}

              <button
                className="mobile-menu-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <nav className="mobile-nav">
              {mobileView === "main" && (
                <>
                  <button
                    className="mobile-nav-link"
                    onClick={() => setMobileView("categories")}
                  >
                    Categories
                    <span>›</span>
                  </button>

                  <Link href="/parts" onClick={() => setMobileMenuOpen(false)}>
                    Spare Parts
                  </Link>

                  <Link href="/spareshunt" onClick={() => setMobileMenuOpen(false)}>
                    Spares Hunt
                  </Link>

                  <Link
                    href="/sellwithus"
                    className="mobile-nav-button"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sell With Us
                  </Link>
                </>
              )}

              {mobileView === "categories" && (
                <>
                  {megaMenuGroups.map((group) => (
                    <button
                      key={group.title}
                      className="mobile-nav-link"
                      onClick={() => {
                        setActiveGroup(group);
                        setMobileView("group");
                      }}
                    >
                      {group.title}
                      <span>›</span>
                    </button>
                  ))}
                </>
              )}

              {mobileView === "group" && activeGroup && (
                <>
                  {activeGroup.items.map(([label, handle]) => (
                    <Link
                      key={handle}
                      href={`/collections/${handle}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {label}
                    </Link>
                  ))}
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}