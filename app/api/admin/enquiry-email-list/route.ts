import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizeCategory(value: unknown) {
  return String(value || "").trim();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* =========================
   GET EMAIL LIST + CATEGORIES
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

    const recipientsResult = await db
      .prepare(
        `
        SELECT
          r.id,
          r.email,
          r.is_active,
          r.created_at
        FROM enquiry_email_recipients r
        ORDER BY r.id DESC
        `
      )
      .all();

    const categoriesResult = await db
      .prepare(
        `
        SELECT
          id,
          name,
          is_active,
          created_at
        FROM enquiry_email_categories
        ORDER BY name COLLATE NOCASE ASC
        `
      )
      .all();

    const linksResult = await db
      .prepare(
        `
        SELECT
          recipient_id,
          category_id
        FROM enquiry_email_recipient_categories
        `
      )
      .all();

    const links = linksResult.results || [];

    const recipients = (recipientsResult.results || []).map(
      (recipient: any) => ({
        ...recipient,
        category_ids: links
          .filter(
            (link: any) =>
              Number(link.recipient_id) === Number(recipient.id)
          )
          .map((link: any) => Number(link.category_id)),
      })
    );

    return NextResponse.json({
      success: true,
      recipients,
      categories: categoriesResult.results || [],
    });
  } catch (error) {
    console.error("Admin enquiry email list error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load enquiry email list.",
      },
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

    const action = String(body.action || "add_recipient");

    /* =========================
       ADD CATEGORY
    ========================= */

    if (action === "add_category") {
      const name = normalizeCategory(body.name);

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            error: "Please enter a category name.",
          },
          { status: 400 }
        );
      }

      const existing = await db
        .prepare(
          `
          SELECT id
          FROM enquiry_email_categories
          WHERE LOWER(name) = LOWER(?)
          LIMIT 1
          `
        )
        .bind(name)
        .first();

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: "This category already exists.",
          },
          { status: 409 }
        );
      }

      const result = await db
        .prepare(
          `
          INSERT INTO enquiry_email_categories (
            name,
            is_active
          )
          VALUES (?, 1)
          `
        )
        .bind(name)
        .run();

      return NextResponse.json({
        success: true,
        id: result.meta?.last_row_id,
        message: "Category added successfully.",
      });
    }

    /* =========================
       ADD RECIPIENT
    ========================= */

    const email = normalizeEmail(body.email);

    const categoryIds = Array.isArray(body.category_ids)
      ? body.category_ids
          .map((value: unknown) => Number(value))
          .filter(
            (value: number) =>
              Number.isInteger(value) && value > 0
          )
      : [];

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid email address.",
        },
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
        {
          success: false,
          error: "This email address is already in the list.",
        },
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

    const recipientId = Number(result.meta?.last_row_id);

    for (const categoryId of categoryIds) {
      await db
        .prepare(
          `
          INSERT OR IGNORE INTO enquiry_email_recipient_categories (
            recipient_id,
            category_id
          )
          VALUES (?, ?)
          `
        )
        .bind(recipientId, categoryId)
        .run();
    }

    return NextResponse.json({
      success: true,
      id: recipientId,
      message: "Email added successfully.",
    });
  } catch (error) {
    console.error("Add enquiry email error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to add email address.",
      },
      { status: 500 }
    );
  }
}

/* =========================
   UPDATE
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

    const action = String(body.action || "toggle_recipient");

    /* =========================
       UPDATE RECIPIENT CATEGORIES
    ========================= */

    if (action === "update_categories") {
      const recipientId = Number(body.id);

      const categoryIds = Array.isArray(body.category_ids)
        ? body.category_ids
            .map((value: unknown) => Number(value))
            .filter(
              (value: number) =>
                Number.isInteger(value) && value > 0
            )
        : [];

      if (!Number.isInteger(recipientId) || recipientId <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid recipient.",
          },
          { status: 400 }
        );
      }

      await db
        .prepare(
          `
          DELETE FROM enquiry_email_recipient_categories
          WHERE recipient_id = ?
          `
        )
        .bind(recipientId)
        .run();

      for (const categoryId of categoryIds) {
        await db
          .prepare(
            `
            INSERT OR IGNORE INTO enquiry_email_recipient_categories (
              recipient_id,
              category_id
            )
            VALUES (?, ?)
            `
          )
          .bind(recipientId, categoryId)
          .run();
      }

      return NextResponse.json({
        success: true,
        message: "Recipient categories updated.",
      });
    }

    /* =========================
       CATEGORY ACTIVE / INACTIVE
    ========================= */

    if (action === "toggle_category") {
      const id = Number(body.id);
      const isActive =
        body.is_active === true || body.is_active === 1;

      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid category.",
          },
          { status: 400 }
        );
      }

      await db
        .prepare(
          `
          UPDATE enquiry_email_categories
          SET is_active = ?
          WHERE id = ?
          `
        )
        .bind(isActive ? 1 : 0, id)
        .run();

      return NextResponse.json({
        success: true,
        message: isActive
          ? "Category activated."
          : "Category deactivated.",
      });
    }

    /* =========================
       RECIPIENT ACTIVE / INACTIVE
    ========================= */

    const id = Number(body.id);

    const isActive =
      body.is_active === true || body.is_active === 1;

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid recipient.",
        },
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
      message: isActive
        ? "Recipient activated."
        : "Recipient deactivated.",
    });
  } catch (error) {
    console.error("Update enquiry email error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to update enquiry email settings.",
      },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE
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

    const action = String(body.action || "delete_recipient");
    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            action === "delete_category"
              ? "Invalid category."
              : "Invalid recipient.",
        },
        { status: 400 }
      );
    }

    /* =========================
       DELETE CATEGORY
    ========================= */

    if (action === "delete_category") {
      await db
        .prepare(
          `
          DELETE FROM enquiry_email_recipient_categories
          WHERE category_id = ?
          `
        )
        .bind(id)
        .run();

      await db
        .prepare(
          `
          DELETE FROM enquiry_email_categories
          WHERE id = ?
          `
        )
        .bind(id)
        .run();

      return NextResponse.json({
        success: true,
        message: "Category removed successfully.",
      });
    }

    /* =========================
       DELETE RECIPIENT
    ========================= */

    await db
      .prepare(
        `
        DELETE FROM enquiry_email_recipient_categories
        WHERE recipient_id = ?
        `
      )
      .bind(id)
      .run();

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
      {
        success: false,
        error: "Unable to remove enquiry email setting.",
      },
      { status: 500 }
    );
  }
}