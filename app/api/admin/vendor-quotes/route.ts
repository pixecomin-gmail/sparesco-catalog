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
        q.id,
        q.enquiry_id,
        q.vendor_id,
        q.quoted_quantity,
        q.unit_price,
        q.currency,
        q.total_price,
        q.stock_available,
        q.lead_time,
        q.moq,
        q.condition,
        q.manufacturer_brand,
        q.country_of_origin,
        q.quote_validity,
        q.shipping_included,
        q.taxes_included,
        q.vendor_remarks,
        q.quotation_pdf,
        q.admin_status,
        q.submitted_at,
        q.updated_at,

        v.company_name AS vendor_company,
        v.contact_person AS vendor_contact,
        v.email AS vendor_email,
        v.phone AS vendor_phone,

        e.product_name,
        e.part_number,
        e.quantity AS requested_quantity,
        e.customer_name,
        e.customer_email,
        e.customer_phone,
        e.company_name AS customer_company

      FROM vendor_quotes q

      JOIN vendors v
        ON v.id = q.vendor_id

      JOIN enquiries e
        ON e.id = q.enquiry_id

      ORDER BY q.id DESC
    `).all();

    return NextResponse.json({
      success: true,
      quotes: result.results || [],
    });
  } catch (error) {
    console.error("Admin vendor quotes error:", error);

    return NextResponse.json(
      { error: "Unable to load vendor quotations." },
      { status: 500 }
    );
  }
}