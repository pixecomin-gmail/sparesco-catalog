import { Resend } from "resend";

const SITE_URL = "https://sparesco.com";
const LOGO_URL = "https://sparesco.com/logo.png";

type ProductEmailItem = {
  title?: string;
  partNumber?: string;
  vendor?: string;
  quantity?: number;
  price?: number | string;
  handle?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatLabel(key: string) {
  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPrice(value: unknown) {
  const price = Number(value);

  if (!Number.isFinite(price) || price <= 0) {
    return "Price on Request";
  }

  return `₹${price.toLocaleString("en-IN")}`;
}

function isProductArray(value: unknown): value is ProductEmailItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        !Array.isArray(item)
    )
  );
}

function shouldDisplayValue(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return false;
  }

  if (Array.isArray(value) && value.length === 0) {
    return false;
  }

  return true;
}

function buildDetailRows(
  data: Record<string, unknown>,
  excludeKeys: string[] = []
) {
  return Object.entries(data)
    .filter(([key, value]) => {
      return (
        !excludeKeys.includes(key) &&
        key !== "products" &&
        key !== "items" &&
        shouldDisplayValue(value)
      );
    })
    .map(([key, value]) => {
      const safeValue = Array.isArray(value)
        ? value.map((entry) => escapeHtml(entry)).join("<br />")
        : escapeHtml(value).replaceAll("\n", "<br />");

      return `
        <tr>
          <td
            class="field-label"
            width="170"
            style="
              width:170px;
              padding:14px 16px;
              border-bottom:1px solid #e5e7eb;
              background-color:#f9fafb;
              color:#667085;
              font-family:Arial,sans-serif;
              font-size:13px;
              font-weight:700;
              line-height:1.5;
              text-align:left;
              vertical-align:top;
              white-space:nowrap;
            "
          >
            ${escapeHtml(formatLabel(key))}
          </td>

          <td
            class="field-value"
            style="
              padding:14px 16px;
              border-bottom:1px solid #e5e7eb;
              color:#173f4c;
              font-family:Arial,sans-serif;
              font-size:14px;
              font-weight:400;
              line-height:1.6;
              text-align:left;
              vertical-align:top;
              overflow-wrap:anywhere;
              word-break:break-word;
            "
          >
            ${safeValue}
          </td>
        </tr>
      `;
    })
    .join("");
}

function buildProductsTable(products: ProductEmailItem[]) {
  if (products.length === 0) {
    return "";
  }

  const productRows = products
    .map((product, index) => {
      const title = escapeHtml(
        product.title || product.partNumber || `Product ${index + 1}`
      );

      const partNumber = escapeHtml(product.partNumber || "—");
      const vendor = escapeHtml(product.vendor || "—");
      const quantity = escapeHtml(product.quantity || 1);
      const price = escapeHtml(formatPrice(product.price));

      const productUrl = product.handle
        ? `${SITE_URL}/products/${encodeURIComponent(product.handle)}`
        : "";

      const productTitle = productUrl
        ? `
          <a
            href="${productUrl}"
            target="_blank"
            style="
              color:#173f4c;
              font-weight:700;
              text-decoration:none;
            "
          >
            ${title}
          </a>
        `
        : title;

      return `
        <tr>
          <td
            class="product-cell product-number"
            style="
              padding:13px 10px;
              border-bottom:1px solid #e5e7eb;
              color:#173f4c;
              font-family:Arial,sans-serif;
              font-size:13px;
              line-height:1.5;
              text-align:center;
              vertical-align:top;
            "
          >
            ${index + 1}
          </td>

          <td
            class="product-cell"
            style="
              padding:13px 10px;
              border-bottom:1px solid #e5e7eb;
              color:#173f4c;
              font-family:Arial,sans-serif;
              font-size:13px;
              line-height:1.5;
              text-align:left;
              vertical-align:top;
              overflow-wrap:anywhere;
            "
          >
            ${productTitle}
          </td>

          <td
            class="product-cell"
            style="
              padding:13px 10px;
              border-bottom:1px solid #e5e7eb;
              color:#173f4c;
              font-family:Arial,sans-serif;
              font-size:13px;
              line-height:1.5;
              text-align:left;
              vertical-align:top;
              overflow-wrap:anywhere;
            "
          >
            ${partNumber}
          </td>

          <td
            class="product-cell"
            style="
              padding:13px 10px;
              border-bottom:1px solid #e5e7eb;
              color:#173f4c;
              font-family:Arial,sans-serif;
              font-size:13px;
              line-height:1.5;
              text-align:left;
              vertical-align:top;
              overflow-wrap:anywhere;
            "
          >
            ${vendor}
          </td>

          <td
            class="product-cell"
            style="
              padding:13px 10px;
              border-bottom:1px solid #e5e7eb;
              color:#173f4c;
              font-family:Arial,sans-serif;
              font-size:13px;
              font-weight:700;
              line-height:1.5;
              text-align:center;
              vertical-align:top;
            "
          >
            ${quantity}
          </td>

          <td
            class="product-cell product-price"
            style="
              padding:13px 10px;
              border-bottom:1px solid #e5e7eb;
              color:#173f4c;
              font-family:Arial,sans-serif;
              font-size:13px;
              font-weight:700;
              line-height:1.5;
              text-align:right;
              vertical-align:top;
              white-space:nowrap;
            "
          >
            ${price}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="margin-top:28px;">
      <h2
        style="
          margin:0 0 12px;
          color:#173f4c;
          font-family:Arial,sans-serif;
          font-size:18px;
          font-weight:700;
          line-height:1.4;
        "
      >
        Selected Products
      </h2>

      <div
        class="product-table-wrapper"
        style="
          width:100%;
          overflow-x:auto;
          border:1px solid #e5e7eb;
          border-radius:8px;
        "
      >
        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            width:100%;
            min-width:600px;
            border-collapse:collapse;
          "
        >
          <thead>
            <tr style="background-color:#f2f4f7;">
              <th
                width="42"
                style="
                  width:42px;
                  padding:12px 8px;
                  color:#475467;
                  font-family:Arial,sans-serif;
                  font-size:12px;
                  font-weight:700;
                  text-align:center;
                "
              >
                #
              </th>

              <th
                style="
                  padding:12px 10px;
                  color:#475467;
                  font-family:Arial,sans-serif;
                  font-size:12px;
                  font-weight:700;
                  text-align:left;
                "
              >
                Product
              </th>

              <th
                style="
                  padding:12px 10px;
                  color:#475467;
                  font-family:Arial,sans-serif;
                  font-size:12px;
                  font-weight:700;
                  text-align:left;
                "
              >
                Part No.
              </th>

              <th
                style="
                  padding:12px 10px;
                  color:#475467;
                  font-family:Arial,sans-serif;
                  font-size:12px;
                  font-weight:700;
                  text-align:left;
                "
              >
                Brand
              </th>

              <th
                width="50"
                style="
                  width:50px;
                  padding:12px 8px;
                  color:#475467;
                  font-family:Arial,sans-serif;
                  font-size:12px;
                  font-weight:700;
                  text-align:center;
                "
              >
                Qty
              </th>

              <th
                style="
                  padding:12px 10px;
                  color:#475467;
                  font-family:Arial,sans-serif;
                  font-size:12px;
                  font-weight:700;
                  text-align:right;
                "
              >
                Price
              </th>
            </tr>
          </thead>

          <tbody>
            ${productRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function emailTemplate({
  title,
  intro,
  data,
  excludeKeys = [],
}: {
  title: string;
  intro: string;
  data: Record<string, unknown>;
  excludeKeys?: string[];
}) {
  const productsValue = data.products ?? data.items;

  const products = isProductArray(productsValue)
    ? productsValue
    : [];

  const detailsRows = buildDetailRows(data, excludeKeys);

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />

        <style>
          @media only screen and (max-width:600px) {
            .email-container {
              width:100% !important;
            }

            .email-padding {
              padding:18px !important;
            }

            .email-header {
              padding:24px 18px !important;
            }

            .email-title {
              font-size:20px !important;
            }

            .field-label {
              width:110px !important;
              padding:12px 10px !important;
              white-space:normal !important;
            }

            .field-value {
              padding:12px 10px !important;
            }
          }
        </style>
      </head>

      <body
        style="
          margin:0;
          padding:0;
          background-color:#f5f5f0;
          font-family:Arial,sans-serif;
          -webkit-text-size-adjust:100%;
        "
      >
        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            width:100%;
            margin:0;
            padding:0;
            background-color:#f5f5f0;
          "
        >
          <tr>
            <td align="center" style="padding:28px 12px;">
              <table
                role="presentation"
                class="email-container"
                width="680"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  width:100%;
                  max-width:680px;
                  border-collapse:separate;
                  border-spacing:0;
                "
              >
                <tr>
                  <td
                    class="email-header"
                    align="center"
                    style="
                      padding:28px 24px 24px;
                      background-color:#173f4c;
                      border-radius:12px 12px 0 0;
                    "
                  >
                    <table
                      role="presentation"
                      align="center"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td style="padding-right:12px;">
                          <a
                            href="${SITE_URL}"
                            target="_blank"
                            style="text-decoration:none;"
                          >
                            <img
                              src="${LOGO_URL}"
                              alt="Sparesco"
                              width="36"
                              style="
                                display:block;
                                width:36px;
                                height:auto;
                                border:0;
                              "
                            />
                          </a>
                        </td>

                        <td valign="middle">
                          <h1
                            class="email-title"
                            style="
                              margin:0;
                              color:#d9f0f3;
                              font-family:Arial,sans-serif;
                              font-size:24px;
                              font-weight:700;
                              line-height:1.2;
                            "
                          >
                            ${escapeHtml(title)}
                          </h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td
                    class="email-padding"
                    style="
                      padding:28px;
                      background-color:#ffffff;
                      border-right:1px solid #e4e7ec;
                      border-left:1px solid #e4e7ec;
                    "
                  >
                    <p
                      style="
                        margin:0 0 24px;
                        color:#475467;
                        font-family:Arial,sans-serif;
                        font-size:15px;
                        line-height:1.7;
                      "
                    >
                      ${escapeHtml(intro)}
                    </p>

                    ${
                      detailsRows
                        ? `
                          <h2
                            style="
                              margin:0 0 12px;
                              color:#173f4c;
                              font-family:Arial,sans-serif;
                              font-size:18px;
                              font-weight:700;
                              line-height:1.4;
                            "
                          >
                            Submission Details
                          </h2>

                          <table
                            role="presentation"
                            width="100%"
                            cellpadding="0"
                            cellspacing="0"
                            border="0"
                            style="
                              width:100%;
                              table-layout:fixed;
                              border:1px solid #e5e7eb;
                              border-radius:8px;
                              border-collapse:separate;
                              border-spacing:0;
                              overflow:hidden;
                            "
                          >
                            ${detailsRows}
                          </table>
                        `
                        : ""
                    }

                    ${buildProductsTable(products)}
                  </td>
                </tr>

                <tr>
                  <td
                    align="center"
                    style="
                      padding:20px;
                      background-color:#ffffff;
                      border-right:1px solid #e4e7ec;
                      border-bottom:1px solid #e4e7ec;
                      border-left:1px solid #e4e7ec;
                      border-radius:0 0 12px 12px;
                    "
                  >
                    <table
                      role="presentation"
                      align="center"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                      style="margin:0 auto;"
                    >
                      <tr>
                        <td align="center">
                          <a
                            href="${SITE_URL}"
                            target="_blank"
                            style="
                              display:inline-block;
                              color:#2a8392;
                              font-family:Arial,sans-serif;
                              font-size:14px;
                              font-weight:700;
                              line-height:1.5;
                              text-decoration:none;
                            "
                          >
                            sparesco.com
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function getEmailConfiguration() {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmails = process.env.FORM_NOTIFY_EMAIL;

  const from =
    process.env.EMAIL_FROM ||
    "Sparesco Support <support@sparesco.com>";

  if (!apiKey) {
    throw new Error(
      "Missing RESEND_API_KEY environment variable."
    );
  }

  return {
    resend: new Resend(apiKey),
    notifyEmails,
    from,
  };
}

export async function sendAdminEmail({
  subject,
  title,
  data,
}: {
  subject: string;
  title: string;
  data: Record<string, unknown>;
}) {
  const { resend, notifyEmails, from } =
    getEmailConfiguration();

  if (!notifyEmails) {
    throw new Error(
      "Missing FORM_NOTIFY_EMAIL environment variable."
    );
  }

  const recipients = notifyEmails
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error(
      "FORM_NOTIFY_EMAIL does not contain a valid email."
    );
  }

  const replyTo =
    typeof data.email === "string" && data.email.trim()
      ? data.email.trim()
      : undefined;

  console.log("Sending admin email:", {
    from,
    recipients,
    subject,
    replyTo,
  });

  const result = await resend.emails.send({
  from,
  to: recipients,
  subject,
  html: emailTemplate({
    title,
    intro:
      "A new submission has been received from the Sparesco website.",
    data,
  }),
  replyTo,
});

  if (result.error) {
    console.error(
      "Resend admin email error:",
      result.error
    );

    throw new Error(
      `Admin email failed: ${
        result.error.message ||
        "Unknown Resend error."
      }`
    );
  }

  console.log("Admin email accepted by Resend:", {
    id: result.data?.id,
    recipients,
  });

  return {
    success: true,
    id: result.data?.id,
  };
}

export async function sendUserEmail({
  to,
  subject,
  title,
  data,
}: {
  to: string;
  subject: string;
  title: string;
  data: Record<string, unknown>;
}) {
  const { resend, from } =
    getEmailConfiguration();

  const recipient = String(to || "").trim();

  if (!recipient) {
    throw new Error(
      "Customer email address is missing."
    );
  }

  console.log("Sending customer email:", {
    from,
    recipient,
    subject,
  });

  const result = await resend.emails.send({
    from,
    to: recipient,
    subject,
    html: emailTemplate({
      title,
      intro:
        "We have received your enquiry. The details shared by you are listed below.",
      data,
      excludeKeys: ["email", "form_type"],
    }),
  });

  if (result.error) {
    console.error(
      "Resend customer email error:",
      result.error
    );

    throw new Error(
      `Customer email failed: ${
        result.error.message ||
        "Unknown Resend error."
      }`
    );
  }

  console.log("Customer email accepted by Resend:", {
    id: result.data?.id,
    recipient,
  });

  return {
    success: true,
    id: result.data?.id,
  };
}

export async function sendAdminOtpEmail({
  to,
  otp,
}: {
  to: string;
  otp: string;
}) {
  const { resend, from } = getEmailConfiguration();

  const recipient = String(to || "").trim();

  if (!recipient) {
    throw new Error("Admin email address is missing.");
  }

  const result = await resend.emails.send({
    from,
    to: recipient,
    subject: "Sparesco Admin Login OTP",
    html: `
      <!doctype html>
      <html lang="en">
        <body
          style="
            margin:0;
            padding:30px;
            background:#f5f5f0;
            font-family:Arial,sans-serif;
          "
        >
          <div
            style="
              max-width:480px;
              margin:0 auto;
              background:#ffffff;
              border:1px solid #e5e7eb;
              border-radius:12px;
              overflow:hidden;
            "
          >
            <div
              style="
                padding:22px;
                background:#173f4c;
                color:#ffffff;
                text-align:center;
              "
            >
              <strong style="font-size:20px;">
                Sparesco Admin Login
              </strong>
            </div>

            <div
              style="
                padding:30px;
                text-align:center;
              "
            >
              <p
                style="
                  margin:0 0 20px;
                  color:#475467;
                  font-size:14px;
                "
              >
                Your admin login OTP is:
              </p>

              <div
                style="
                  display:inline-block;
                  padding:14px 24px;
                  background:#f2f6f5;
                  border-radius:8px;
                  color:#173f4c;
                  font-size:28px;
                  font-weight:700;
                  letter-spacing:6px;
                "
              >
                ${escapeHtml(otp)}
              </div>

              <p
                style="
                  margin:20px 0 0;
                  color:#7d8c91;
                  font-size:12px;
                "
              >
                This OTP expires in 10 minutes.
              </p>

              <p
                style="
                  margin:8px 0 0;
                  color:#7d8c91;
                  font-size:12px;
                "
              >
                If you did not request this login, you can ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (result.error) {
    console.error("Admin OTP email error:", result.error);

    throw new Error(
      result.error.message || "Unable to send admin OTP."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}

type VendorRegistrationEmailData = {
  vendorId?: number | string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstNumber: string;
  country: string;
  address?: string;
  city?: string;
  state?: string;
  website?: string;
  status: string;
  registeredAt?: string;
};

function vendorRegistrationTemplate({
  title,
  intro,
  content,
  actionLabel,
  actionUrl,
}: {
  title: string;
  intro: string;
  content: string;
  actionLabel?: string;
  actionUrl?: string;
}) {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />

        <style>
          @media only screen and (max-width:600px) {
            .email-container {
              width:100% !important;
            }

            .email-padding {
              padding:18px !important;
            }

            .email-header {
              padding:24px 18px !important;
            }

            .email-title {
              font-size:20px !important;
            }

            .field-label {
              width:110px !important;
              padding:12px 10px !important;
              white-space:normal !important;
            }

            .field-value {
              padding:12px 10px !important;
            }
          }
        </style>
      </head>

      <body
        style="
          margin:0;
          padding:0;
          background-color:#f5f5f0;
          font-family:Arial,sans-serif;
          -webkit-text-size-adjust:100%;
        "
      >
        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            width:100%;
            margin:0;
            padding:0;
            background-color:#f5f5f0;
          "
        >
          <tr>
            <td align="center" style="padding:28px 12px;">
              <table
                role="presentation"
                class="email-container"
                width="680"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  width:100%;
                  max-width:680px;
                  border-collapse:separate;
                  border-spacing:0;
                "
              >
                <tr>
                  <td
                    class="email-header"
                    align="center"
                    style="
                      padding:28px 24px 24px;
                      background-color:#173f4c;
                      border-radius:12px 12px 0 0;
                    "
                  >
                    <table
                      role="presentation"
                      align="center"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td style="padding-right:12px;">
                          <a
                            href="${SITE_URL}"
                            target="_blank"
                            style="text-decoration:none;"
                          >
                            <img
                              src="${LOGO_URL}"
                              alt="Sparesco"
                              width="36"
                              style="
                                display:block;
                                width:36px;
                                height:auto;
                                border:0;
                              "
                            />
                          </a>
                        </td>

                        <td valign="middle">
                          <h1
                            class="email-title"
                            style="
                              margin:0;
                              color:#d9f0f3;
                              font-family:Arial,sans-serif;
                              font-size:24px;
                              font-weight:700;
                              line-height:1.2;
                            "
                          >
                            ${escapeHtml(title)}
                          </h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td
                    class="email-padding"
                    style="
                      padding:28px;
                      background-color:#ffffff;
                      border-right:1px solid #e4e7ec;
                      border-left:1px solid #e4e7ec;
                    "
                  >
                    <p
                      style="
                        margin:0 0 24px;
                        color:#475467;
                        font-family:Arial,sans-serif;
                        font-size:15px;
                        line-height:1.7;
                      "
                    >
                      ${intro}
                    </p>

                    ${content}

                    ${
                      actionLabel && actionUrl
                        ? `
                          <div style="margin-top:28px;">
                            <a
                              href="${actionUrl}"
                              target="_blank"
                              style="
                                display:inline-block;
                                padding:13px 22px;
                                background-color:#173f4c;
                                color:#ffffff;
                                font-family:Arial,sans-serif;
                                font-size:12px;
                                font-weight:700;
                                letter-spacing:0.5px;
                                text-decoration:none;
                                border-radius:6px;
                              "
                            >
                              ${escapeHtml(actionLabel)}
                            </a>
                          </div>
                        `
                        : ""
                    }
                  </td>
                </tr>

                <tr>
                  <td
                    align="center"
                    style="
                      padding:20px;
                      background-color:#ffffff;
                      border-right:1px solid #e4e7ec;
                      border-bottom:1px solid #e4e7ec;
                      border-left:1px solid #e4e7ec;
                      border-radius:0 0 12px 12px;
                    "
                  >
                    <a
                      href="${SITE_URL}"
                      target="_blank"
                      style="
                        display:inline-block;
                        color:#2a8392;
                        font-family:Arial,sans-serif;
                        font-size:14px;
                        font-weight:700;
                        line-height:1.5;
                        text-decoration:none;
                      "
                    >
                      sparesco.com
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function vendorDetailRow(label: string, value: unknown) {
  const displayValue =
    value === null ||
    value === undefined ||
    String(value).trim() === ""
      ? "Not Provided"
      : String(value);

  return `
    <tr>
      <td
        class="field-label"
        width="170"
        style="
          width:170px;
          padding:14px 16px;
          border-bottom:1px solid #e5e7eb;
          background-color:#f9fafb;
          color:#667085;
          font-family:Arial,sans-serif;
          font-size:13px;
          font-weight:700;
          line-height:1.5;
          text-align:left;
          vertical-align:top;
        "
      >
        ${escapeHtml(label)}
      </td>

      <td
        class="field-value"
        style="
          padding:14px 16px;
          border-bottom:1px solid #e5e7eb;
          color:#173f4c;
          font-family:Arial,sans-serif;
          font-size:14px;
          line-height:1.6;
          text-align:left;
          vertical-align:top;
          overflow-wrap:anywhere;
        "
      >
        ${escapeHtml(displayValue)}
      </td>
    </tr>
  `;
}

function vendorDetailsTable(rows: string) {
  return `
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="
        width:100%;
        table-layout:fixed;
        border:1px solid #e5e7eb;
        border-radius:8px;
        border-collapse:separate;
        border-spacing:0;
        overflow:hidden;
      "
    >
      ${rows}
    </table>
  `;
}

export async function sendVendorRegistrationEmail(
  data: VendorRegistrationEmailData
) {
  const { resend, from } = getEmailConfiguration();

  const recipient = data.email.trim();

  if (!recipient) {
    throw new Error("Vendor email address is missing.");
  }

  const rows = [
    vendorDetailRow("Company Name", data.companyName),
    vendorDetailRow("Contact Person", data.contactPerson),
    vendorDetailRow("Email", data.email),
    vendorDetailRow("Contact Number", data.phone),
    vendorDetailRow("GST / Tax Number", data.gstNumber),
    vendorDetailRow("Country", data.country),
    vendorDetailRow("Status", "Pending Approval"),
  ].join("");

  const result = await resend.emails.send({
    from,
    to: recipient,
    subject: "Vendor Registration Received – Sparesco",
    html: vendorRegistrationTemplate({
      title: "Vendor Registration Received",
      intro: `
        Hi <strong>${escapeHtml(data.contactPerson)}</strong>,<br /><br />
        Thank you for registering as a vendor with Sparesco.<br /><br />
        We have received your registration for
        <strong>${escapeHtml(data.companyName)}</strong>.
        Your vendor account is currently <strong>pending approval</strong>.<br /><br />
        Our team will review your application and notify you by email once
        your account has been approved.
      `,
      content: `
        <h2
          style="
            margin:0 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Registration Details
        </h2>

        ${vendorDetailsTable(rows)}

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          You do not need to register again while your application is
          under review.
        </p>

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Regards,<br />
          <strong>Team Sparesco</strong>
        </p>
      `,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Unable to send vendor registration email."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}

export async function sendNewVendorAdminEmail(
  data: VendorRegistrationEmailData
) {
  const { resend, notifyEmails, from } =
    getEmailConfiguration();

  if (!notifyEmails) {
    throw new Error(
      "Missing FORM_NOTIFY_EMAIL environment variable."
    );
  }

  const recipients = notifyEmails
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error(
      "FORM_NOTIFY_EMAIL does not contain a valid email."
    );
  }

  const rows = [
    vendorDetailRow("Company Name", data.companyName),
    vendorDetailRow("Contact Person", data.contactPerson),
    vendorDetailRow("Email", data.email),
    vendorDetailRow("Contact Number", data.phone),
    vendorDetailRow("GST / Tax Number", data.gstNumber),
    vendorDetailRow("Website", data.website),
    vendorDetailRow("Address", data.address),
    vendorDetailRow("City", data.city),
    vendorDetailRow("State", data.state),
    vendorDetailRow("Country", data.country),
    vendorDetailRow("Registration Date", data.registeredAt),
    vendorDetailRow("Status", "Pending Approval"),
  ].join("");

  const result = await resend.emails.send({
    from,
    to: recipients,
    subject: `New Vendor Registration – ${data.companyName}`,
    replyTo: data.email,
    html: vendorRegistrationTemplate({
      title: "New Vendor Registration",
      intro:
        "A new vendor has registered on Sparesco and is awaiting approval.",
      content: `
        <h2
          style="
            margin:0 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Vendor Details
        </h2>

        ${vendorDetailsTable(rows)}

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Review the vendor details and approve or reject the registration
          from the Sparesco Admin Panel.
        </p>
      `,
      actionLabel: "VIEW VENDORS",
      actionUrl: `${SITE_URL}/admin/vendors`,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Unable to send new vendor admin email."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}

type VendorStatusEmailData = {
  vendorId: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  gstNumber: string;
  country: string;
  productLimit: number;
};

/*
 * Vendor approved -> Vendor
 */
export async function sendVendorApprovedEmail(
  data: VendorStatusEmailData
) {
  const { resend, from } = getEmailConfiguration();

  const recipient = data.email.trim();

  if (!recipient) {
    throw new Error("Vendor email address is missing.");
  }

  const rows = [
    vendorDetailRow("Company Name", data.companyName),
    vendorDetailRow("Contact Person", data.contactPerson),
    vendorDetailRow("Email", data.email),
    vendorDetailRow("Contact Number", data.phone),
    vendorDetailRow("GST / Tax Number", data.gstNumber),
    vendorDetailRow("Status", "Approved"),
  ].join("");

  const result = await resend.emails.send({
    from,
    to: recipient,
    subject: "Your Sparesco Vendor Account Has Been Approved",
    html: vendorRegistrationTemplate({
      title: "Vendor Account Approved",
      intro: `
        Hi <strong>${escapeHtml(data.contactPerson)}</strong>,<br /><br />
        Your vendor registration for
        <strong>${escapeHtml(data.companyName)}</strong>
        has been approved.<br /><br />
        You can now sign in to your Sparesco Vendor Account
        and start adding your products.
      `,
      content: `
        <h2
          style="
            margin:0 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Account Details
        </h2>

        ${vendorDetailsTable(rows)}

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          You can initially submit up to
          <strong>${escapeHtml(data.productLimit)} products</strong>
          for review. Products will become available through the
          Sparesco platform after approval.
        </p>

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Regards,<br />
          <strong>Team Sparesco</strong>
        </p>
      `,
      actionLabel: "SIGN IN TO VENDOR ACCOUNT",
      actionUrl: `${SITE_URL}/vendor/login`,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Unable to send vendor approval email."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}

/*
 * Vendor approved -> Admin
 */
export async function sendVendorApprovedAdminEmail(
  data: VendorStatusEmailData
) {
  const { resend, notifyEmails, from } =
    getEmailConfiguration();

  if (!notifyEmails) {
    throw new Error(
      "Missing FORM_NOTIFY_EMAIL environment variable."
    );
  }

  const recipients = notifyEmails
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error(
      "FORM_NOTIFY_EMAIL does not contain a valid email."
    );
  }

  const rows = [
    vendorDetailRow("Company Name", data.companyName),
    vendorDetailRow("Vendor ID", data.vendorId),
    vendorDetailRow("Contact Person", data.contactPerson),
    vendorDetailRow("Email", data.email),
    vendorDetailRow("Contact Number", data.phone),
    vendorDetailRow("GST / Tax Number", data.gstNumber),
    vendorDetailRow("Country", data.country),
    vendorDetailRow("Product Limit", data.productLimit),
    vendorDetailRow("Status", "Approved"),
  ].join("");

  const result = await resend.emails.send({
    from,
    to: recipients,
    subject: `Vendor Approved – ${data.companyName}`,
    replyTo: data.email,
    html: vendorRegistrationTemplate({
      title: "Vendor Approved",
      intro:
        "The following vendor has been approved on Sparesco.",
      content: `
        <h2
          style="
            margin:0 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Vendor Details
        </h2>

        ${vendorDetailsTable(rows)}

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          The vendor can now access their vendor account and
          submit products for review.
        </p>

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Regards,<br />
          <strong>Sparesco Vendor System</strong>
        </p>
      `,
      actionLabel: "VIEW VENDORS",
      actionUrl: `${SITE_URL}/admin/vendors`,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Unable to send vendor approval admin email."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}

/*
 * Vendor rejected -> Vendor
 */
export async function sendVendorRejectedEmail(
  data: VendorStatusEmailData
) {
  const { resend, from } = getEmailConfiguration();

  const recipient = data.email.trim();

  if (!recipient) {
    throw new Error("Vendor email address is missing.");
  }

  const rows = [
    vendorDetailRow("Company Name", data.companyName),
    vendorDetailRow("Contact Person", data.contactPerson),
    vendorDetailRow("Email", data.email),
    vendorDetailRow("Contact Number", data.phone),
    vendorDetailRow("GST / Tax Number", data.gstNumber),
    vendorDetailRow("Status", "Not Approved"),
  ].join("");

  const result = await resend.emails.send({
    from,
    to: recipient,
    subject: "Update on Your Sparesco Vendor Registration",
    html: vendorRegistrationTemplate({
      title: "Vendor Registration Update",
      intro: `
        Hi <strong>${escapeHtml(data.contactPerson)}</strong>,<br /><br />
        Thank you for your interest in becoming a vendor on Sparesco.<br /><br />
        After reviewing the registration for
        <strong>${escapeHtml(data.companyName)}</strong>,
        we are unable to approve the vendor account at this time.
      `,
      content: `
        <h2
          style="
            margin:0 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Registration Details
        </h2>

        ${vendorDetailsTable(rows)}

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          If you believe any information submitted during registration
          was incorrect or you require further clarification, please
          contact us at
          <a
            href="mailto:support@sparesco.com"
            style="
              color:#2a8392;
              font-weight:700;
              text-decoration:none;
            "
          >
            support@sparesco.com
          </a>.
        </p>

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Regards,<br />
          <strong>Team Sparesco</strong>
        </p>
      `,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Unable to send vendor rejection email."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}

/*
 * Vendor rejected -> Admin
 */
export async function sendVendorRejectedAdminEmail(
  data: VendorStatusEmailData
) {
  const { resend, notifyEmails, from } =
    getEmailConfiguration();

  if (!notifyEmails) {
    throw new Error(
      "Missing FORM_NOTIFY_EMAIL environment variable."
    );
  }

  const recipients = notifyEmails
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error(
      "FORM_NOTIFY_EMAIL does not contain a valid email."
    );
  }

  const rows = [
    vendorDetailRow("Company Name", data.companyName),
    vendorDetailRow("Vendor ID", data.vendorId),
    vendorDetailRow("Contact Person", data.contactPerson),
    vendorDetailRow("Email", data.email),
    vendorDetailRow("Contact Number", data.phone),
    vendorDetailRow("GST / Tax Number", data.gstNumber),
    vendorDetailRow("Country", data.country),
    vendorDetailRow("Status", "Rejected"),
  ].join("");

  const result = await resend.emails.send({
    from,
    to: recipients,
    subject: `Vendor Registration Rejected – ${data.companyName}`,
    replyTo: data.email,
    html: vendorRegistrationTemplate({
      title: "Vendor Registration Rejected",
      intro:
        "The following vendor registration has been rejected on Sparesco.",
      content: `
        <h2
          style="
            margin:0 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Vendor Details
        </h2>

        ${vendorDetailsTable(rows)}

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Regards,<br />
          <strong>Sparesco Vendor System</strong>
        </p>
      `,
      actionLabel: "VIEW VENDORS",
      actionUrl: `${SITE_URL}/admin/vendors`,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Unable to send vendor rejection admin email."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}

type VendorProductEmailData = {
  vendorId: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;

  productId: number;
  productName: string;
  partNumber: string;
  brand: string;
  category: string;
  description: string | null;
  price: string | null;
  currency: string;
  stockQuantity: number | null;
  application: string | null;
  godownLocation: string | null;
  leadTime: string | null;
};

function vendorProductRows(
  data: VendorProductEmailData,
  status: string
) {
  return [
    vendorDetailRow("Product Name", data.productName),
    vendorDetailRow("Part Number", data.partNumber),
    vendorDetailRow("Brand", data.brand),
    vendorDetailRow("Category", data.category),
    vendorDetailRow(
      "Description",
      data.description || "Not Provided"
    ),
    vendorDetailRow(
      "Price",
      data.price
        ? `${data.currency || "INR"} ${data.price}`
        : "Not Provided"
    ),
    vendorDetailRow(
      "Stock Quantity",
      data.stockQuantity !== null
        ? data.stockQuantity
        : "Not Provided"
    ),
    vendorDetailRow(
      "Application",
      data.application || "Not Provided"
    ),
    vendorDetailRow(
      "Godown Location",
      data.godownLocation || "Not Provided"
    ),
    vendorDetailRow(
      "Lead Time",
      data.leadTime || "Not Provided"
    ),
    vendorDetailRow("Status", status),
  ].join("");
}

function vendorProductAdminRows(
  data: VendorProductEmailData
) {
  return [
    vendorDetailRow("Company Name", data.companyName),
    vendorDetailRow("Vendor ID", data.vendorId),
    vendorDetailRow("Contact Person", data.contactPerson),
    vendorDetailRow("Email", data.email),
    vendorDetailRow(
      "Contact Number",
      data.phone || "Not Provided"
    ),
  ].join("");
}

/*
 * Product submitted -> Vendor
 */
export async function sendVendorProductSubmittedEmail(
  data: VendorProductEmailData
) {
  const { resend, from } = getEmailConfiguration();

  const recipient = data.email.trim();

  if (!recipient) {
    throw new Error("Vendor email address is missing.");
  }

  const rows = vendorProductRows(data, "Pending Review");

  const result = await resend.emails.send({
    from,
    to: recipient,
    subject: `Product Submitted for Review – ${data.partNumber}`,
    html: vendorRegistrationTemplate({
      title: "Product Submitted for Review",
      intro: `
        Hi <strong>${escapeHtml(data.contactPerson)}</strong>,<br /><br />
        Your product submission for
        <strong>${escapeHtml(data.productName)}</strong>
        has been received and is currently
        <strong>pending review</strong>.
      `,
      content: `
        <h2
          style="
            margin:0 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Product Details
        </h2>

        ${vendorDetailsTable(rows)}

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          We will notify you by email once your product has been reviewed.
        </p>

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Regards,<br />
          <strong>Team Sparesco</strong>
        </p>
      `,
      actionLabel: "VIEW MY PRODUCTS",
      actionUrl: `${SITE_URL}/vendor/dashboard`,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Unable to send product submission email."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}

/*
 * Product submitted -> Admin
 */
export async function sendVendorProductSubmittedAdminEmail(
  data: VendorProductEmailData
) {
  const { resend, notifyEmails, from } =
    getEmailConfiguration();

  if (!notifyEmails) {
    throw new Error(
      "Missing FORM_NOTIFY_EMAIL environment variable."
    );
  }

  const recipients = notifyEmails
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error(
      "FORM_NOTIFY_EMAIL does not contain a valid email."
    );
  }

  const vendorRows = vendorProductAdminRows(data);
  const productRows = vendorProductRows(
    data,
    "Pending Review"
  );

  const result = await resend.emails.send({
    from,
    to: recipients,
    subject: `New Vendor Product Submitted – ${data.partNumber}`,
    replyTo: data.email,
    html: vendorRegistrationTemplate({
      title: "New Product Submitted",
      intro:
        "A vendor has submitted a new product on Sparesco and it is awaiting review.",
      content: `
        <h2
          style="
            margin:0 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Vendor Details
        </h2>

        ${vendorDetailsTable(vendorRows)}

        <h2
          style="
            margin:28px 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Product Details
        </h2>

        ${vendorDetailsTable(productRows)}

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Review the submitted product from the Sparesco Admin Panel.
        </p>

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Regards,<br />
          <strong>Sparesco Vendor System</strong>
        </p>
      `,
      actionLabel: "REVIEW PRODUCT",
      actionUrl: `${SITE_URL}/admin/vendor-products`,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Unable to send product submission admin email."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}

/*
 * Product approved -> Vendor
 */
export async function sendVendorProductApprovedEmail(
  data: VendorProductEmailData
) {
  const { resend, from } = getEmailConfiguration();

  const recipient = data.email.trim();

  if (!recipient) {
    throw new Error("Vendor email address is missing.");
  }

  const rows = vendorProductRows(data, "Approved");

  const result = await resend.emails.send({
    from,
    to: recipient,
    subject: `Your Product Has Been Approved – ${data.partNumber}`,
    html: vendorRegistrationTemplate({
      title: "Product Approved",
      intro: `
        Hi <strong>${escapeHtml(data.contactPerson)}</strong>,<br /><br />
        Your product
        <strong>${escapeHtml(data.productName)} – ${escapeHtml(data.partNumber)}</strong>
        has been reviewed and approved by Sparesco.
      `,
      content: `
        <h2
          style="
            margin:0 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Product Details
        </h2>

        ${vendorDetailsTable(rows)}

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Regards,<br />
          <strong>Team Sparesco</strong>
        </p>
      `,
      actionLabel: "VIEW MY PRODUCTS",
      actionUrl: `${SITE_URL}/vendor/dashboard`,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Unable to send product approval email."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}

/*
 * Product approved -> Admin
 */
export async function sendVendorProductApprovedAdminEmail(
  data: VendorProductEmailData
) {
  const { resend, notifyEmails, from } =
    getEmailConfiguration();

  if (!notifyEmails) {
    throw new Error(
      "Missing FORM_NOTIFY_EMAIL environment variable."
    );
  }

  const recipients = notifyEmails
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error(
      "FORM_NOTIFY_EMAIL does not contain a valid email."
    );
  }

  const vendorRows = vendorProductAdminRows(data);
  const productRows = vendorProductRows(data, "Approved");

  const result = await resend.emails.send({
    from,
    to: recipients,
    subject: `Vendor Product Approved – ${data.partNumber}`,
    replyTo: data.email,
    html: vendorRegistrationTemplate({
      title: "Vendor Product Approved",
      intro:
        "The following vendor product has been approved on Sparesco.",
      content: `
        <h2
          style="
            margin:0 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Vendor Details
        </h2>

        ${vendorDetailsTable(vendorRows)}

        <h2
          style="
            margin:28px 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Product Details
        </h2>

        ${vendorDetailsTable(productRows)}

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Regards,<br />
          <strong>Sparesco Vendor System</strong>
        </p>
      `,
      actionLabel: "VIEW PRODUCTS",
      actionUrl: `${SITE_URL}/admin/vendor-products`,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Unable to send product approval admin email."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}

/*
 * Product rejected -> Vendor
 */
export async function sendVendorProductRejectedEmail(
  data: VendorProductEmailData
) {
  const { resend, from } = getEmailConfiguration();

  const recipient = data.email.trim();

  if (!recipient) {
    throw new Error("Vendor email address is missing.");
  }

  const rows = vendorProductRows(data, "Not Approved");

  const result = await resend.emails.send({
    from,
    to: recipient,
    subject: `Update on Your Product Submission – ${data.partNumber}`,
    html: vendorRegistrationTemplate({
      title: "Update on Your Product Submission",
      intro: `
        Hi <strong>${escapeHtml(data.contactPerson)}</strong>,<br /><br />
        After reviewing your product submission for
        <strong>${escapeHtml(data.productName)} – ${escapeHtml(data.partNumber)}</strong>,
        we are unable to approve the product at this time.
      `,
      content: `
        <h2
          style="
            margin:0 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Product Details
        </h2>

        ${vendorDetailsTable(rows)}

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          If you require further clarification, please contact
          <a
            href="mailto:support@sparesco.com"
            style="
              color:#2a8392;
              font-weight:700;
              text-decoration:none;
            "
          >
            support@sparesco.com
          </a>.
        </p>

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Regards,<br />
          <strong>Team Sparesco</strong>
        </p>
      `,
      actionLabel: "VIEW MY PRODUCTS",
      actionUrl: `${SITE_URL}/vendor/dashboard`,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Unable to send product rejection email."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}

/*
 * Product rejected -> Admin
 */
export async function sendVendorProductRejectedAdminEmail(
  data: VendorProductEmailData
) {
  const { resend, notifyEmails, from } =
    getEmailConfiguration();

  if (!notifyEmails) {
    throw new Error(
      "Missing FORM_NOTIFY_EMAIL environment variable."
    );
  }

  const recipients = notifyEmails
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error(
      "FORM_NOTIFY_EMAIL does not contain a valid email."
    );
  }

  const vendorRows = vendorProductAdminRows(data);
  const productRows = vendorProductRows(data, "Rejected");

  const result = await resend.emails.send({
    from,
    to: recipients,
    subject: `Vendor Product Rejected – ${data.partNumber}`,
    replyTo: data.email,
    html: vendorRegistrationTemplate({
      title: "Vendor Product Rejected",
      intro:
        "The following vendor product has been rejected on Sparesco.",
      content: `
        <h2
          style="
            margin:0 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Vendor Details
        </h2>

        ${vendorDetailsTable(vendorRows)}

        <h2
          style="
            margin:28px 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Product Details
        </h2>

        ${vendorDetailsTable(productRows)}

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Regards,<br />
          <strong>Sparesco Vendor System</strong>
        </p>
      `,
      actionLabel: "VIEW PRODUCTS",
      actionUrl: `${SITE_URL}/admin/vendor-products`,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Unable to send product rejection admin email."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}

type VendorEnquiryMatchedItem = {
  enquiryId: number;
  enquiryReference: string;
  productName: string;
  partNumber: string;
  quantity: string;
};

type VendorEnquiryEmailData = {
  vendorId: number;
  companyName: string;
  contactPerson: string;
  email: string;
  batchReference: string;
  customerCompany?: string | null;
  matchedItems: VendorEnquiryMatchedItem[];
};

export async function sendVendorEnquiryEmail(
  data: VendorEnquiryEmailData
) {
  const { resend, from } = getEmailConfiguration();

  const recipient = data.email.trim();

  if (!recipient) {
    throw new Error("Vendor email address is missing.");
  }

  const enquiryRows = [
    vendorDetailRow(
      "Enquiry Reference",
      data.batchReference
    ),
    vendorDetailRow(
      "Customer Company",
      data.customerCompany || "Not Provided"
    ),
    vendorDetailRow(
      "Matched Products",
      data.matchedItems.length
    ),
  ].join("");

  const matchedProductsHtml = data.matchedItems
    .map((item, index) => {
      const productRows = [
        vendorDetailRow(
          "Product Name",
          item.productName
        ),
        vendorDetailRow(
          "Part Number",
          item.partNumber
        ),
        vendorDetailRow(
          "Required Quantity",
          item.quantity
        ),
      ].join("");

      return `
        <div style="${index > 0 ? "margin-top:18px;" : ""}">
          ${
            data.matchedItems.length > 1
              ? `
                <div
                  style="
                    margin:0 0 8px;
                    color:#173f4c;
                    font-family:Arial,sans-serif;
                    font-size:14px;
                    font-weight:700;
                  "
                >
                  Product ${index + 1}
                </div>
              `
              : ""
          }

          ${vendorDetailsTable(productRows)}
        </div>
      `;
    })
    .join("");

  const result = await resend.emails.send({
    from,
    to: recipient,
    subject: "New Enquiry Received – Quotation Requested",
    html: vendorRegistrationTemplate({
      title: "New Enquiry Received",
      intro: `
        Hi <strong>${escapeHtml(data.contactPerson)}</strong>,<br /><br />

        You have received a new enquiry on Sparesco matching
        ${
          data.matchedItems.length === 1
            ? "one of your approved products"
            : "multiple approved products"
        }.<br /><br />

        Please review the enquiry and submit your quotation
        through your Sparesco Vendor Account.
      `,
      content: `
        <h2
          style="
            margin:0 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Enquiry Details
        </h2>

        ${vendorDetailsTable(enquiryRows)}

        <h2
          style="
            margin:28px 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Products Matched
        </h2>

        ${matchedProductsHtml}

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Please review the enquiry details and submit your
          quotation through your vendor account.
        </p>

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Regards,<br />
          <strong>Team Sparesco</strong>
        </p>
      `,
      actionLabel: "VIEW ENQUIRIES & SUBMIT QUOTE",
      actionUrl: `${SITE_URL}/vendor/dashboard`,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Unable to send vendor enquiry email."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}

type EnquiryListEmailData = {
  to: string;
  enquiryReference: string;
  customerName: string;
  companyName?: string | null;
  productName: string;
  partNumber: string;
  quantity: string;
  message?: string | null;
};

export async function sendEnquiryListEmail(
  data: EnquiryListEmailData
) {
  const { resend, from } = getEmailConfiguration();

  const recipient = data.to.trim();

  if (!recipient) {
    throw new Error("Recipient email address is missing.");
  }

  const enquiryRows = [
    vendorDetailRow(
      "Enquiry Reference",
      data.enquiryReference
    ),
    vendorDetailRow(
      "Product",
      data.productName
    ),
    vendorDetailRow(
      "Part Number",
      data.partNumber
    ),
    vendorDetailRow(
      "Required Quantity",
      data.quantity
    ),
    vendorDetailRow(
      "Customer / Company",
      data.companyName || data.customerName
    ),
  ].join("");

  const result = await resend.emails.send({
    from,
    to: recipient,
    subject: `New Product Enquiry – ${data.partNumber || data.enquiryReference}`,
    html: vendorRegistrationTemplate({
      title: "New Product Enquiry",
      intro: `
        Hello,<br /><br />

        We have received a product enquiry that may be relevant
        to your business.<br /><br />

        Please review the requirement below and contact Sparesco
        if you are able to supply the requested product.
      `,
      content: `
        <h2
          style="
            margin:0 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Enquiry Details
        </h2>

        ${vendorDetailsTable(enquiryRows)}

        ${
          data.message
            ? `
              <div
                style="
                  margin-top:22px;
                  padding:14px 16px;
                  background:#f7f9f8;
                  border:1px solid #e2e9e7;
                  border-radius:8px;
                "
              >
                <div
                  style="
                    margin-bottom:5px;
                    color:#173f4c;
                    font-family:Arial,sans-serif;
                    font-size:13px;
                    font-weight:700;
                  "
                >
                  Additional Requirement
                </div>

                <div
                  style="
                    color:#475467;
                    font-family:Arial,sans-serif;
                    font-size:14px;
                    line-height:1.7;
                  "
                >
                  ${escapeHtml(data.message)}
                </div>
              </div>
            `
            : ""
        }

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          If you can supply this requirement, please reply to this
          email with your quotation and availability.
        </p>

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Regards,<br />
          <strong>Team Sparesco</strong>
        </p>
      `,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Unable to send enquiry email."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}

type EnquiryListAdminSummaryData = {
  enquiryReference: string;
  productName: string;
  partNumber: string;
  quantity: string;
  successfulEmails: string[];
  failedEmails: string[];
};

export async function sendEnquiryListAdminSummaryEmail(
  data: EnquiryListAdminSummaryData
) {
  const { resend, notifyEmails, from } =
    getEmailConfiguration();

  const adminRecipients = String(
    notifyEmails || "support@sparesco.com"
  )
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  const successfulList =
    data.successfulEmails.length > 0
      ? `
        <ol
          style="
            margin:8px 0 0;
            padding-left:22px;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.8;
          "
        >
          ${data.successfulEmails
            .map(
              (email) =>
                `<li>${escapeHtml(email)}</li>`
            )
            .join("")}
        </ol>
      `
      : `
        <p
          style="
            margin:8px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
          "
        >
          None
        </p>
      `;

  const failedList =
    data.failedEmails.length > 0
      ? `
        <ol
          style="
            margin:8px 0 0;
            padding-left:22px;
            color:#a23c35;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.8;
          "
        >
          ${data.failedEmails
            .map(
              (email) =>
                `<li>${escapeHtml(email)}</li>`
            )
            .join("")}
        </ol>
      `
      : "";

  const result = await resend.emails.send({
    from,
    to: adminRecipients,
    subject: `Enquiry Email List Sent – ${data.enquiryReference}`,
    html: vendorRegistrationTemplate({
      title: "Enquiry Email List Sent",
      intro: `
        The enquiry email-list send has been completed.<br /><br />

        <strong>${data.successfulEmails.length}</strong>
        recipient${
          data.successfulEmails.length === 1 ? "" : "s"
        } received the enquiry successfully.
      `,
      content: `
        <h2
          style="
            margin:0 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Enquiry Details
        </h2>

        ${vendorDetailsTable(
          [
            vendorDetailRow(
              "Enquiry Reference",
              data.enquiryReference
            ),
            vendorDetailRow(
              "Product",
              data.productName
            ),
            vendorDetailRow(
              "Part Number",
              data.partNumber
            ),
            vendorDetailRow(
              "Quantity",
              data.quantity
            ),
          ].join("")
        )}

        <h2
          style="
            margin:28px 0 8px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Successfully Sent
          (${data.successfulEmails.length})
        </h2>

        ${successfulList}

        ${
          data.failedEmails.length > 0
            ? `
              <h2
                style="
                  margin:28px 0 8px;
                  color:#a23c35;
                  font-family:Arial,sans-serif;
                  font-size:18px;
                  font-weight:700;
                "
              >
                Failed
                (${data.failedEmails.length})
              </h2>

              ${failedList}
            `
            : ""
        }

        <p
          style="
            margin:26px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Regards,<br />
          <strong>Team Sparesco</strong>
        </p>
      `,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Unable to send admin enquiry-list summary."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}

type VendorQuotationEmailData = {
  enquiryId: number;
  enquiryReference: string;

  vendorId: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string | null;

  productName: string;
  partNumber: string;
  requiredQuantity: string;

  quotedQuantity: number;
  unitPrice: number;
  currency: string;
  totalPrice: number;
  stockAvailable: boolean;
  leadTime?: string | null;
  moq?: number | null;
  condition?: string | null;
  manufacturerBrand?: string | null;
  countryOfOrigin?: string | null;
  quoteValidity?: string | null;
  godownLocation?: string | null;
  taxIncludedPercent?: string | number | null;
  vendorRemarks?: string | null;
};

function vendorQuotationRows(
  data: VendorQuotationEmailData
) {
  return [
    vendorDetailRow("Quoted Quantity", data.quotedQuantity),

    vendorDetailRow(
      "Unit Price",
      `${data.currency} ${data.unitPrice}`
    ),

    vendorDetailRow(
      "Total Price",
      `${data.currency} ${data.totalPrice}`
    ),

    vendorDetailRow(
      "Stock Available",
      data.stockAvailable ? "Yes" : "No"
    ),

    vendorDetailRow(
      "Lead Time",
      data.leadTime || "Not Provided"
    ),

    vendorDetailRow(
      "MOQ",
      data.moq !== null && data.moq !== undefined
        ? data.moq
        : "Not Provided"
    ),

    vendorDetailRow(
      "Condition",
      data.condition || "Not Provided"
    ),

    vendorDetailRow(
      "Manufacturer / Brand",
      data.manufacturerBrand || "Not Provided"
    ),

    vendorDetailRow(
      "Country of Origin",
      data.countryOfOrigin || "Not Provided"
    ),

    vendorDetailRow(
      "Quote Validity",
      data.quoteValidity || "Not Provided"
    ),

    vendorDetailRow(
      "Godown Location",
      data.godownLocation || "Not Provided"
    ),

    vendorDetailRow(
      "Tax Included %",
      data.taxIncludedPercent ?? "Not Provided"
    ),

    vendorDetailRow(
      "Vendor Remarks",
      data.vendorRemarks || "Not Provided"
    ),
  ].join("");
}

/*
 * Quotation submitted -> Vendor
 */
export async function sendVendorQuotationSubmittedEmail(
  data: VendorQuotationEmailData
) {
  const { resend, from } = getEmailConfiguration();

  const recipient = data.email.trim();

  if (!recipient) {
    throw new Error("Vendor email address is missing.");
  }

  const enquiryRows = [
    vendorDetailRow(
      "Enquiry Reference",
      data.enquiryReference
    ),
    vendorDetailRow("Product", data.productName),
    vendorDetailRow("Part Number", data.partNumber),
    vendorDetailRow(
      "Required Quantity",
      data.requiredQuantity
    ),
  ].join("");

  const quotationRows = vendorQuotationRows(data);

  const result = await resend.emails.send({
    from,
    to: recipient,
    subject:
      `Quotation Submitted Successfully – ${data.enquiryReference}`,

    html: vendorRegistrationTemplate({
      title: "Quotation Submitted Successfully",

      intro: `
        Hi <strong>${escapeHtml(data.contactPerson)}</strong>,<br /><br />

        Thank you for submitting your quotation for enquiry
        <strong>${escapeHtml(data.enquiryReference)}</strong>.<br /><br />

        Your quotation has been received successfully by Sparesco.
        The details submitted by you are provided below for your reference.
      `,

      content: `
        <h2
          style="
            margin:0 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Enquiry Details
        </h2>

        ${vendorDetailsTable(enquiryRows)}

        <h2
          style="
            margin:28px 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Quotation Details
        </h2>

        ${vendorDetailsTable(quotationRows)}

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Our team will review the quotation and contact you
          if any additional information is required.
        </p>

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Regards,<br />
          <strong>Team Sparesco</strong>
        </p>
      `,

      actionLabel: "VIEW MY ENQUIRIES",
      actionUrl: `${SITE_URL}/vendor/dashboard`,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Unable to send quotation confirmation email."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}

/*
 * Quotation submitted -> Admin
 */
export async function sendVendorQuotationSubmittedAdminEmail(
  data: VendorQuotationEmailData
) {
  const { resend, notifyEmails, from } =
    getEmailConfiguration();

  if (!notifyEmails) {
    throw new Error(
      "Missing FORM_NOTIFY_EMAIL environment variable."
    );
  }

  const recipients = notifyEmails
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error(
      "FORM_NOTIFY_EMAIL does not contain a valid email."
    );
  }

  const vendorRows = [
    vendorDetailRow("Company Name", data.companyName),
    vendorDetailRow("Vendor ID", data.vendorId),
    vendorDetailRow("Contact Person", data.contactPerson),
    vendorDetailRow("Email", data.email),
    vendorDetailRow(
      "Contact Number",
      data.phone || "Not Provided"
    ),
  ].join("");

  const enquiryRows = [
    vendorDetailRow(
      "Enquiry Reference",
      data.enquiryReference
    ),
    vendorDetailRow("Product", data.productName),
    vendorDetailRow("Part Number", data.partNumber),
    vendorDetailRow(
      "Required Quantity",
      data.requiredQuantity
    ),
  ].join("");

  const quotationRows = vendorQuotationRows(data);

  const result = await resend.emails.send({
    from,
    to: recipients,

    subject:
      `New Vendor Quotation – ${data.enquiryReference} – ${data.companyName}`,

    replyTo: data.email,

    html: vendorRegistrationTemplate({
      title: "New Vendor Quotation Received",

      intro: `
        A vendor has submitted a quotation against
        <strong>${escapeHtml(data.enquiryReference)}</strong>.
        The submitted details are provided below for review.
      `,

      content: `
        <h2
          style="
            margin:0 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Vendor Details
        </h2>

        ${vendorDetailsTable(vendorRows)}

        <h2
          style="
            margin:28px 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Enquiry Details
        </h2>

        ${vendorDetailsTable(enquiryRows)}

        <h2
          style="
            margin:28px 0 12px;
            color:#173f4c;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:700;
          "
        >
          Quotation Details
        </h2>

        ${vendorDetailsTable(quotationRows)}

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Please review the quotation from the
          Sparesco Admin Panel.
        </p>

        <p
          style="
            margin:22px 0 0;
            color:#475467;
            font-family:Arial,sans-serif;
            font-size:14px;
            line-height:1.7;
          "
        >
          Regards,<br />
          <strong>Sparesco Vendor System</strong>
        </p>
      `,

      actionLabel: "VIEW ENQUIRY",
      actionUrl: `${SITE_URL}/admin/enquiries`,
    }),
  });

  if (result.error) {
    throw new Error(
      result.error.message ||
        "Unable to send quotation admin email."
    );
  }

  return {
    success: true,
    id: result.data?.id,
  };
}