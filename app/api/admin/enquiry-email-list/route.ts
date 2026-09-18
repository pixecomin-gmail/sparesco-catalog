import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* =========================
   GET EMAIL LIST
========================= */

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
          email,
          is_active,
          created_at
        FROM enquiry_email_recipients
        ORDER BY id DESC
        `
      )
      .all();

    return NextResponse.json({
      success: true,
      recipients: result.results || [],
    });
  } catch (error) {
    console.error("Admin enquiry email list error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to load enquiry email list." },
      { status: 500 }
    );
  }
}

/* =========================
   ADD EMAIL
========================= */

export async function POST(request: Request) {
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
    const email = normalizeEmail(body.email);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const existing = await db
      .prepare(
        `
        SELECT id
        FROM enquiry_email_recipients
        WHERE LOWER(email) = ?
        LIMIT 1
        `
      )
      .bind(email)
      .first();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "This email address is already in the list." },
        { status: 409 }
      );
    }

    const result = await db
      .prepare(
        `
        INSERT INTO enquiry_email_recipients (
          email,
          is_active
        )
        VALUES (?, 1)
        `
      )
      .bind(email)
      .run();

    return NextResponse.json({
      success: true,
      id: result.meta?.last_row_id,
      message: "Email added successfully.",
    });
  } catch (error) {
    console.error("Add enquiry email error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to add email address." },
      { status: 500 }
    );
  }
}

/* =========================
   ACTIVATE / DEACTIVATE
========================= */

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

    const id = Number(body.id);
    const isActive = body.is_active === true || body.is_active === 1;

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid recipient." },
        { status: 400 }
      );
    }

    await db
      .prepare(
        `
        UPDATE enquiry_email_recipients
        SET is_active = ?
        WHERE id = ?
        `
      )
      .bind(isActive ? 1 : 0, id)
      .run();

    return NextResponse.json({
      success: true,
      message: isActive ? "Recipient activated." : "Recipient deactivated.",
    });
  } catch (error) {
    console.error("Update enquiry email error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to update recipient." },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE EMAIL
========================= */

export async function DELETE(request: Request) {
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
    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid recipient." },
        { status: 400 }
      );
    }

    await db
      .prepare(
        `
        DELETE FROM enquiry_email_recipients
        WHERE id = ?
        `
      )
      .bind(id)
      .run();

    return NextResponse.json({
      success: true,
      message: "Email removed successfully.",
    });
  } catch (error) {
    console.error("Delete enquiry email error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to remove email address." },
      { status: 500 }
    );
  }
}