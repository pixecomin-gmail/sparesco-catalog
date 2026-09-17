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
          v.status
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

    const enquiriesResult = await db
      .prepare(
        `
        SELECT
          e.id,
          e.product_name,
          e.part_number,
          e.product_handle,
          e.quantity,
          e.status AS enquiry_status,
          e.created_at,
          ev.status AS vendor_status,
          ev.sent_at,
          ev.viewed_at,
          ev.responded_at
        FROM enquiry_vendors ev
        JOIN enquiries e
          ON e.id = ev.enquiry_id
        WHERE ev.vendor_id = ?
        ORDER BY e.id DESC
        `
      )
      .bind(session.vendor_id)
      .all();

    return NextResponse.json({
      success: true,
      enquiries: enquiriesResult.results || [],
    });
  } catch (error) {
    console.error("Vendor enquiries error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load vendor enquiries.",
      },
      { status: 500 }
    );
  }
}