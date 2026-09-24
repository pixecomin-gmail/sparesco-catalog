"use client";

import "./dashboard.css";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PhoneInput, {
  isValidPhoneNumber,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";

type Tab = "enquiries" | "products" | "add" | "profile";

type Vendor = {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone?: string | null;
  gst_number?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  website?: string | null;
  status?: string | null;
  product_limit: number;
  products_submitted: number;
};

type VendorProduct = {
  id: number;
  product_name: string;
  part_number: string;
  brand: string;
  category: string;
  description?: string | null;
  price: string | null;
  currency: string | null;
  stock_quantity: number | null;
  application: string | null;
  godown_location: string | null;
  lead_time: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
};

type VendorEnquiry = {
  id: number;
  product_name: string | null;
  part_number: string | null;
  product_handle: string | null;
  quantity: string | null;
  enquiry_status: string;
  vendor_status: string;
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
};

type VendorQuote = {
  id: number;
  quoted_quantity: string | number | null;
  unit_price: string | number | null;
  currency: string | null;
  total_price: string | number | null;
  stock_available: string | null;
  lead_time: string | null;
  moq: string | number | null;
  condition: string | null;
  manufacturer_brand: string | null;
  country_of_origin: string | null;
  quote_validity: string | null;
  shipping_included: string | null;
  taxes_included: string | null;
  vendor_remarks: string | null;
  admin_status: string | null;
  submitted_at: string | null;
  updated_at: string | null;
};

type EnquiryDetail = {
  enquiry: VendorEnquiry;
  quote: VendorQuote | null;
};

export default function VendorDashboardPage() {
  const router = useRouter();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [enquiries, setEnquiries] = useState<VendorEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("enquiries");
  const [search, setSearch] = useState("");

  const [openEnquiry, setOpenEnquiry] = useState<number | null>(null);
  const [openProduct, setOpenProduct] = useState<number | null>(null);

  const [enquiryDetails, setEnquiryDetails] = useState<
    Record<number, EnquiryDetail>
  >({});

  const [detailLoading, setDetailLoading] = useState<number | null>(null);

  const [productForm, setProductForm] = useState({
    product_name: "",
    part_number: "",
    brand: "",
    category: "",
    description: "",
    price: "",
    currency: "INR",
    stock_quantity: "",
    application: "",
    godown_location: "",
    lead_time: "",
  });

  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productMessage, setProductMessage] = useState("");
  const [productError, setProductError] = useState("");

  const [profileForm, setProfileForm] = useState({
    contact_person: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    website: "",
  });

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/vendor/session", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          router.replace("/vendor/login");
          return;
        }

        setVendor(data.vendor);

        setProfileForm({
          contact_person: data.vendor.contact_person || "",
          phone: data.vendor.phone || "",
          address: data.vendor.address || "",
          city: data.vendor.city || "",
          state: data.vendor.state || "",
          country: data.vendor.country || "",
          website: data.vendor.website || "",
        });

        const productsResponse = await fetch("/api/vendor/products", {
          method: "GET",
          cache: "no-store",
        });

        const productsData = await productsResponse.json();

        if (productsResponse.ok && productsData.success) {
          const loadedProducts = productsData.products || [];

          setProducts(loadedProducts);

          if (loadedProducts.length === 0) {
            setActiveTab("add");
          }
        }

        const enquiriesResponse = await fetch("/api/vendor/enquiries", {
          method: "GET",
          cache: "no-store",
        });

        const enquiriesData = await enquiriesResponse.json();

        if (enquiriesResponse.ok && enquiriesData.success) {
          setEnquiries(enquiriesData.enquiries || []);
        }
      } catch {
        router.replace("/vendor/login");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  async function logoutVendor() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await fetch("/api/vendor/session", {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Vendor logout error:", error);
    } finally {
      router.replace("/vendor/login");
      router.refresh();
    }
  }

  async function toggleEnquiry(enquiryId: number) {
    if (openEnquiry === enquiryId) {
      setOpenEnquiry(null);
      return;
    }

    setOpenEnquiry(enquiryId);

    if (enquiryDetails[enquiryId]) {
      return;
    }

    try {
      setDetailLoading(enquiryId);

      const response = await fetch(`/api/vendor/enquiries/${enquiryId}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setEnquiryDetails((current) => ({
          ...current,
          [enquiryId]: {
            enquiry: data.enquiry,
            quote: data.quote || null,
          },
        }));

        setEnquiries((current) =>
          current.map((item) =>
            item.id === enquiryId
              ? {
                ...item,
                vendor_status: data.enquiry.vendor_status,
                viewed_at: data.enquiry.viewed_at,
              }
              : item
          )
        );
      }
    } catch (error) {
      console.error("Unable to load enquiry details:", error);
    } finally {
      setDetailLoading(null);
    }
  }

  function updateProductField(
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setProductForm((current) => ({
      ...current,
      [name]: value,
    }));

    setProductError("");
    setProductMessage("");
  }

  async function submitProduct(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setProductError("");
    setProductMessage("");
    setProductSubmitting(true);

    try {
      const response = await fetch("/api/vendor/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productForm),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/vendor/login");
        return;
      }

      if (!response.ok || !data.success) {
        setProductError(
          data.error || "Unable to submit product."
        );
        return;
      }

      setProductMessage(
        "Product submitted successfully and is pending admin approval."
      );

      setProductForm({
        product_name: "",
        part_number: "",
        brand: "",
        category: "",
        description: "",
        price: "",
        currency: "INR",
        stock_quantity: "",
        application: "",
        godown_location: "",
        lead_time: "",
      });

      const productsResponse = await fetch("/api/vendor/products", {
        method: "GET",
        cache: "no-store",
      });

      const productsData = await productsResponse.json();

      if (productsResponse.ok && productsData.success) {
        const refreshedProducts = productsData.products || [];

        setProducts(refreshedProducts);

        setVendor((current) =>
          current
            ? {
              ...current,
              products_submitted: refreshedProducts.length,
            }
            : current
        );
      }
    } catch {
      setProductError(
        "Unable to submit product. Please try again."
      );
    } finally {
      setProductSubmitting(false);
    }
  }

  function updateProfileField(
    name: keyof typeof profileForm,
    value: string
  ) {
    setProfileForm((current) => ({
      ...current,
      [name]: value,
    }));

    setProfileError("");
    setProfileMessage("");
  }

  async function saveProfile(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setProfileError("");
    setProfileMessage("");

    if (!profileForm.contact_person.trim()) {
      setProfileError("Contact Person is required.");
      return;
    }

    if (!profileForm.phone) {
      setProfileError("Contact Number is required.");
      return;
    }

    if (!isValidPhoneNumber(profileForm.phone)) {
      setProfileError("Please enter a valid contact number.");
      return;
    }

    setProfileSaving(true);

    try {
      const response = await fetch("/api/vendor/session", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileForm),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/vendor/login");
        return;
      }

      if (!response.ok || !data.success) {
        setProfileError(
          data.error || "Unable to update profile."
        );
        return;
      }

      setVendor((current) =>
        current
          ? {
            ...current,
            ...data.vendor,
          }
          : current
      );

      setProfileMessage("Profile updated successfully.");
    } catch {
      setProfileError(
        "Unable to update profile. Please try again."
      );
    } finally {
      setProfileSaving(false);
    }
  }

  const filteredEnquiries = useMemo(() => {
    const query = normalizeSearch(search);

    if (!query) {
      return enquiries;
    }

    return enquiries.filter((enquiry) => {
      const quote = enquiryDetails[enquiry.id]?.quote;

      const values = [
        enquiry.product_name,
        enquiry.part_number,
        enquiry.product_handle,
        enquiry.quantity,
        enquiry.enquiry_status,
        enquiry.vendor_status,
        quote?.quoted_quantity,
        quote?.unit_price,
        quote?.currency,
        quote?.total_price,
        quote?.stock_available,
        quote?.lead_time,
        quote?.moq,
        quote?.condition,
        quote?.manufacturer_brand,
        quote?.country_of_origin,
        quote?.quote_validity,
        quote?.shipping_included,
        quote?.taxes_included,
        quote?.vendor_remarks,
        quote?.admin_status,
      ];

      return values.some((value) =>
        normalizeSearch(value).includes(query)
      );
    });
  }, [enquiries, enquiryDetails, search]);

  const filteredProducts = useMemo(() => {
    const query = normalizeSearch(search);

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const values = [
        product.product_name,
        product.part_number,
        product.brand,
        product.category,
        product.description,
        product.price,
        product.currency,
        product.stock_quantity,
        product.application,
        product.godown_location,
        product.lead_time,
        product.status,
        product.admin_notes,
      ];

      return values.some((value) =>
        normalizeSearch(value).includes(query)
      );
    });
  }, [products, search]);

  if (loading) {
    return (
      <main className="vendor-dashboard">
        <p className="vendor-loading">Loading vendor portal...</p>
      </main>
    );
  }

  if (!vendor) {
    return null;
  }

  const remainingProducts = Math.max(
    vendor.product_limit - vendor.products_submitted,
    0
  );

  const capacityPercent =
    vendor.product_limit > 0
      ? Math.min(
        (vendor.products_submitted / vendor.product_limit) * 100,
        100
      )
      : 0;

  const showSearch =
    activeTab === "enquiries" || activeTab === "products";

  function changeTab(tab: Tab) {
    setActiveTab(tab);
    setSearch("");
  }

  return (
    <main className="vendor-dashboard">
      <header className="vendor-portal-header">
        <div className="vendor-portal-header-row">
          <div>
            <span className="vendor-eyebrow">
              Sparesco Vendor Portal
            </span>

            <h1>Welcome, {vendor.company_name}</h1>

            <p>Signed in as {vendor.email}</p>
          </div>

          <button
            type="button"
            className="vendor-logout-button"
            onClick={logoutVendor}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </header>

      <nav className="vendor-tabs" aria-label="Vendor portal">
        <TabButton
          active={activeTab === "enquiries"}
          onClick={() => changeTab("enquiries")}
        >
          My Enquiries
        </TabButton>

        <TabButton
          active={activeTab === "products"}
          onClick={() => changeTab("products")}
        >
          My Products
        </TabButton>

        <TabButton
          active={activeTab === "add"}
          onClick={() => changeTab("add")}
        >
          Add Product
        </TabButton>

        <TabButton
          active={activeTab === "profile"}
          onClick={() => changeTab("profile")}
        >
          Profile
        </TabButton>
      </nav>

      {showSearch && (
        <div className="vendor-search">
          <span className="vendor-search-icon" aria-hidden="true">
            ⌕
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={
              activeTab === "enquiries"
                ? "Search enquiries and quotations..."
                : "Search your products..."
            }
          />

          {search && (
            <button type="button" onClick={() => setSearch("")}>
              Clear
            </button>
          )}
        </div>
      )}

      {activeTab === "enquiries" && (
        <section>
          <SectionHeading
            title="My Enquiries"
            description="View enquiries matched to your approved products and manage quotations."
          />

          {filteredEnquiries.length === 0 ? (
            <EmptyState>
              {search
                ? "No enquiries match your search."
                : "No enquiries have been assigned to you yet."}
            </EmptyState>
          ) : (
            <div className="vendor-accordion-list">
              {filteredEnquiries.map((enquiry) => {
                const isOpen = openEnquiry === enquiry.id;
                const detail = enquiryDetails[enquiry.id];
                const quote = detail?.quote || null;

                const responded =
                  enquiry.vendor_status === "responded" ||
                  Boolean(enquiry.responded_at) ||
                  Boolean(quote);

                return (
                  <article
                    key={enquiry.id}
                    className={`vendor-accordion ${isOpen ? "is-open" : ""
                      }`}
                  >
                    <button
                      type="button"
                      className="vendor-accordion-header"
                      onClick={() => toggleEnquiry(enquiry.id)}
                      aria-expanded={isOpen}
                    >
                      <div className="vendor-accordion-primary">
                        <strong>
                          {enquiry.product_name || "Product Enquiry"}
                        </strong>

                        <span>
                          Part No. {enquiry.part_number || "—"}
                        </span>
                      </div>

                      <div className="vendor-accordion-meta">
                        <span>
                          Qty{" "}
                          <strong>
                            {enquiry.quantity || "—"}
                          </strong>
                        </span>

                        {quote && (
                          <span className="vendor-quote-summary">
                            {formatMoney(
                              quote.unit_price,
                              quote.currency
                            )}
                            {" / unit"}
                          </span>
                        )}

                        <StatusBadge
                          status={responded ? "success" : "warning"}
                        >
                          {responded ? "Quotation Submitted" : "New"}
                        </StatusBadge>

                        <span className="vendor-chevron" aria-hidden="true">
                          {isOpen ? "▲" : "▼"}
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="vendor-accordion-body">
                        {detailLoading === enquiry.id && !detail ? (
                          <p className="vendor-muted">
                            Loading enquiry...
                          </p>
                        ) : (
                          <>
                            <div className="vendor-detail-grid">
                              <Detail
                                label="Product"
                                value={enquiry.product_name}
                              />

                              <Detail
                                label="Part Number"
                                value={enquiry.part_number}
                              />

                              <Detail
                                label="Quantity"
                                value={enquiry.quantity}
                              />

                              <Detail
                                label="Received"
                                value={formatDate(enquiry.created_at)}
                              />
                            </div>

                            <div className="vendor-divider" />

                            {quote ? (
                              <div>
                                <div className="vendor-section-row">
                                  <div>
                                    <span className="vendor-mini-heading">
                                      Your Quotation
                                    </span>

                                    <h3 className="vendor-quotation-heading">
                                      Your Submitted Quotation
                                    </h3>
                                  </div>

                                  <StatusBadge status="success">
                                    Submitted
                                  </StatusBadge>
                                </div>

                                <div className="vendor-detail-grid">
                                  <Detail
                                    label="Quoted Quantity"
                                    value={quote.quoted_quantity}
                                  />

                                  <Detail
                                    label="Unit Price"
                                    value={formatMoney(
                                      quote.unit_price,
                                      quote.currency
                                    )}
                                  />

                                  <Detail
                                    label="Total Price"
                                    value={formatMoney(
                                      quote.total_price,
                                      quote.currency
                                    )}
                                  />

                                  <Detail
                                    label="Stock Available"
                                    value={quote.stock_available}
                                  />

                                  <Detail
                                    label="Lead Time"
                                    value={quote.lead_time}
                                  />

                                  <Detail label="MOQ" value={quote.moq} />

                                  <Detail
                                    label="Condition"
                                    value={quote.condition}
                                  />

                                  <Detail
                                    label="Manufacturer / Brand"
                                    value={quote.manufacturer_brand}
                                  />

                                  <Detail
                                    label="Country of Origin"
                                    value={quote.country_of_origin}
                                  />

                                  <Detail
                                    label="Quote Validity"
                                    value={quote.quote_validity}
                                  />

                                  <Detail
                                    label="Shipping Included"
                                    value={quote.shipping_included}
                                  />

                                  <Detail
                                    label="Taxes Included"
                                    value={quote.taxes_included}
                                  />

                                  <Detail
                                    label="Submitted"
                                    value={formatDateTime(
                                      quote.submitted_at
                                    )}
                                  />

                                  <Detail
                                    label="Quotation Status"
                                    value={quote.admin_status || "Pending"}
                                  />
                                </div>

                                {quote.vendor_remarks && (
                                  <div className="vendor-remarks">
                                    <span className="vendor-detail-label">
                                      Remarks
                                    </span>

                                    <p>{quote.vendor_remarks}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="vendor-section-row">
                                <div>
                                  <span className="vendor-mini-heading">
                                    Quotation
                                  </span>

                                  <h3 className="vendor-quotation-heading">
                                    Not submitted
                                  </h3>

                                  <p className="vendor-muted vendor-no-quote-text">
                                    Submit your quotation for this enquiry.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  className="vendor-primary-button"
                                  onClick={() =>
                                    router.push(
                                      `/vendor/enquiries/${enquiry.id}`
                                    )
                                  }
                                >
                                  Add Quotation
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === "products" && (
        <section>
          <SectionHeading
            title="My Products"
            description="View your submitted products and their approval status."
          />

          {filteredProducts.length === 0 ? (
            <EmptyState>
              {search
                ? "No products match your search."
                : "You have not submitted any products yet."}
            </EmptyState>
          ) : (
            <div className="vendor-accordion-list">
              {filteredProducts.map((product) => {
                const isOpen = openProduct === product.id;

                const statusLabel =
                  product.status === "pending"
                    ? "Under Review"
                    : product.status === "approved"
                      ? "Approved"
                      : "Rejected";

                const statusType =
                  product.status === "approved"
                    ? "success"
                    : product.status === "rejected"
                      ? "danger"
                      : "warning";

                return (
                  <article
                    key={product.id}
                    className={`vendor-accordion ${isOpen ? "is-open" : ""
                      }`}
                  >
                    <button
                      type="button"
                      className="vendor-accordion-header"
                      onClick={() =>
                        setOpenProduct(isOpen ? null : product.id)
                      }
                      aria-expanded={isOpen}
                    >
                      <div className="vendor-accordion-primary">
                        <strong>
                          {product.product_name || "Product"}
                        </strong>

                        <span>
                          Part No. {product.part_number || "—"}
                        </span>
                      </div>

                      <div className="vendor-accordion-meta">
                        <span>{product.brand || "No brand"}</span>

                        <StatusBadge status={statusType}>
                          {statusLabel}
                        </StatusBadge>

                        <span className="vendor-chevron" aria-hidden="true">
                          {isOpen ? "▲" : "▼"}
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="vendor-accordion-body">
                        <div className="vendor-detail-grid">
                          <Detail
                            label="Product Name"
                            value={product.product_name}
                          />

                          <Detail
                            label="Part Number"
                            value={product.part_number}
                          />

                          <Detail
                            label="Brand"
                            value={product.brand}
                          />

                          <Detail
                            label="Category"
                            value={product.category}
                          />

                          <Detail
                            label="Price"
                            value={formatMoney(
                              product.price,
                              product.currency
                            )}
                          />

                          <Detail
                            label="Stock Quantity"
                            value={product.stock_quantity}
                          />

                          <Detail
                            label="Application"
                            value={product.application}
                          />

                          <Detail
                            label="Godown Location"
                            value={product.godown_location}
                          />

                          <Detail
                            label="Lead Time"
                            value={product.lead_time}
                          />

                          <Detail
                            label="Submitted"
                            value={formatDate(product.created_at)}
                          />

                          <Detail
                            label="Approval Status"
                            value={statusLabel}
                          />
                        </div>

                        {product.description && (
                          <div className="vendor-remarks">
                            <span className="vendor-detail-label">
                              Description
                            </span>

                            <p>{product.description}</p>
                          </div>
                        )}

                        {product.admin_notes && (
                          <div className="vendor-remarks">
                            <span className="vendor-detail-label">
                              Admin Notes
                            </span>

                            <p>{product.admin_notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === "add" && (
        <section>
          <SectionHeading
            title="Add Product"
            description="Submit a new product for admin review."
          />

          <div className="vendor-capacity-card">
            <div className="vendor-capacity-top">
              <div>
                <span className="vendor-mini-heading">
                  Product Capacity
                </span>

                <p>
                  <strong>
                    {vendor.products_submitted} of {vendor.product_limit}
                  </strong>{" "}
                  products submitted
                </p>
              </div>

              <strong className="vendor-slots">
                {remainingProducts}{" "}
                <span>
                  {remainingProducts === 1 ? "slot" : "slots"} left
                </span>
              </strong>
            </div>

            <div
              className="vendor-progress-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={vendor.product_limit}
              aria-valuenow={vendor.products_submitted}
            >
              <div
                className="vendor-progress-fill"
                style={{ width: `${capacityPercent}%` }}
              />
            </div>
          </div>

          {remainingProducts > 0 ? (
            <form
              className="vendor-dashboard-product-form"
              onSubmit={submitProduct}
            >
              <div className="vendor-form-heading">
                <h3>Product Details</h3>

                <p>
                  Add product details for review. Once approved, the
                  product can be matched with relevant customer enquiries.
                </p>
              </div>

              <div className="vendor-dashboard-form-grid">
                <DashboardField label="Product Name *">
                  <input
                    type="text"
                    name="product_name"
                    value={productForm.product_name}
                    onChange={updateProductField}
                    placeholder="Example: Hydraulic Filter"
                    required
                  />
                </DashboardField>

                <DashboardField label="Part Number *">
                  <input
                    type="text"
                    name="part_number"
                    value={productForm.part_number}
                    onChange={updateProductField}
                    placeholder="Example: HC9600FKS13H"
                    required
                  />
                </DashboardField>

                <DashboardField label="Brand *">
                  <input
                    type="text"
                    name="brand"
                    value={productForm.brand}
                    onChange={updateProductField}
                    placeholder="Example: Pall"
                    required
                  />
                </DashboardField>

                <DashboardField label="Category *">
                  <input
                    type="text"
                    name="category"
                    value={productForm.category}
                    onChange={updateProductField}
                    placeholder="Example: Hydraulic Filters"
                    required
                  />
                </DashboardField>

                <DashboardField label="Price">
                  <input
                    type="text"
                    name="price"
                    value={productForm.price}
                    onChange={updateProductField}
                    placeholder="Example: 125.00"
                  />
                </DashboardField>

                <DashboardField label="Currency">
                  <select
                    name="currency"
                    value={productForm.currency}
                    onChange={updateProductField}
                  >
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="AED">AED</option>
                  </select>
                </DashboardField>

                <DashboardField label="Stock Quantity">
                  <input
                    type="number"
                    name="stock_quantity"
                    value={productForm.stock_quantity}
                    onChange={updateProductField}
                    min="0"
                    step="1"
                    placeholder="Example: 25"
                  />
                </DashboardField>

                <DashboardField label="Application">
                  <input
                    type="text"
                    name="application"
                    value={productForm.application}
                    onChange={updateProductField}
                    placeholder="Example: Hitachi EX100"
                  />
                </DashboardField>

                <DashboardField label="Godown Location">
                  <input
                    type="text"
                    name="godown_location"
                    value={productForm.godown_location}
                    onChange={updateProductField}
                    placeholder="Example: Mumbai"
                  />
                </DashboardField>

                <DashboardField label="Lead Time">
                  <input
                    type="text"
                    name="lead_time"
                    value={productForm.lead_time}
                    onChange={updateProductField}
                    placeholder="Example: 7-10 days"
                  />
                </DashboardField>

                <div className="vendor-dashboard-field vendor-form-full">
                  <label>Description</label>

                  <textarea
                    name="description"
                    value={productForm.description}
                    onChange={updateProductField}
                    rows={4}
                    placeholder="Add product details, specifications or other useful information..."
                  />
                </div>
              </div>

              {productMessage && (
                <div className="vendor-dashboard-success">
                  {productMessage}
                </div>
              )}

              {productError && (
                <div className="vendor-dashboard-error">
                  {productError}
                </div>
              )}

              <div className="vendor-dashboard-form-actions">
                <button
                  type="submit"
                  className="vendor-primary-button"
                  disabled={productSubmitting}
                >
                  {productSubmitting
                    ? "Submitting..."
                    : "Submit Product"}
                </button>
              </div>
            </form>
          ) : (
            <div className="vendor-add-product-card">
              <p className="vendor-limit-warning">
                You have reached your current product submission limit.
              </p>
            </div>
          )}
        </section>
      )}

      {activeTab === "profile" && (
        <section>
          <SectionHeading
            title="Profile"
            description="View your company details and update your contact information."
          />

          <form
            className="vendor-profile-card"
            onSubmit={saveProfile}
          >
            <div className="vendor-profile-section">
              <span className="vendor-mini-heading">
                Company Details
              </span>

              <div className="vendor-dashboard-form-grid">
                <DashboardField
                  label="Company Name"
                  readOnly
                >
                  <input
                    type="text"
                    value={vendor.company_name}
                    readOnly
                  />
                </DashboardField>

                <DashboardField label="Email" readOnly>
                  <input
                    type="email"
                    value={vendor.email}
                    readOnly
                  />
                </DashboardField>

                <DashboardField
                  label="GST / Tax Number"
                  readOnly
                >
                  <input
                    type="text"
                    value={vendor.gst_number || ""}
                    readOnly
                  />
                </DashboardField>

                <DashboardField label="Vendor Status" readOnly>
                  <input
                    type="text"
                    value={
                      vendor.status
                        ? capitalize(vendor.status)
                        : "Approved"
                    }
                    readOnly
                  />
                </DashboardField>
              </div>
            </div>

            <div className="vendor-divider" />

            <div className="vendor-profile-section">
              <span className="vendor-mini-heading">
                Contact & Address
              </span>

              <div className="vendor-dashboard-form-grid">
                <DashboardField label="Contact Person *">
                  <input
                    type="text"
                    value={profileForm.contact_person}
                    onChange={(event) =>
                      updateProfileField(
                        "contact_person",
                        event.target.value
                      )
                    }
                    required
                  />
                </DashboardField>

                <DashboardField label="Contact Number *">
                  <PhoneInput
                    international
                    defaultCountry="IN"
                    value={profileForm.phone || undefined}
                    onChange={(value) =>
                      updateProfileField("phone", value || "")
                    }
                    className="vendor-dashboard-phone"
                  />
                </DashboardField>

                <DashboardField label="Address">
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(event) =>
                      updateProfileField(
                        "address",
                        event.target.value
                      )
                    }
                  />
                </DashboardField>

                <DashboardField label="City">
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={(event) =>
                      updateProfileField(
                        "city",
                        event.target.value
                      )
                    }
                  />
                </DashboardField>

                <DashboardField label="State">
                  <input
                    type="text"
                    value={profileForm.state}
                    onChange={(event) =>
                      updateProfileField(
                        "state",
                        event.target.value
                      )
                    }
                  />
                </DashboardField>

                <DashboardField label="Country">
                  <input
                    type="text"
                    value={profileForm.country}
                    onChange={(event) =>
                      updateProfileField(
                        "country",
                        event.target.value
                      )
                    }
                  />
                </DashboardField>

                <DashboardField label="Website">
                  <input
                    type="url"
                    value={profileForm.website}
                    onChange={(event) =>
                      updateProfileField(
                        "website",
                        event.target.value
                      )
                    }
                    placeholder="https://example.com"
                  />
                </DashboardField>
              </div>
            </div>

            {profileMessage && (
              <div className="vendor-dashboard-success">
                {profileMessage}
              </div>
            )}

            {profileError && (
              <div className="vendor-dashboard-error">
                {profileError}
              </div>
            )}

            <div className="vendor-dashboard-form-actions">
              <button
                type="submit"
                className="vendor-primary-button"
                disabled={profileSaving}
              >
                {profileSaving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`vendor-tab ${active ? "is-active" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="vendor-section-heading">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function DashboardField({
  label,
  readOnly = false,
  children,
}: {
  label: string;
  readOnly?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`vendor-dashboard-field ${readOnly ? "is-readonly" : ""
        }`}
    >
      <label>{label}</label>
      {children}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  const displayValue =
    value === null ||
      value === undefined ||
      String(value).trim() === ""
      ? "—"
      : String(value);

  return (
    <div className="vendor-detail">
      <span className="vendor-detail-label">{label}</span>
      <span className="vendor-detail-value">{displayValue}</span>
    </div>
  );
}

function StatusBadge({
  status,
  children,
}: {
  status: "success" | "warning" | "danger";
  children: React.ReactNode;
}) {
  return (
    <span className={`vendor-status vendor-status-${status}`}>
      {children}
    </span>
  );
}

function EmptyState({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="vendor-empty-state">{children}</div>;
}

function normalizeSearch(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[\s-]+/g, "")
    .trim();
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatMoney(
  value: string | number | null | undefined,
  currency: string | null | undefined
) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return "—";
  }

  const code = currency || "INR";
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `${code} ${value}`;
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount}`;
  }
}

function capitalize(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}