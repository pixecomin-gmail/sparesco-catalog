import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET() {
  try {
    const { env } = getRequestContext();
    const db = (env as any).DB;

    if (!db) {
      return NextResponse.json(
        {
          success: false,
          error: "Database is not configured.",
        },
        { status: 500 }
      );
    }

    const result = await db
      .prepare(
        `
        SELECT
          vp.id,
          vp.vendor_id,
          vp.product_name,
          vp.part_number,
          vp.brand,
          vp.category,
          vp.description,
          vp.price,
          vp.currency,
          vp.stock_quantity,
          vp.application,
          vp.godown_location,
          vp.lead_time,
          vp.status,
          vp.admin_notes,
          vp.delete_requested,
          vp.created_at,
          v.company_name,
          v.contact_person,
          v.email
        FROM vendor_products vp
        JOIN vendors v
          ON v.id = vp.vendor_id
        ORDER BY vp.id DESC
        `
      )
      .all();

    return NextResponse.json({
      success: true,
      products: result.results || [],
    });
  } catch (error) {
    console.error("Admin vendor products error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load vendor products.",
      },
      { status: 500 }
    );
  }
}