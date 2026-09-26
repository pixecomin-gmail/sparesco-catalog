import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

const APPROVAL_SETTING_KEY = "vendor_registration_approval_required";

export async function GET() {
  try {
    const { env } = getRequestContext();
    const db = (env as any).DB;

    if (!db) {
      return NextResponse.json(
        { success: false, error: "Vendor database is not configured." },
        { status: 500 }
      );
    }

    const [vendorsResult, setting] = await Promise.all([
      db
        .prepare(
          `
          SELECT
            id,
            company_name,
            contact_person,
            email,
            phone,
            city,
            country,
            gst_number,
            status,
            product_limit,
            products_submitted,
            created_at
          FROM vendors
          ORDER BY id DESC
          `
        )
        .all(),

      db
        .prepare(
          `
          SELECT setting_value
          FROM platform_settings
          WHERE setting_key = ?
          LIMIT 1
          `
        )
        .bind(APPROVAL_SETTING_KEY)
        .first(),
    ]);

    return NextResponse.json({
      success: true,
      vendors: vendorsResult.results || [],
      approvalRequired: setting?.setting_value === "1",
    });
  } catch (error) {
    console.error("Admin vendors error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to load vendors." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { env } = getRequestContext();
    const db = (env as any).DB;

    if (!db) {
      return NextResponse.json(
        { success: false, error: "Vendor database is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (typeof body.approvalRequired !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Invalid approval setting." },
        { status: 400 }
      );
    }

    const settingValue = body.approvalRequired ? "1" : "0";

    await db
      .prepare(
        `
        INSERT INTO platform_settings (
          setting_key,
          setting_value,
          updated_at
        )
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(setting_key)
        DO UPDATE SET
          setting_value = excluded.setting_value,
          updated_at = CURRENT_TIMESTAMP
        `
      )
      .bind(APPROVAL_SETTING_KEY, settingValue)
      .run();

    return NextResponse.json({
      success: true,
      approvalRequired: body.approvalRequired,
    });
  } catch (error) {
    console.error("Vendor approval setting error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to update approval setting." },
      { status: 500 }
    );
  }
}