import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

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

    const result = await db
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
      .all();

    return NextResponse.json({
      success: true,
      vendors: result.results || [],
    });
  } catch (error) {
    console.error("Admin vendors error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to load vendors." },
      { status: 500 }
    );
  }
}