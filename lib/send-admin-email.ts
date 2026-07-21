import { Resend } from "resend";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildRows(data: Record<string, unknown>, excludeKeys: string[] = []) {
  return Object.entries(data)
    .filter(([key, value]) => {
      return (
        !excludeKeys.includes(key) &&
        value !== "" &&
        value !== null &&
        value !== undefined
      );
    })
    .map(
      ([key, value]) => `
        <tr>
          <td
            style="
              padding:10px 12px;
              border-bottom:1px solid #e5e7eb;
              color:#667085;
              font-weight:700;
              width:34%;
              text-transform:capitalize;
              vertical-align:top;
            "
          >
            ${escapeHtml(key.replaceAll("_", " "))}
          </td>

          <td
            style="
              padding:10px 12px;
              border-bottom:1px solid #e5e7eb;
              color:#173f4c;
              white-space:pre-line;
              vertical-align:top;
            "
          >
            ${escapeHtml(value)}
          </td>
        </tr>
      `
    )
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
  const logoUrl = process.env.EMAIL_LOGO_URL;

  return `
    <!doctype html>
    <html>
      <body
        style="
          margin:0;
          padding:0;
          background:#f5f5f0;
          font-family:Arial,sans-serif;
        "
      >
        <div style="max-width:720px;margin:0 auto;padding:28px 16px;">
          <div
            style="
              background:#173f4c;
              padding:24px;
              text-align:center;
              border-radius:10px 10px 0 0;
            "
          >
            ${
              logoUrl
                ? `
                  <img
                    src="${escapeHtml(logoUrl)}"
                    alt="Sparesco"
                    style="
                      max-height:64px;
                      max-width:180px;
                      margin-bottom:12px;
                    "
                  />
                `
                : `
                  <h2
                    style="
                      margin:0 0 12px;
                      color:#ffffff;
                      font-size:28px;
                    "
                  >
                    Sparesco
                  </h2>
                `
            }

            <h1
              style="
                margin:0;
                color:#ffffff;
                font-size:24px;
              "
            >
              ${escapeHtml(title)}
            </h1>
          </div>

          <div
            style="
              background:#ffffff;
              border:1px solid #dddddd;
              padding:24px;
              border-radius:0 0 10px 10px;
            "
          >
            <p
              style="
                margin:0 0 18px;
                color:#475467;
                font-size:15px;
                line-height:1.6;
              "
            >
              ${escapeHtml(intro)}
            </p>

            <table
              style="
                width:100%;
                border-collapse:collapse;
                font-size:14px;
              "
            >
              ${buildRows(data, excludeKeys)}
            </table>
          </div>

          <div
            style="
              padding:14px;
              text-align:center;
              color:#667085;
              font-size:12px;
            "
          >
            Sparesco Website Notification
          </div>
        </div>
      </body>
    </html>
  `;
}

function getEmailConfiguration() {
  const apiKey = process.env.RESEND_API_KEY;
  const notifyEmails = process.env.FORM_NOTIFY_EMAIL;
  const from =
    process.env.EMAIL_FROM || "Sparesco <support@sparesco.com>";

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
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
  const { resend, notifyEmails, from } = getEmailConfiguration();

  if (!notifyEmails) {
    throw new Error("Missing FORM_NOTIFY_EMAIL environment variable.");
  }

  const recipients = notifyEmails
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error("FORM_NOTIFY_EMAIL does not contain a valid email.");
  }

  const result = await resend.emails.send({
    from,
    to: recipients,
    subject,
    html: emailTemplate({
      title,
      intro: "New submission received from the Sparesco website.",
      data,
    }),
    replyTo:
      typeof data.email === "string" && data.email
        ? data.email
        : undefined,
  });

  if (result.error) {
    console.error("Resend admin email error:", result.error);

    throw new Error(
      `Admin email failed: ${
        result.error.message || "Unknown Resend error."
      }`
    );
  }

  console.log("Admin email sent:", {
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
  const { resend, from } = getEmailConfiguration();

  const recipient = String(to || "").trim();

  if (!recipient) {
    throw new Error("Customer email address is missing.");
  }

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
    console.error("Resend customer email error:", result.error);

    throw new Error(
      `Customer email failed: ${
        result.error.message || "Unknown Resend error."
      }`
    );
  }

  console.log("Customer email sent:", {
    id: result.data?.id,
    recipient,
  });

  return {
    success: true,
    id: result.data?.id,
  };
}