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
                    <a
                      href="${SITE_URL}"
                      target="_blank"
                      style="
                        display:inline-block;
                        margin:0 0 12px;
                        text-decoration:none;
                      "
                    >
                      <img
                        src="${LOGO_URL}"
                        alt="Sparesco"
                        width="90"
                        style="
                          display:block;
                          width:90px;
                          max-width:100%;
                          height:auto;
                          margin:0 auto;
                          border:0;
                          outline:none;
                          text-decoration:none;
                        "
                      />
                    </a>

                    <h1
                      class="email-title"
                      style="
                        margin:0;
                        color:#d9f0f3;
                        font-family:Arial,sans-serif;
                        font-size:23px;
                        font-weight:600;
                        line-height:1.35;
                        text-align:center;
                      "
                    >
                      ${escapeHtml(title)}
                    </h1>
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
                    <a
                      href="${SITE_URL}"
                      target="_blank"
                      style="
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