import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const quoteId = Number(id);

    if (!quoteId) {
      return NextResponse.json(
        { error: "Invalid quotation ID." },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (body.action !== "mark_viewed") {
      return NextResponse.json(
        { error: "Invalid quotation action." },
        { status: 400 }
      );
    }

    const { env } = getRequestContext();
    const db = (env as any).DB;

    if (!db) {
      return NextResponse.json(
        { error: "Database binding not found." },
        { status: 500 }
      );
    }

    const quote = await db
      .prepare(
        `
        SELECT
          id,
          admin_viewed_at
        FROM vendor_quotes
        WHERE id = ?
        LIMIT 1
        `
      )
      .bind(quoteId)
      .first();

    if (!quote) {
      return NextResponse.json(
        { error: "Quotation not found." },
        { status: 404 }
      );
    }

    /*
     * Keep the original viewed time if this quotation
     * has already been opened by Admin.
     */
    if (!quote.admin_viewed_at) {
      await db
        .prepare(
          `
          UPDATE vendor_quotes
          SET
            admin_viewed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          `
        )
        .bind(quoteId)
        .run();
    }

    return NextResponse.json({
      success: true,
      message: "Quotation marked as viewed.",
    });
  } catch (error) {
    console.error(
      "Admin quotation viewed update error:",
      error
    );

    return NextResponse.json(
      { error: "Unable to update quotation." },
      { status: 500 }
    );
  }
}