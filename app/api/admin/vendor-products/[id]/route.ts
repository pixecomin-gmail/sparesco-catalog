import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

function normalizeMatchValue(value: string | null | undefined) {
  return String(value || "")
    .toLowerCase()
    .replace(/[\s-]+/g, "")
    .trim();
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const status = body.status;

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid product status.",
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
          error: "Database is not configured.",
        },
        { status: 500 }
      );
    }

    const product = await db
      .prepare(
        `
        SELECT
          id,
          vendor_id,
          product_name,
          part_number,
          status
        FROM vendor_products
        WHERE id = ?
        LIMIT 1
        `
      )
      .bind(productId)
      .first();

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor product not found.",
        },
        { status: 404 }
      );
    }

    await db
      .prepare(
        `
        UPDATE vendor_products
        SET
          status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `
      )
      .bind(status, productId)
      .run();

    // -------------------------------------------------
    // WHEN PRODUCT IS APPROVED, CHECK OPEN ENQUIRIES
    // -------------------------------------------------

    let matchedOpenEnquiries = 0;

    if (status === "approved") {
      const normalizedProductName = normalizeMatchValue(
        product.product_name as string | null
      );

      const normalizedPartNumber = normalizeMatchValue(
        product.part_number as string | null
      );

      if (normalizedProductName || normalizedPartNumber) {
        const matchingEnquiries = await db
          .prepare(
            `
        SELECT DISTINCT e.id
        FROM enquiries e
        WHERE e.status IN ('new', 'open')
          AND (
            LOWER(
              REPLACE(
                REPLACE(TRIM(COALESCE(e.product_name, '')), '-', ''),
                ' ',
                ''
              )
            ) IN (?, ?)

            OR

            LOWER(
              REPLACE(
                REPLACE(TRIM(COALESCE(e.part_number, '')), '-', ''),
                ' ',
                ''
              )
            ) IN (?, ?)
          )
        `
          )
          .bind(
            normalizedProductName,
            normalizedPartNumber,
            normalizedProductName,
            normalizedPartNumber
          )
          .all();

        const enquiries = matchingEnquiries.results || [];

        for (const enquiry of enquiries) {
          const result = await db
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
              enquiry.id,
              product.vendor_id
            )
            .run();

          if ((result.meta?.changes || 0) > 0) {
            matchedOpenEnquiries++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message:
        status === "approved"
          ? "Product approved successfully."
          : "Product rejected successfully.",
      matchedOpenEnquiries:
        status === "approved" ? matchedOpenEnquiries : 0,
    });
  } catch (error) {
    console.error("Admin vendor product update error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update vendor product.",
      },
      { status: 500 }
    );
  }
}