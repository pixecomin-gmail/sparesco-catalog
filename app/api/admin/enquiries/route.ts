import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET() {
  try {
    const { env } = getRequestContext();
    const DB = (env as any).DB;

    if (!DB) {
      return NextResponse.json(
        { error: "Database binding not found." },
        { status: 500 }
      );
    }

    const result = await DB.prepare(`
      SELECT
        e.id,
        e.customer_name,
        e.customer_email,
        e.customer_phone,
        e.company_name,
        e.product_name,
        e.part_number,
        e.product_handle,
        e.quantity,
        e.message,
        e.status,
        e.created_at,

        COUNT(DISTINCT ev.vendor_id) AS matched_vendors,

        COUNT(
          DISTINCT CASE
            WHEN ev.responded_at IS NOT NULL THEN ev.vendor_id
          END
        ) AS responded_vendors

      FROM enquiries e

      LEFT JOIN enquiry_vendors ev
        ON ev.enquiry_id = e.id

      GROUP BY e.id

      ORDER BY e.id DESC
    `).all();

    return NextResponse.json({
      success: true,
      enquiries: result.results || [],
    });
  } catch (error) {
    console.error("Admin enquiries error:", error);

    return NextResponse.json(
      { error: "Unable to load enquiries." },
      { status: 500 }
    );
  }
}