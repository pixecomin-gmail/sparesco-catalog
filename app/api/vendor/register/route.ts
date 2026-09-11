import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      company_name,
      contact_person,
      email,
      phone,
      address,
      city,
      state,
      country,
      gst_number,
      website,
    } = body;

    // Required fields
    if (
      !company_name?.trim() ||
      !contact_person?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !gst_number?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Company name, contact person, email, contact number and GST / Tax Number are required.",
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
          error: "Vendor database is not configured.",
        },
        { status: 500 }
      );
    }

    const result = await db
      .prepare(
        `
        INSERT INTO vendors (
          company_name,
          contact_person,
          email,
          phone,
          address,
          city,
          state,
          country,
          gst_number,
          website,
          status,
          product_limit,
          products_submitted
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 10, 0)
        `
      )
      .bind(
        company_name.trim(),
        contact_person.trim(),
        email.trim().toLowerCase(),
        phone.trim(),
        address?.trim() || null,
        city?.trim() || null,
        state?.trim() || null,
        country?.trim() || null,
        gst_number.trim(),
        website?.trim() || null
      )
      .run();

    return NextResponse.json({
      success: true,
      vendorId: result.meta?.last_row_id,
      message: "Vendor application submitted successfully.",
    });
  } catch (error) {
    console.error("Vendor registration error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to submit vendor application.",
      },
      { status: 500 }
    );
  }
}