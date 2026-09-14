import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = body.email?.trim().toLowerCase();
    const otp = body.otp?.trim();

    if (!email || !otp) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and OTP are required.",
        },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid 6-digit OTP.",
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

    // Find approved vendor
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

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor account not found.",
        },
        { status: 404 }
      );
    }

    if (vendor.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor account is not approved.",
        },
        { status: 403 }
      );
    }

    // Find latest unused OTP
    const otpRecord = await db
      .prepare(
        `
        SELECT
          id,
          otp_code,
          expires_at
        FROM vendor_login_otps
        WHERE vendor_id = ?
          AND LOWER(email) = ?
          AND used_at IS NULL
        ORDER BY id DESC
        LIMIT 1
        `
      )
      .bind(vendor.id, email)
      .first();

    if (!otpRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "OTP not found or already used. Please request a new OTP.",
        },
        { status: 400 }
      );
    }

    // Check expiry
    const expiresAt = new Date(otpRecord.expires_at).getTime();

    if (Date.now() > expiresAt) {
      return NextResponse.json(
        {
          success: false,
          error: "OTP has expired. Please request a new OTP.",
        },
        { status: 400 }
      );
    }

    // Check OTP
    if (otpRecord.otp_code !== otp) {
      return NextResponse.json(
        {
          success: false,
          error: "Incorrect OTP.",
        },
        { status: 401 }
      );
    }

    // Mark OTP as used
    await db
      .prepare(
        `
        UPDATE vendor_login_otps
        SET used_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `
      )
      .bind(otpRecord.id)
      .run();

    // Create a secure random vendor session token
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);

    const sessionToken = Array.from(randomBytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

      const sessionExpiresAt = new Date(
        Date.now() + 60 * 60 * 1000
        ).toISOString();

        await db
        .prepare(
            `
            INSERT INTO vendor_sessions (
            vendor_id,
            session_token,
            expires_at
            )
            VALUES (?, ?, ?)
            `
        )
        .bind(
            vendor.id,
            sessionToken,
            sessionExpiresAt
        )
        .run();


    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      vendor: {
        id: vendor.id,
        company_name: vendor.company_name,
        email: vendor.email,
      },
    });

    response.cookies.set(
      "sparesco_vendor",
      `${vendor.id}:${sessionToken}`,
      {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60,
      }
    );

    return response;
  } catch (error) {
    console.error("Vendor OTP verification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to verify OTP.",
      },
      { status: 500 }
    );
  }
}