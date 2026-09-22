import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";

    const vendorCookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("sparesco_vendor="));

    if (!vendorCookie) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor login required.",
        },
        { status: 401 }
      );
    }

    const cookieValue = decodeURIComponent(
      vendorCookie.split("=")[1] || ""
    );

    const [vendorIdRaw, sessionToken] = cookieValue.split(":");

    const vendorId = Number(vendorIdRaw);

    if (!vendorId || !sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid vendor session.",
        },
        { status: 401 }
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

    const session = await db
      .prepare(
        `
        SELECT
          vs.id,
          vs.vendor_id,
          vs.expires_at,
          v.company_name,
v.contact_person,
v.email,
v.phone,
v.gst_no,
v.address,
v.city,
v.state,
v.country,
v.pincode,
v.website,
v.status,
v.product_limit,
v.products_submitted
        FROM vendor_sessions vs
        JOIN vendors v
          ON v.id = vs.vendor_id
        WHERE vs.vendor_id = ?
          AND vs.session_token = ?
        LIMIT 1
        `
      )
      .bind(vendorId, sessionToken)
      .first();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor session not found.",
        },
        { status: 401 }
      );
    }

    if (session.status !== "approved") {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor account is not approved.",
        },
        { status: 403 }
      );
    }

    const expiresAt = new Date(session.expires_at).getTime();

    if (Date.now() > expiresAt) {
      await db
        .prepare(
          `
          DELETE FROM vendor_sessions
          WHERE id = ?
          `
        )
        .bind(session.id)
        .run();

      return NextResponse.json(
        {
          success: false,
          error: "Vendor session has expired.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      vendor: {
        id: session.vendor_id,
        company_name: session.company_name,
        contact_person: session.contact_person,
        email: session.email,
        phone: session.phone,
        gst_no: session.gst_no,
        address: session.address,
        city: session.city,
        state: session.state,
        country: session.country,
        pincode: session.pincode,
        website: session.website,
        status: session.status,
        product_limit: session.product_limit,
        products_submitted: session.products_submitted,
      },
    });
  } catch (error) {
    console.error("Vendor session error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to verify vendor session.",
      },
      { status: 500 }
    );
  }
}