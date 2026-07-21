import { Resend } from "resend";

const SITE_URL = "https://sparesco.com";
const DEFAULT_LOGO_URL = "https://sparesco.com/logo.png";

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

function buildRows(
  data: Record<string, unknown>,
  excludeKeys: string[] = []
) {
  return Object.entries(data)
    .filter(([key, value]) => {
      return (
        !excludeKeys.includes(key) &&
        value !== "" &&
        value !== null &&
        value !== undefined
      );
    })
    .map(([key, value]) => {
      const safeValue = escapeHtml(value).replaceAll("\n", "<br />");

      return `
        <tr>
          <td
            class="field-label"
            width="180"
            style="
              width:180px;
              padding:14px 16px;
              border-bottom:1px solid #e5e7eb;
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
  const logoUrl =
    process.env.EMAIL_LOGO_URL || DEFAULT_LOGO_URL;

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
          @media only screen and (max-width: 600px) {
            .email-container {
              width: 100% !important;
            }

            .email-padding {
              padding: 16px !important;
            }

            .field-label {
              width: 115px !important;
              white-space:normal !important;
              padding:12px !important;
            }

            .field-value {
              padding:12px !important;
            }

            .email-title {
              font-size:21px !important;
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
            <td
              align="center"
              style="padding:28px 12px;"
            >
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
                    align="center"
                    style="
                      padding:26px 24px 22px;
                      background-color:#173f4c;
                      border-radius:12px 12px 0 0;
                    "
                  >
                    <a
                      href="${SITE_URL}"
                      target="_blank"
                      style="
                        display:inline-block;
                        text-decoration:none;
                      "
                    >
                      <img
                        src="${escapeHtml(logoUrl)}"
                        alt="Sparesco"
                        width="180"
                        style="
                          display:block;
                          width:180px;
                          max-width:100%;
                          height:auto;
                          margin:0 auto 16px;
                          border:0;
                        "
                      />
                    </a>

                    <h1
                      class="email-title"
                      style="
                        margin:0;
                        color:#ffffff;
                        font-family:Arial,sans-serif;
                        font-size:24px;
                        font-weight:700;
                        line-height:1.3;
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
                        margin:0 0 22px;
                        color:#475467;
                        font-family:Arial,sans-serif;
                        font-size:15px;
                        line-height:1.7;
                      "
                    >
                      ${escapeHtml(intro)}
                    </p>

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
                      ${buildRows(data, excludeKeys)}
                    </table>
                  </td>
                </tr>

                <tr>
                  <td
                    align="center"
                    style="
                      padding:22px 20px;
                      background-color:#ffffff;
                      border-right:1px solid #e4e7ec;
                      border-bottom:1px solid #e4e7ec;
                      border-left:1px solid #e4e7ec;
                      border-radius:0 0 12px 12px;
                    "
                  >
                    <p
                      style="
                        margin:0 0 8px;
                        color:#667085;
                        font-family:Arial,sans-serif;
                        font-size:13px;
                        line-height:1.5;
                        text-align:center;
                      "
                    >
                      Heavy equipment spare parts marketplace
                    </p>

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
                      Visit sparesco.com
                    </a>

                    <p
                      style="
                        margin:12px 0 0;
                        color:#98a2b3;
                        font-family:Arial,sans-serif;
                        font-size:11px;
                        line-height:1.5;
                        text-align:center;
                      "
                    >
                      Sparesco Website Notification
                    </p>
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
    "Sparesco <support@sparesco.com>";

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
  const {
    resend,
    notifyEmails,
    from,
  } = getEmailConfiguration();

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

  console.log("Sending admin email:", {
    from,
    recipients,
    subject,
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
    replyTo:
      typeof data.email === "string" &&
      data.email.trim()
        ? data.email.trim()
        : undefined,
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
        "We have received your enquiry. Our team will review it and contact you shortly. The details shared by you are listed below.",
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

  console.log(
    "Customer email accepted by Resend:",
    {
      id: result.data?.id,
      recipient,
    }
  );

  return {
    success: true,
    id: result.data?.id,
  };
}