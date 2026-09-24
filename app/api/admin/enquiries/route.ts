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

       // Get all customer enquiries
    const enquiryResult = await DB.prepare(`
      SELECT
        e.id,
        e.enquiry_reference,
        e.batch_reference,
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

    // Get all vendor quotations
    const quoteResult = await DB.prepare(`
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
        v.phone AS vendor_phone

      FROM vendor_quotes q

      JOIN vendors v
        ON v.id = q.vendor_id

      ORDER BY q.id DESC
    `).all();

    const enquiries = enquiryResult.results || [];
    const quotes = quoteResult.results || [];

    // Put each quotation underneath its respective enquiry
    const enquiriesWithQuotes = enquiries.map((enquiry: any) => ({
      ...enquiry,

      quotations: quotes.filter(
        (quote: any) =>
          Number(quote.enquiry_id) === Number(enquiry.id)
      ),
    }));

    return NextResponse.json({
      success: true,
      enquiries: enquiriesWithQuotes,
    });
  } catch (error) {
    console.error("Admin enquiries error:", error);

    return NextResponse.json(
      { error: "Unable to load enquiries." },
      { status: 500 }
    );
  }
}