import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

import {
  sendVendorApprovedEmail,
  sendVendorApprovedAdminEmail,
  sendVendorRejectedEmail,
  sendVendorRejectedAdminEmail,
} from "@/lib/send-admin-email";

export const runtime = "edge";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const vendorId = Number(id);

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: "Invalid vendor ID." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, action } = body;

    if (
      action !== "increase_limit" &&
      !["approved", "rejected"].includes(status)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid request." },
        { status: 400 }
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

    if (action === "increase_limit") {
      await db
        .prepare(
          `
      UPDATE vendors
      SET
        product_limit = product_limit + 10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `
        )
        .bind(vendorId)
        .run();

      const vendor = await db
        .prepare(
          `
      SELECT product_limit
      FROM vendors
      WHERE id = ?
      `
        )
        .bind(vendorId)
        .first();

      return NextResponse.json({
        success: true,
        product_limit: vendor?.product_limit,
        message: "Product limit increased by 10.",
      });
    }

        await db
      .prepare(
        `
    UPDATE vendors
    SET
      status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `
      )
      .bind(status, vendorId)
      .run();

    /*
     * Get vendor details for the approval/rejection emails.
     */
    const vendor = await db
      .prepare(
        `
        SELECT
          id,
          company_name,
          contact_person,
          email,
          phone,
          gst_number,
          country,
          product_limit,
          status
        FROM vendors
        WHERE id = ?
        LIMIT 1
        `
      )
      .bind(vendorId)
      .first();

    /*
     * Status has already been updated successfully.
     * An email failure must NOT fail the approval/rejection action.
     */
    if (vendor) {
      try {
        const emailData = {
          vendorId,
          companyName: String(vendor.company_name || ""),
          contactPerson: String(vendor.contact_person || ""),
          email: String(vendor.email || ""),
          phone: String(vendor.phone || ""),
          gstNumber: String(vendor.gst_number || ""),
          country: String(vendor.country || ""),
          productLimit: Number(vendor.product_limit || 10),
        };

        if (status === "approved") {
          await Promise.all([
            sendVendorApprovedEmail(emailData),
            sendVendorApprovedAdminEmail(emailData),
          ]);
        }

        if (status === "rejected") {
          await Promise.all([
            sendVendorRejectedEmail(emailData),
            sendVendorRejectedAdminEmail(emailData),
          ]);
        }
      } catch (emailError) {
        console.error(
          "Vendor status email error:",
          emailError
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Vendor ${status} successfully.`,
    });
  } catch (error) {
    console.error("Vendor status update error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to update vendor status." },
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
    const vendorId = Number(id);

    if (!Number.isSafeInteger(vendorId) || vendorId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid vendor ID." },
        { status: 400 }
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

    const body = await request.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Vendor email is required." },
        { status: 400 }
      );
    }

    const vendor = await db
      .prepare(
        `SELECT email FROM vendors WHERE id = ? LIMIT 1`
      )
      .bind(vendorId)
      .first();

    if (
      !vendor ||
      String(vendor.email || "").trim().toLowerCase() !== email
    ) {
      return NextResponse.json(
        { success: false, error: "Vendor email does not match." },
        { status: 409 }
      );
    }

    const matchingVendors = `
      SELECT id FROM vendors
      WHERE LOWER(TRIM(email)) = ?
    `;

    const statements = [
      db.prepare(
        `DELETE FROM vendor_quotes
         WHERE vendor_id IN (${matchingVendors})`
      ).bind(email),

      db.prepare(
        `DELETE FROM enquiry_vendors
         WHERE vendor_id IN (${matchingVendors})`
      ).bind(email),

      db.prepare(
        `DELETE FROM vendor_products
         WHERE vendor_id IN (${matchingVendors})`
      ).bind(email),

      db.prepare(
        `DELETE FROM vendor_sessions
         WHERE vendor_id IN (${matchingVendors})`
      ).bind(email),

      db.prepare(
        `DELETE FROM vendor_login_otps
         WHERE vendor_id IN (${matchingVendors})`
      ).bind(email),

      db.prepare(
        `DELETE FROM vendors
         WHERE LOWER(TRIM(email)) = ?`
      ).bind(email),
    ];

    await db.batch(statements);

    return NextResponse.json({
      success: true,
      message: `Vendor ${email} and associated records deleted successfully.`,
    });
  } catch (error) {
    console.error("Vendor deletion error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to delete vendor." },
      { status: 500 }
    );
  }
}
