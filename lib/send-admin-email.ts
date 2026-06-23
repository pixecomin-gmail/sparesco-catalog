import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#667085;font-weight:700;width:34%;text-transform:capitalize;">
            ${escapeHtml(key.replaceAll("_", " "))}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;color:#173f4c;white-space:pre-line;">
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
    <div style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif;">
      <div style="max-width:720px;margin:0 auto;padding:28px 16px;">
        <div style="background:#173f4c;padding:24px;text-align:center;">
          ${
            logoUrl
              ? `<img src="${escapeHtml(
                  logoUrl
                )}" alt="Sparesco" style="max-height:64px;max-width:180px;margin-bottom:12px;" />`
              : `<h2 style="margin:0 0 12px;color:#ffffff;font-size:28px;">Sparesco</h2>`
          }
          <h1 style="margin:0;color:#ffffff;font-size:24px;">${escapeHtml(
            title
          )}</h1>
        </div>

        <div style="background:#ffffff;border:1px solid #ddd;padding:24px;">
          <p style="margin:0 0 18px;color:#475467;font-size:15px;line-height:1.6;">
            ${escapeHtml(intro)}
          </p>

          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            ${buildRows(data, excludeKeys)}
          </table>
        </div>

        <div style="padding:14px;text-align:center;color:#667085;font-size:12px;">
          Sparesco Website Notification
        </div>
      </div>
    </div>
  `;
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
  const notifyEmails = process.env.FORM_NOTIFY_EMAIL;
  const from =
    process.env.EMAIL_FROM || "Sparesco Website <onboarding@resend.dev>";

  if (!process.env.RESEND_API_KEY || !notifyEmails) return;

  try {
    await resend.emails.send({
      from,
      to: notifyEmails.split(",").map((email) => email.trim()),
      subject,
      html: emailTemplate({
        title,
        intro: "New submission received from Sparesco website.",
        data,
      }),
    });
  } catch (error) {
    console.error("Admin email send failed:", error);
  }
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
  const from =
    process.env.EMAIL_FROM || "Sparesco Website <onboarding@resend.dev>";

  if (!process.env.RESEND_API_KEY || !to) return;

  try {
    await resend.emails.send({
      from,
      to,
      subject,
      html: emailTemplate({
        title,
        intro:
          "We have received your enquiry and our team will review it shortly. The details shared by you are listed below.",
        data,
        excludeKeys: ["email", "form_type"],
      }),
    });
  } catch (error) {
    console.error("User email send failed:", error);
  }
}