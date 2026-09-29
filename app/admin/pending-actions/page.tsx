"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Vendor = {
    id: number;
    company_name: string;
    contact_person: string;
    email: string;
    phone: string | null;
    status: string;
    created_at: string;
};

type VendorProduct = {
    id: number;
    vendor_id: number;
    product_name: string;
    part_number: string | null;
    brand: string | null;
    status: string;
    delete_requested: number;
    created_at: string;
    company_name: string;
};

type VendorQuote = {
    id: number;
    enquiry_id: number;
    vendor_id: number;
    vendor_company: string;
    vendor_contact: string;
    product_name: string | null;
    part_number: string | null;
    requested_quantity: string | null;
    currency: string | null;
    total_price: number | null;
    submitted_at: string;
    admin_viewed_at: string | null;
};

export default function PendingActionsPage() {
    const router = useRouter();

    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [products, setProducts] = useState<VendorProduct[]>([]);
    const [quotes, setQuotes] = useState<VendorQuote[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openingQuoteId, setOpeningQuoteId] =
        useState<number | null>(null);

    useEffect(() => {
        loadPendingActions();
    }, []);

    async function loadPendingActions() {
        setLoading(true);
        setError("");

        try {
            const [vendorResponse, productResponse, quoteResponse] =
                await Promise.all([
                    fetch("/api/admin/vendors", {
                        cache: "no-store",
                    }),
                    fetch("/api/admin/vendor-products", {
                        cache: "no-store",
                    }),
                    fetch("/api/admin/vendor-quotes", {
                        cache: "no-store",
                    }),
                ]);

            if (
                vendorResponse.status === 401 ||
                productResponse.status === 401 ||
                quoteResponse.status === 401
            ) {
                window.location.href = "/admin/login";
                return;
            }

            const [vendorData, productData, quoteData] =
                await Promise.all([
                    vendorResponse.json(),
                    productResponse.json(),
                    quoteResponse.json(),
                ]);

            if (!vendorResponse.ok) {
                throw new Error(
                    vendorData.error || "Unable to load vendors."
                );
            }

            if (!productResponse.ok) {
                throw new Error(
                    productData.error ||
                    "Unable to load vendor products."
                );
            }

            if (!quoteResponse.ok) {
                throw new Error(
                    quoteData.error ||
                    "Unable to load vendor quotations."
                );
            }

            setVendors(vendorData.vendors || []);
            setProducts(productData.products || []);
            setQuotes(quoteData.quotes || []);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load pending actions."
            );
        } finally {
            setLoading(false);
        }
    }

    const pendingVendors = useMemo(
        () =>
            vendors.filter(
                (vendor) =>
                    vendor.status?.toLowerCase() === "pending"
            ),
        [vendors]
    );

    const pendingProducts = useMemo(
        () =>
            products.filter(
                (product) =>
                    product.status?.toLowerCase() === "pending" &&
                    Number(product.delete_requested || 0) !== 1
            ),
        [products]
    );

    const deleteRequests = useMemo(
        () =>
            products.filter(
                (product) =>
                    Number(product.delete_requested || 0) === 1
            ),
        [products]
    );

    const newQuotes = useMemo(
        () =>
            quotes.filter(
                (quote) => !quote.admin_viewed_at
            ),
        [quotes]
    );

    const totalPending =
        pendingVendors.length +
        pendingProducts.length +
        deleteRequests.length +
        newQuotes.length;

    async function openQuotation(quote: VendorQuote) {
        setOpeningQuoteId(quote.id);
        setError("");

        try {
            const response = await fetch(
                `/api/admin/vendor-quotes/${quote.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        action: "mark_viewed",
                    }),
                }
            );

            const data = await response.json();

            if (response.status === 401) {
                window.location.href = "/admin/login";
                return;
            }

            if (!response.ok) {
                setError(
                    data.error ||
                    "Unable to open quotation."
                );
                return;
            }

            router.push(
                `/admin/enquiries?enquiry=${quote.enquiry_id}&quote=${quote.id}`
            );
        } catch {
            setError("Unable to open quotation.");
        } finally {
            setOpeningQuoteId(null);
        }
    }

    if (loading) {
        return (
            <main style={pageStyle}>
                Loading pending actions...
            </main>
        );
    }

    return (
        <main style={pageStyle}>
            <div style={pageHeaderStyle}>
                <div>
                    <h1 style={titleStyle}>Pending Actions</h1>

                    <p style={subtitleStyle}>
                        Review items that currently require admin attention.
                    </p>
                </div>

                <div style={totalBadgeStyle}>
                    {totalPending} Pending
                </div>
            </div>

            {error && (
                <div style={errorStyle}>{error}</div>
            )}

            {totalPending === 0 ? (
                <div style={allClearStyle}>
                    <strong style={allClearTitleStyle}>
                        No pending actions
                    </strong>

                    <span style={allClearTextStyle}>
                        There is currently nothing requiring admin
                        attention.
                    </span>
                </div>
            ) : (
                <div style={sectionsStyle}>
                    <PendingSection
                        title="New Vendor Registrations"
                        count={pendingVendors.length}
                    >
                        {pendingVendors.map((vendor) => (
                            <ActionRow
                                key={vendor.id}
                                title={vendor.company_name}
                                description={[
                                    vendor.contact_person,
                                    vendor.email,
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                date={vendor.created_at}
                                buttonText="Review Vendor"
                                onClick={() =>
                                    router.push(
                                        `/admin/vendors?vendor=${vendor.id}`
                                    )
                                }
                            />
                        ))}
                    </PendingSection>

                    <PendingSection
                        title="Product Approvals"
                        count={pendingProducts.length}
                    >
                        {pendingProducts.map((product) => (
                            <ActionRow
                                key={product.id}
                                title={product.product_name}
                                description={[
                                    product.part_number
                                        ? `Part: ${product.part_number}`
                                        : null,
                                    product.company_name,
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                date={product.created_at}
                                buttonText="Review Product"
                                onClick={() =>
                                    router.push(
                                        `/admin/vendor-products?vendor=${product.vendor_id}&product=${product.id}`
                                    )
                                }
                            />
                        ))}
                    </PendingSection>

                    <PendingSection
                        title="Product Delete Requests"
                        count={deleteRequests.length}
                    >
                        {deleteRequests.map((product) => (
                            <ActionRow
                                key={product.id}
                                title={product.product_name}
                                description={[
                                    product.part_number
                                        ? `Part: ${product.part_number}`
                                        : null,
                                    product.company_name,
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                date={product.created_at}
                                buttonText="Review Request"
                                onClick={() =>
                                    router.push(
                                        `/admin/vendor-products?vendor=${product.vendor_id}&product=${product.id}`
                                    )
                                }
                            />
                        ))}
                    </PendingSection>

                    <PendingSection
                        title="New Quotations"
                        count={newQuotes.length}
                    >
                        {newQuotes.map((quote) => (
                            <ActionRow
                                key={quote.id}
                                title={
                                    quote.vendor_company ||
                                    `Vendor #${quote.vendor_id}`
                                }
                                description={[
                                    quote.product_name,
                                    quote.part_number
                                        ? `Part: ${quote.part_number}`
                                        : null,
                                    quote.total_price !== null &&
                                        quote.total_price !== undefined
                                        ? `${quote.currency || ""} ${quote.total_price}`.trim()
                                        : null,
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                date={quote.submitted_at}
                                buttonText={
                                    openingQuoteId === quote.id
                                        ? "Opening..."
                                        : "View Quotation"
                                }
                                disabled={
                                    openingQuoteId === quote.id
                                }
                                onClick={() =>
                                    openQuotation(quote)
                                }
                            />
                        ))}
                    </PendingSection>
                </div>
            )}
        </main>
    );
}

function PendingSection({
    title,
    count,
    children,
}: {
    title: string;
    count: number;
    children: React.ReactNode;
}) {
    return (
        <section style={sectionStyle}>
            <div style={sectionHeaderStyle}>
                <div style={sectionTitleWrapStyle}>
                    <h2 style={sectionTitleStyle}>{title}</h2>

                    <span style={countBadgeStyle}>
                        {count}
                    </span>
                </div>
            </div>

            {count === 0 ? (
                <div style={emptySectionStyle}>
                    Nothing pending.
                </div>
            ) : (
                <div>{children}</div>
            )}
        </section>
    );
}

function ActionRow({
    title,
    description,
    date,
    buttonText,
    onClick,
    disabled = false,
}: {
    title: string;
    description: string;
    date: string;
    buttonText: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <div style={actionRowStyle}>
            <div style={actionMainStyle}>
                <strong style={actionTitleStyle}>
                    {title || "—"}
                </strong>

                {description && (
                    <span style={actionDescriptionStyle}>
                        {description}
                    </span>
                )}

                <span style={dateStyle}>
                    {formatDate(date)}
                </span>
            </div>

            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                style={{
                    ...actionButtonStyle,
                    ...(disabled
                        ? disabledButtonStyle
                        : {}),
                }}
            >
                {buttonText}
            </button>
        </div>
    );
}

function formatDate(value: string) {
    if (!value) return "—";

    return new Date(value).toLocaleString();
}

const pageStyle: React.CSSProperties = {
    maxWidth: "1380px",
    margin: "0 auto",
    padding: "36px 24px 70px",
};

const pageHeaderStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "22px",
};

const titleStyle: React.CSSProperties = {
    margin: "0 0 5px",
    color: "#173f4c",
    fontSize: "30px",
};

const subtitleStyle: React.CSSProperties = {
    margin: 0,
    color: "#718187",
    fontSize: "14px",
};

const totalBadgeStyle: React.CSSProperties = {
    padding: "8px 13px",
    border: "1px solid #dfe6e4",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#173f4c",
    fontSize: "12px",
    fontWeight: 800,
};

const sectionsStyle: React.CSSProperties = {
    display: "grid",
    gap: "18px",
};

const sectionStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #dbe3e1",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(23,63,76,0.04)",
};

const sectionHeaderStyle: React.CSSProperties = {
    padding: "15px 18px",
    background: "#f8faf9",
    borderBottom: "1px solid #e2e9e7",
};

const sectionTitleWrapStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "9px",
};

const sectionTitleStyle: React.CSSProperties = {
    margin: 0,
    color: "#173f4c",
    fontSize: "14px",
};

const countBadgeStyle: React.CSSProperties = {
    minWidth: "24px",
    height: "24px",
    padding: "0 7px",
    borderRadius: "999px",
    background: "#e8f3f4",
    color: "#2a8392",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 800,
};

const actionRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "15px 18px",
    borderBottom: "1px solid #edf1f0",
};

const actionMainStyle: React.CSSProperties = {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
};

const actionTitleStyle: React.CSSProperties = {
    color: "#173f4c",
    fontSize: "13px",
};

const actionDescriptionStyle: React.CSSProperties = {
    color: "#617278",
    fontSize: "12px",
    overflowWrap: "anywhere",
};

const dateStyle: React.CSSProperties = {
    color: "#8a989c",
    fontSize: "10px",
};

const actionButtonStyle: React.CSSProperties = {
    flexShrink: 0,
    border: "none",
    borderRadius: "7px",
    background: "#173f4c",
    color: "#ffffff",
    padding: "8px 13px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
};

const disabledButtonStyle: React.CSSProperties = {
    opacity: 0.5,
    cursor: "default",
};

const emptySectionStyle: React.CSSProperties = {
    padding: "18px",
    color: "#879499",
    fontSize: "12px",
};

const allClearStyle: React.CSSProperties = {
    padding: "45px 24px",
    background: "#ffffff",
    border: "1px solid #dfe6e4",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    textAlign: "center",
};

const allClearTitleStyle: React.CSSProperties = {
    color: "#173f4c",
    fontSize: "16px",
};

const allClearTextStyle: React.CSSProperties = {
    color: "#718187",
    fontSize: "12px",
};

const errorStyle: React.CSSProperties = {
    marginBottom: "18px",
    padding: "12px 15px",
    background: "#fff3f1",
    border: "1px solid #f2d4d0",
    borderRadius: "8px",
    color: "#a23c35",
};