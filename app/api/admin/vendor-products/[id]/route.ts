import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

import {
  sendVendorProductApprovedEmail,
  sendVendorProductApprovedAdminEmail,
  sendVendorProductRejectedEmail,
  sendVendorProductRejectedAdminEmail,
} from "@/lib/send-admin-email";

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

    if (body.action === "cancel_delete") {
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
          SELECT id
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
            delete_requested = 0,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          `
        )
        .bind(productId)
        .run();

      return NextResponse.json({
        success: true,
        message: "Deletion request declined. The product has been kept.",
      });
    }

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

          v.company_name,
          v.contact_person,
          v.email,
          v.phone

        FROM vendor_products vp

        LEFT JOIN vendors v
          ON v.id = vp.vendor_id

        WHERE vp.id = ?
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

    /*
 * Product status has already been updated successfully.
 * Email failures must NOT cause approval/rejection to fail.
 */
    try {
      const emailData = {
        vendorId: Number(product.vendor_id),
        companyName: String(product.company_name || ""),
        contactPerson: String(product.contact_person || ""),
        email: String(product.email || ""),
        phone: String(product.phone || ""),

        productId: Number(product.id),
        productName: String(product.product_name || ""),
        partNumber: String(product.part_number || ""),
        brand: String(product.brand || ""),
        category: String(product.category || ""),
        description: product.description
          ? String(product.description)
          : null,
        price:
          product.price !== null &&
            product.price !== undefined
            ? String(product.price)
            : null,
        currency: String(product.currency || "INR"),
        stockQuantity:
          product.stock_quantity !== null &&
            product.stock_quantity !== undefined
            ? Number(product.stock_quantity)
            : null,
        application: product.application
          ? String(product.application)
          : null,
        godownLocation: product.godown_location
          ? String(product.godown_location)
          : null,
        leadTime: product.lead_time
          ? String(product.lead_time)
          : null,
      };

      if (status === "approved") {
        await Promise.all([
          sendVendorProductApprovedEmail(emailData),
          sendVendorProductApprovedAdminEmail(emailData),
        ]);
      } else {
        await Promise.all([
          sendVendorProductRejectedEmail(emailData),
          sendVendorProductRejectedAdminEmail(emailData),
        ]);
      }
    } catch (emailError) {
      console.error(
        "Vendor product status email error:",
        emailError
      );
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

export async function DELETE(
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
          delete_requested
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

    if (Number(product.delete_requested) !== 1) {
      return NextResponse.json(
        {
          success: false,
          error: "This product does not have a pending deletion request.",
        },
        { status: 400 }
      );
    }

    const vendorId = Number(product.vendor_id);

    await db
      .prepare(
        `
        DELETE FROM vendor_products
        WHERE id = ?
        `
      )
      .bind(productId)
      .run();

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
      .bind(vendorId, vendorId)
      .run();

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Admin vendor product deletion error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to delete vendor product.",
      },
      { status: 500 }
    );
  }
}