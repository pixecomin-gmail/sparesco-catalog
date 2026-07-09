"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEnquiry } from "@/context/EnquiryContext";
import { useSearchResults } from "@/hooks/useSearchIndex";

type Collection = {
  title?: string;
  name?: string;
  handle: string;
  count?: number;
  productCount?: number;
  category?: string;
  group?: string;
};

type MegaGroup = {
  title: string;
  icon: string;
  items: {
    label: string;
    handle: string;
    count: number;
  }[];
};

const GROUP_ORDER = [
  "Filters",
  "Brands",
  "Industrial",
  "Hydraulic Brands",
];

const GROUP_ICONS: Record<string, string> = {
  Filters: "▦",
  Brands: "▤",
  "Hydraulic Brands": "▣",
  Industrial: "▥",
};

function normalizeGroup(collection: Collection) {
  const handle = collection.handle;

  if (
    [
      "air-filters",
      "compressed-air-filters",
      "hydraulic-filters",
      "oil-filters",
      "process-filters",
      "granch-filtration",
    ].includes(handle)
  ) {
    return "Filters";
  }

  if (
    [
      "donaldson",
      "fleetguard",
      "hengst",
      "hifi-filter",
      "mann-filter",
      "sf-filter",
      "ufi",
    ].includes(handle)
  ) {
    return "Brands";
  }

  if (
    [
      "argo-hytos",
      "eppensteiner",
      "fairey-arlon",
      "filtrec",
      "hy-pro",
      "hydac",
      "ikron",
      "internormen",
      "mp-filtri",
      "omt",
      "pall",
      "parker",
      "rexroth",
      "schroeder",
      "sofima",
      "stauff",
    ].includes(handle)
  ) {
    return "Hydraulic Brands";
  }

  return "Industrial";
}

function getCollectionLabel(collection: Collection) {
  return collection.title || collection.name || collection.handle;
}

function getCollectionCount(collection: Collection) {
  return collection.count || collection.productCount || 0;
}

export default function SiteHeader() {
  const router = useRouter();
  const { items, hasLoaded, openDrawer } = useEnquiry();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mobileView, setMobileView] = useState<"main" | "categories" | "group">("main");
  const [activeGroup, setActiveGroup] = useState<MegaGroup | null>(null);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const { results: filteredResults, loading } = useSearchResults(query, 4);

  useEffect(() => {
    fetch("/api/collections", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("collections.json not found");
        return res.json();
      })
      .then((data) => {
        setCollections(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setCollections([]);
      });
  }, []);

  const megaMenuGroups = useMemo<MegaGroup[]>(() => {
    const unique = new Map<string, Collection>();

    collections.forEach((collection) => {
      if (!collection.handle) return;
      if (!unique.has(collection.handle)) {
        unique.set(collection.handle, collection);
      }
    });

    const grouped = new Map<string, MegaGroup>();

    Array.from(unique.values()).forEach((collection) => {
      const groupTitle = normalizeGroup(collection);

      if (!grouped.has(groupTitle)) {
        grouped.set(groupTitle, {
          title: groupTitle,
          icon: GROUP_ICONS[groupTitle] || "▦",
          items: [],
        });
      }

      grouped.get(groupTitle)?.items.push({
        label: getCollectionLabel(collection),
        handle: collection.handle,
        count: getCollectionCount(collection),
      });
    });

    if (grouped.size === 0 && collections.length > 0) {
      const fallback: MegaGroup = {
        title: "All Collections",
        icon: "▦",
        items: collections.map((collection) => ({
          label: getCollectionLabel(collection),
          handle: collection.handle,
          count: getCollectionCount(collection),
        })),
      };

      return [fallback];
    }

    return Array.from(grouped.values())
      .map((group) => ({
        ...group,
        items: group.items.sort((a, b) => a.label.localeCompare(b.label)),
      }))
      .sort((a, b) => {
        const aIndex = GROUP_ORDER.indexOf(a.title);
        const bIndex = GROUP_ORDER.indexOf(b.title);

        if (aIndex === -1 && bIndex === -1) return a.title.localeCompare(b.title);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;

        return aIndex - bIndex;
      });
  }, [collections]);

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
                    {megaMenuGroups.map((group) => (
                      <div
                        key={group.title}
                        className={
                          group.title === "Industrial"
                            ? "mega-menu-column industrial-column"
                            : "mega-menu-column"
                        }
                      >
                        <h4>{group.title.toUpperCase()}</h4>

                        <div
                          className={
                            group.title === "Hydraulic Brands"
                              ? "hydra-grid"
                              : "mega-menu-list"
                          }
                        >
                          {group.items.map((item) => (
                            <Link href={`/collections/${item.handle}`} key={item.handle}>
                              <span>{item.label}</span>
                            
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
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
                  {loading ? (
                    <span>Searching...</span>
                  ) : filteredResults.length > 0 ? (
                    filteredResults.map((product, index) => (
                      <Link
                        href={`/products/${product.handle}`}
                        key={`${product.handle}-${product.collection}-${product.partNumber}-${index}`}
                        onClick={() => setQuery("")}
                      >
                        <strong>
                          {product.title || product.partNumber} - {product.collection}
                        </strong>
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
              {mobileView === "main" && <span className="mobile-menu-title"></span>}

              {mobileView === "categories" && (
                <button className="mobile-back-button" onClick={() => setMobileView("main")}>
                  ← Categories
                </button>
              )}

              {mobileView === "group" && activeGroup && (
                <button className="mobile-back-button" onClick={() => setMobileView("categories")}>
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
                  <div className="mobile-nav-split">
                    <Link href="/collections" onClick={() => setMobileMenuOpen(false)}>
                      Categories
                    </Link>

                    <button
                      type="button"
                      onClick={() => setMobileView("categories")}
                      aria-label="Open categories menu"
                    >
                      <span>›</span>
                    </button>
                  </div>

                  <Link href="/parts" onClick={() => setMobileMenuOpen(false)}>
                    Spare Parts
                  </Link>

                  <Link href="/spareshunt" onClick={() => setMobileMenuOpen(false)}>
                    Spares Hunt
                  </Link>

                  <Link
                    href="/sellwithus"
                    className="mobile-nav-button-new"
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
                  {activeGroup.items.map((item) => (
                    <Link
                      key={item.handle}
                      href={`/collections/${item.handle}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
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