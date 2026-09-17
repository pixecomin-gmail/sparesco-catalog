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
    const status = body.status;

    if (!["accepted", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid quotation status." },
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
      .prepare(`
        SELECT id, enquiry_id, vendor_id, admin_status
        FROM vendor_quotes
        WHERE id = ?
        LIMIT 1
      `)
      .bind(quoteId)
      .first();

    if (!quote) {
      return NextResponse.json(
        { error: "Quotation not found." },
        { status: 404 }
      );
    }

    await db
      .prepare(`
        UPDATE vendor_quotes
        SET admin_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(status, quoteId)
      .run();

    return NextResponse.json({
      success: true,
      message:
        status === "accepted"
          ? "Quotation accepted successfully."
          : "Quotation rejected successfully.",
    });
  } catch (error) {
    console.error("Admin quotation update error:", error);

    return NextResponse.json(
      { error: "Unable to update quotation." },
      { status: 500 }
    );
  }
}