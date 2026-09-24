import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

function getVendorCookie(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";

  const vendorCookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("sparesco_vendor="));

  if (!vendorCookie) return null;

  const cookieValue = decodeURIComponent(
    vendorCookie.split("=")[1] || ""
  );

  const [vendorIdRaw, sessionToken] = cookieValue.split(":");

  const vendorId = Number(vendorIdRaw);

  if (!vendorId || !sessionToken) return null;

  return {
    vendorId,
    sessionToken,
  };
}

export async function GET(request: Request) {
  try {
    const vendorSession = getVendorCookie(request);

    if (!vendorSession) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor login required.",
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
      .bind(
        vendorSession.vendorId,
        vendorSession.sessionToken
      )
      .first();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid vendor session.",
        },
        { status: 401 }
      );
    }

    if (Date.now() > new Date(session.expires_at).getTime()) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor session has expired.",
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

    const productsResult = await db
      .prepare(
        `
        SELECT
          id,
          product_name,
          part_number,
          brand,
          category,
          description,
          price,
currency,
stock_quantity,
application,
godown_location,
lead_time,
status,
admin_notes,
created_at
        FROM vendor_products
        WHERE vendor_id = ?
        ORDER BY id DESC
        `
      )
      .bind(session.vendor_id)
      .all();

    return NextResponse.json({
      success: true,
      products: productsResult.results || [],
    });
  } catch (error) {
    console.error("Vendor products fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load vendor products.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // ---------------------------------------------
    // CHECK VENDOR LOGIN
    // ---------------------------------------------

    const vendorSession = getVendorCookie(request);

    if (!vendorSession) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor login required.",
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
          v.status,
          v.product_limit
        FROM vendor_sessions vs
        JOIN vendors v
          ON v.id = vs.vendor_id
        WHERE vs.vendor_id = ?
          AND vs.session_token = ?
        LIMIT 1
        `
      )
      .bind(
        vendorSession.vendorId,
        vendorSession.sessionToken
      )
      .first();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid vendor session.",
        },
        { status: 401 }
      );
    }

    if (Date.now() > new Date(session.expires_at).getTime()) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor session has expired.",
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

    // ---------------------------------------------
    // CHECK PRODUCT LIMIT
    // ---------------------------------------------

    const productCountResult = await db
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM vendor_products
        WHERE vendor_id = ?
        `
      )
      .bind(session.vendor_id)
      .first();

    const productsSubmitted = Number(
      productCountResult?.total || 0
    );

    const productLimit = Number(session.product_limit || 0);

    if (productsSubmitted >= productLimit) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You have reached your current product submission limit.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------
    // PRODUCT DATA
    // ---------------------------------------------

    const body = await request.json();

    const productName = body.product_name?.trim();
    const partNumber = body.part_number?.trim();
    const brand = body.brand?.trim();
    const category = body.category?.trim();

    const description = body.description?.trim() || null;
    const price = body.price?.trim() || null;
    const currency = body.currency?.trim() || "INR";

    const stockQuantity =
      body.stock_quantity === "" ||
        body.stock_quantity === null ||
        body.stock_quantity === undefined
        ? null
        : Number(body.stock_quantity);

    const application = body.application?.trim() || null;
    const godownLocation = body.godown_location?.trim() || null;
    const leadTime = body.lead_time?.trim() || null;

    if (
      stockQuantity !== null &&
      (!Number.isInteger(stockQuantity) || stockQuantity < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Stock quantity must be a whole number of 0 or more.",
        },
        { status: 400 }
      );
    }

    if (
      !productName ||
      !partNumber ||
      !brand ||
      !category
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Product name, part number, brand and category are required.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // INSERT PRODUCT
    // ---------------------------------------------

    const result = await db
      .prepare(
        `
    INSERT INTO vendor_products (
      vendor_id,
      product_name,
      part_number,
      brand,
      category,
      description,
      price,
      currency,
      stock_quantity,
      application,
      godown_location,
      lead_time,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `
      )
      .bind(
        session.vendor_id,
        productName,
        partNumber,
        brand,
        category,
        description,
        price,
        currency,
        stockQuantity,
        application,
        godownLocation,
        leadTime
      )
      .run();

    // Keep vendor counter synchronized with actual submissions
    await db
      .prepare(
        `
        UPDATE vendors
        SET
          products_submitted = (
            SELECT COUNT(*)
            FROM vendor_products
            WHERE vendor_id = ?
          ),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `
      )
      .bind(
        session.vendor_id,
        session.vendor_id
      )
      .run();

    return NextResponse.json({
      success: true,
      message:
        "Product submitted successfully and is pending admin approval.",
      productId: result.meta?.last_row_id,
    });
  } catch (error) {
    console.error("Vendor product submission error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to submit product.",
      },
      { status: 500 }
    );
  }
}