import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { Resend } from "resend";

export const runtime = "edge";

function generateOtp() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);

  return String(100000 + (array[0] % 900000));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email is required.",
        },
        { status: 400 }
      );
    }

    const { env } = getRequestContext();
    const db = (env as any).DB;

    if (!db) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor database is not configured.",
        },
        { status: 500 }
      );
    }

    // Find vendor
    const vendor = await db
      .prepare(
        `
        SELECT
          id,
          company_name,
          contact_person,
          email,
          status
        FROM vendors
        WHERE LOWER(email) = ?
        ORDER BY id DESC
        LIMIT 1
        `
      )
      .bind(email)
      .first();

    // Vendor not registered
    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          code: "NOT_REGISTERED",
          error: "No vendor account found. Please register first.",
        },
        { status: 404 }
      );
    }

    // Pending approval
    if (vendor.status === "pending") {
      return NextResponse.json(
        {
          success: false,
          code: "PENDING",
          error: "Your vendor application is pending admin approval.",
        },
        { status: 403 }
      );
    }

    // Rejected
    if (vendor.status === "rejected") {
      return NextResponse.json(
        {
          success: false,
          code: "REJECTED",
          error: "Your vendor application was not approved.",
        },
        { status: 403 }
      );
    }

    // Only approved vendors can continue
    if (vendor.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor account is not available for login.",
        },
        { status: 403 }
      );
    }

    const otp = generateOtp();

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    ).toISOString();

    // Make any older unused OTPs unusable
    await db
      .prepare(
        `
        UPDATE vendor_login_otps
        SET used_at = CURRENT_TIMESTAMP
        WHERE vendor_id = ?
          AND used_at IS NULL
        `
      )
      .bind(vendor.id)
      .run();

    // Save new OTP
    await db
      .prepare(
        `
        INSERT INTO vendor_login_otps (
          vendor_id,
          email,
          otp_code,
          expires_at
        )
        VALUES (?, ?, ?, ?)
        `
      )
      .bind(
        vendor.id,
        email,
        otp,
        expiresAt
      )
      .run();

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Email service is not configured.",
        },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: "Sparesco Support <support@sparesco.com>",
      to: email,
      subject: "Your Sparesco Vendor Login Code",
      html: `
    <!DOCTYPE html>
    <html>
      <body
        style="
          margin:0;
          padding:0;
          background:#f7f5ef;
          font-family:Arial,sans-serif;
          color:#173f4c;
        "
      >
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="background:#f7f5ef;padding:32px 16px;"
        >
          <tr>
            <td align="center">

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  max-width:600px;
                  background:#ffffff;
                  border-radius:12px;
                  overflow:hidden;
                  border:1px solid #e7e4dc;
                "
              >

                <!-- LOGO -->
                <tr>
                  <td
                    align="center"
                    style="padding:30px 30px 24px;"
                  >
                    <a
                      href="https://sparesco.com"
                      style="text-decoration:none;"
                    >
                      <img
                        src="https://sparesco.com/logo.png"
                        alt="Sparesco"
                        width="180"
                        style="
                          display:block;
                          max-width:180px;
                          height:auto;
                          border:0;
                        "
                      />
                    </a>
                  </td>
                </tr>

                <!-- CONTENT -->
                <tr>
                  <td
                    style="
                      padding:8px 40px 38px;
                    "
                  >
                    <h1
                      style="
                        margin:0 0 24px;
                        font-size:26px;
                        line-height:1.3;
                        color:#173f4c;
                        font-weight:700;
                      "
                    >
                      Sign in to your Vendor Account
                    </h1>

                    <p
                      style="
                        margin:0 0 18px;
                        font-size:15px;
                        line-height:1.7;
                        color:#475467;
                      "
                    >
                      Hi <strong>${vendor.contact_person || vendor.company_name || "Vendor"}</strong>,
                    </p>

                    <p
                      style="
                        margin:0 0 18px;
                        font-size:15px;
                        line-height:1.7;
                        color:#475467;
                      "
                    >
                      We received a request to sign in to your
                      Sparesco Vendor Account.
                    </p>

                    <p
                      style="
                        margin:0 0 24px;
                        font-size:15px;
                        line-height:1.7;
                        color:#475467;
                      "
                    >
                      Use the verification code below to continue:
                    </p>

                    <!-- OTP -->
                    <div
                      style="
                        background:#f7f5ef;
                        border:1px solid #e1ded5;
                        border-radius:10px;
                        padding:24px;
                        text-align:center;
                        margin:0 0 24px;
                      "
                    >
                      <div
                        style="
                          font-size:12px;
                          line-height:1.4;
                          text-transform:uppercase;
                          letter-spacing:1.2px;
                          color:#667085;
                          font-weight:700;
                          margin-bottom:10px;
                        "
                      >
                        Your verification code
                      </div>

                      <div
                        style="
                          font-size:36px;
                          line-height:1.2;
                          letter-spacing:8px;
                          color:#173f4c;
                          font-weight:700;
                        "
                      >
                        ${otp}
                      </div>
                    </div>

                    <p
                      style="
                        margin:0 0 20px;
                        text-align:center;
                        font-size:14px;
                        line-height:1.6;
                        color:#475467;
                      "
                    >
                      This code will expire in
                      <strong>10 minutes</strong>.
                    </p>

                    <p
                      style="
                        margin:0 0 18px;
                        font-size:14px;
                        line-height:1.7;
                        color:#475467;
                      "
                    >
                      For your security, please do not share this
                      code with anyone. Sparesco will never ask you
                      to provide your verification code by email or
                      phone.
                    </p>

                    <p
                      style="
                        margin:0 0 24px;
                        font-size:14px;
                        line-height:1.7;
                        color:#475467;
                      "
                    >
                      If you did not request this code, you can
                      safely ignore this email.
                    </p>

                    <p
                      style="
                        margin:0;
                        font-size:14px;
                        line-height:1.7;
                        color:#475467;
                      "
                    >
                      Regards,<br />
                      <strong style="color:#173f4c;">
                        Team Sparesco
                      </strong>
                    </p>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td
                    align="center"
                    style="
                      background:#173f4c;
                      padding:24px 30px;
                    "
                  >
                    <a
                      href="https://sparesco.com"
                      style="
                        color:#ffffff;
                        font-size:14px;
                        font-weight:700;
                        text-decoration:none;
                      "
                    >
                      sparesco.com
                    </a>

                    <p
                      style="
                        margin:12px auto 0;
                        max-width:420px;
                        font-size:12px;
                        line-height:1.6;
                        color:#d5e0e3;
                      "
                    >
                      This is an automated security email sent for
                      your Sparesco Vendor Account.
                    </p>

                    <p
                      style="
                        margin:8px 0 0;
                        font-size:12px;
                        color:#aebfc4;
                      "
                    >
                      &copy; Sparesco
                    </p>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>
      </body>
    </html>
  `,
    });

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully.",
    });
  } catch (error) {
    console.error("Vendor OTP request error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to send OTP.",
      },
      { status: 500 }
    );
  }
}