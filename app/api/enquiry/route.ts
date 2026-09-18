import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAdminEmail, sendUserEmail } from "@/lib/send-admin-email";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

function normalizePartNumber(value: string | null | undefined) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\s-]+/g, "")
    .trim();
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const { error } = await supabase.from("enquiries").insert([data]);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // ---------------------------------------------
    // SAVE ENQUIRY ITEMS TO D1 + MATCH VENDORS
    // ---------------------------------------------

    try {
      const { env } = getRequestContext();
      const db = (env as any).DB;

      if (db && Array.isArray(data.items)) {
        for (const item of data.items) {
          const productName = item.title?.trim() || null;
          const partNumber = item.partNumber?.trim() || null;
          const normalizedPartNumber = normalizePartNumber(partNumber);
          const productHandle = item.handle?.trim() || null;
          const quantity = String(item.quantity || "");

          const enquiryResult = await db
            .prepare(
              `
            INSERT INTO enquiries (
              customer_name,
              customer_email,
              customer_phone,
              company_name,
              product_name,
              part_number,
              product_handle,
              quantity,
              message,
              status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
            `
            )
            .bind(
              data.name,
              data.email,
              data.phone || null,
              data.company || null,
              productName,
              partNumber,
              productHandle,
              quantity,
              data.message || null
            )
            .run();

          const enquiryId = enquiryResult.meta?.last_row_id;

          if (!enquiryId) {
            continue;
          }

          const normalizedProductName = normalizePartNumber(productName);

          let matchingVendors;

          if (normalizedPartNumber || normalizedProductName) {
            matchingVendors = await db
              .prepare(
                `
                SELECT DISTINCT v.id AS vendor_id
                FROM vendors v
                JOIN vendor_products vp
                  ON vp.vendor_id = v.id
                WHERE v.status = 'approved'
                  AND vp.status = 'approved'
                  AND (
                    LOWER(
                      REPLACE(
                        REPLACE(TRIM(COALESCE(vp.part_number, '')), '-', ''),
                        ' ',
                        ''
                      )
                    ) IN (?, ?)

                    OR

                    LOWER(
                      REPLACE(
                        REPLACE(TRIM(COALESCE(vp.product_name, '')), '-', ''),
                        ' ',
                        ''
                      )
                    ) IN (?, ?)
                  )
                `
              )
              .bind(
                normalizedPartNumber,
                normalizedProductName,
                normalizedPartNumber,
                normalizedProductName
              )
              .all();
          }

          const vendors = matchingVendors?.results || [];

          for (const vendor of vendors) {
            await db
              .prepare(
                `
              INSERT OR IGNORE INTO enquiry_vendors (
                enquiry_id,
                vendor_id,
                status
              )
              VALUES (?, ?, 'sent')
              `
              )
              .bind(
                enquiryId,
                vendor.vendor_id
              )
              .run();
          }
        }
      }
    } catch (d1Error) {
      console.error("D1 enquiry matching error:", d1Error);
    }

    const emailData = {
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      message: data.message,
      products: Array.isArray(data.items) ? data.items : [],
    };

    const [adminEmailResult, customerEmailResult] =
      await Promise.allSettled([
        sendAdminEmail({
          subject: "Product Enquiry - Sparesco",
          title: "Product Enquiry",
          data: emailData,
        }),

        sendUserEmail({
          to: data.email,
          subject: "Product Enquiry Received - Sparesco",
          title: "Product Enquiry Received",
          data: emailData,
        }),
      ]);

    console.log("Admin Email:", adminEmailResult);
    console.log("Customer Email:", customerEmailResult);

    if (adminEmailResult.status === "rejected") {
      console.error("Admin email error:", adminEmailResult.reason);
    }

    if (customerEmailResult.status === "rejected") {
      console.error("Customer email error:", customerEmailResult.reason);
    }

    return NextResponse.json({
      success: true,
      adminEmail: adminEmailResult.status,
      customerEmail: customerEmailResult.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}