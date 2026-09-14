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
      from: "Sparesco <support@sparesco.com>",
      to: email,
      subject: "Your Sparesco Vendor Login OTP",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;">
          <h2>Vendor Login</h2>

          <p>Hello ${vendor.company_name || "Vendor"},</p>

          <p>Your Sparesco login OTP is:</p>

          <div style="
            font-size:32px;
            font-weight:700;
            letter-spacing:6px;
            margin:24px 0;
          ">
            ${otp}
          </div>

          <p>This OTP is valid for 10 minutes.</p>

          <p>If you did not request this login, you can ignore this email.</p>

          <p>Regards,<br />Sparesco</p>
        </div>
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