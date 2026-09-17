import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const enquiryId = Number(id);

    if (!enquiryId) {
      return NextResponse.json(
        { success: false, error: "Invalid enquiry." },
        { status: 400 }
      );
    }

    const cookieHeader = request.headers.get("cookie") || "";

    const vendorCookie = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("sparesco_vendor="));

    if (!vendorCookie) {
      return NextResponse.json(
        { success: false, error: "Vendor login required." },
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
        { success: false, error: "Invalid vendor session." },
        { status: 401 }
      );
    }

    const { env } = getRequestContext();
    const db = (env as any).DB;

    if (!db) {
      return NextResponse.json(
        { success: false, error: "Vendor database is not configured." },
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
        { success: false, error: "Vendor session not found." },
        { status: 401 }
      );
    }

    if (session.status !== "approved") {
      return NextResponse.json(
        { success: false, error: "Vendor account is not approved." },
        { status: 403 }
      );
    }

    if (Date.now() > new Date(session.expires_at).getTime()) {
      return NextResponse.json(
        { success: false, error: "Vendor session has expired." },
        { status: 401 }
      );
    }

    // Make sure this enquiry was actually assigned to this vendor.
    const assignment = await db
      .prepare(
        `
        SELECT id
        FROM enquiry_vendors
        WHERE enquiry_id = ?
          AND vendor_id = ?
        LIMIT 1
        `
      )
      .bind(enquiryId, vendorId)
      .first();

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Enquiry not found." },
        { status: 404 }
      );
    }

    const data = await request.json();

    const quotedQuantity = Number(data.quoted_quantity);
    const unitPrice = Number(data.unit_price);
    const moq =
      data.moq !== "" && data.moq != null
        ? Number(data.moq)
        : null;

    if (
      !Number.isFinite(quotedQuantity) ||
      quotedQuantity <= 0 ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0 ||
      !data.currency
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Quantity, unit price and currency are required.",
        },
        { status: 400 }
      );
    }

    if (moq !== null && (!Number.isFinite(moq) || moq < 0)) {
      return NextResponse.json(
        { success: false, error: "Invalid MOQ." },
        { status: 400 }
      );
    }

    const totalPrice = quotedQuantity * unitPrice;

    // One quotation per vendor per enquiry for V1.
    const existingQuote = await db
      .prepare(
        `
        SELECT id
        FROM vendor_quotes
        WHERE enquiry_id = ?
          AND vendor_id = ?
        LIMIT 1
        `
      )
      .bind(enquiryId, vendorId)
      .first();

    if (existingQuote) {
      return NextResponse.json(
        {
          success: false,
          error: "You have already submitted a quotation for this enquiry.",
        },
        { status: 409 }
      );
    }

    await db
      .prepare(
        `
        INSERT INTO vendor_quotes (
          enquiry_id,
          vendor_id,
          quoted_quantity,
          unit_price,
          currency,
          total_price,
          stock_available,
          lead_time,
          moq,
          condition,
          manufacturer_brand,
          country_of_origin,
          quote_validity,
          shipping_included,
          taxes_included,
          vendor_remarks,
          quotation_pdf,
          admin_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `
      )
      .bind(
        enquiryId,
        vendorId,
        quotedQuantity,
        unitPrice,
        data.currency,
        totalPrice,
        data.stock_available ? 1 : 0,
        data.lead_time || null,
        moq,
        data.condition || null,
        data.manufacturer_brand || null,
        data.country_of_origin || null,
        data.quote_validity || null,
        data.shipping_included || "no",
        data.taxes_included || "no",
        data.vendor_remarks || null,
        null
      )
      .run();

    await db
      .prepare(
        `
        UPDATE enquiry_vendors
        SET
          status = 'responded',
          responded_at = CURRENT_TIMESTAMP
        WHERE enquiry_id = ?
          AND vendor_id = ?
        `
      )
      .bind(enquiryId, vendorId)
      .run();

    return NextResponse.json({
      success: true,
      message: "Quotation submitted successfully.",
    });
  } catch (error) {
    console.error("Vendor quotation error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to submit quotation.",
      },
      { status: 500 }
    );
  }
}