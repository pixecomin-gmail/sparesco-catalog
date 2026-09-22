import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(value: string) {
  return value.replace(/[\s\-().]/g, "");
}

function isValidInternationalPhone(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(normalizePhone(value));
}

function isIndia(value: string) {
  return value.trim().toLowerCase() === "india";
}

function isValidIndianGst(value: string) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
    value.trim().toUpperCase()
  );
}

function isValidWebsite(value: string) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const company_name = clean(body.company_name);
    const contact_person = clean(body.contact_person);
    const email = clean(body.email).toLowerCase();
    const phone = clean(body.phone);
    const gst_number = clean(body.gst_number).toUpperCase();

    const address = clean(body.address);
    const city = clean(body.city);
    const state = clean(body.state);
    const country = clean(body.country);
    const website = clean(body.website);

    if (
      !company_name ||
      !contact_person ||
      !email ||
      !phone ||
      !gst_number
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

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (!isValidInternationalPhone(phone)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter the contact number with country code, for example +91 98765 43210.",
        },
        { status: 400 }
      );
    }

    if (isIndia(country) && !isValidIndianGst(gst_number)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid 15-character Indian GSTIN.",
        },
        { status: 400 }
      );
    }

    if (!isValidWebsite(website)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid website URL.",
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
        company_name,
        contact_person,
        email,
        phone,
        address || null,
        city || null,
        state || null,
        country || null,
        gst_number,
        website || null
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