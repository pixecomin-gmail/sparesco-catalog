import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

import {
  sendEnquiryListAdminSummaryEmail,
  sendEnquiryListEmail,
} from "@/lib/send-admin-email";

export const runtime = "edge";

function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
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

    const body = await request.json();

    const enquiryId = Number(body.enquiry_id);

    const categoryIds = Array.isArray(body.category_ids)
      ? body.category_ids
          .map((value: unknown) => Number(value))
          .filter(
            (value: number) =>
              Number.isInteger(value) && value > 0
          )
      : [];

    if (!Number.isInteger(enquiryId) || enquiryId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid enquiry.",
        },
        { status: 400 }
      );
    }

    if (categoryIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select at least one category.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // LOAD ENQUIRY
    // ---------------------------------------------

    const enquiry = await db
      .prepare(
        `
        SELECT
          id,
          enquiry_reference,
          batch_reference,
          customer_name,
          company_name,
          product_name,
          part_number,
          quantity,
          message,
          status
        FROM enquiries
        WHERE id = ?
        LIMIT 1
        `
      )
      .bind(enquiryId)
      .first();

    if (!enquiry) {
      return NextResponse.json(
        {
          success: false,
          error: "Enquiry not found.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------
    // LOAD ACTIVE RECIPIENTS FROM SELECTED
    // ACTIVE CATEGORIES
    // ---------------------------------------------

    const placeholders = categoryIds
      .map(() => "?")
      .join(", ");

    const recipientsResult = await db
      .prepare(
        `
        SELECT DISTINCT
          r.id,
          r.email
        FROM enquiry_email_recipients r
        JOIN enquiry_email_recipient_categories rc
          ON rc.recipient_id = r.id
        JOIN enquiry_email_categories c
          ON c.id = rc.category_id
        WHERE r.is_active = 1
          AND c.is_active = 1
          AND c.id IN (${placeholders})
        `
      )
      .bind(...categoryIds)
      .all();

    // ---------------------------------------------
    // DEDUPLICATE RECIPIENTS
    // ---------------------------------------------

    const uniqueEmails = new Map<string, string>();

    for (const recipient of recipientsResult.results || []) {
      const email = normalizeEmail(recipient.email);

      if (email && !uniqueEmails.has(email)) {
        uniqueEmails.set(email, email);
      }
    }

    const recipients = Array.from(
      uniqueEmails.values()
    );

    if (recipients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No active recipients were found for the selected categories.",
        },
        { status: 400 }
      );
    }

    const enquiryReference = String(
      enquiry.enquiry_reference ||
        enquiry.batch_reference ||
        `Enquiry #${enquiry.id}`
    );

    const productName = String(
      enquiry.product_name || "Not Provided"
    );

    const partNumber = String(
      enquiry.part_number || "Not Provided"
    );

    const quantity = String(
      enquiry.quantity || "Not Provided"
    );

    // ---------------------------------------------
    // SEND TO EVERY UNIQUE RECIPIENT
    // ---------------------------------------------

    const emailResults = await Promise.allSettled(
      recipients.map((email) =>
        sendEnquiryListEmail({
          to: email,
          enquiryReference,
          customerName: String(
            enquiry.customer_name || ""
          ),
          companyName: enquiry.company_name
            ? String(enquiry.company_name)
            : null,
          productName,
          partNumber,
          quantity,
          message: enquiry.message
            ? String(enquiry.message)
            : null,
        })
      )
    );

    const successfulEmails: string[] = [];
    const failedEmails: string[] = [];

    emailResults.forEach((result, index) => {
      const email = recipients[index];

      if (result.status === "fulfilled") {
        successfulEmails.push(email);
      } else {
        failedEmails.push(email);

        console.error(
          `Enquiry list email failed for ${email}:`,
          result.reason
        );
      }
    });

    // ---------------------------------------------
    // SEND DELIVERY SUMMARY TO ADMIN
    // ---------------------------------------------

    try {
      await sendEnquiryListAdminSummaryEmail({
        enquiryReference,
        productName,
        partNumber,
        quantity,
        successfulEmails,
        failedEmails,
      });
    } catch (adminEmailError) {
      /*
       * Recipient emails have already been processed.
       * Failure of the admin summary must not cause
       * the enquiry send itself to be reported as failed.
       */
      console.error(
        "Enquiry list admin summary email error:",
        adminEmailError
      );
    }

    // ---------------------------------------------
    // RESPONSE
    // ---------------------------------------------

    if (successfulEmails.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to send the enquiry to the selected recipients.",
          sent: 0,
          failed: failedEmails.length,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sent: successfulEmails.length,
      failed: failedEmails.length,
      message:
        failedEmails.length === 0
          ? `Enquiry sent successfully to ${
              successfulEmails.length
            } recipient${
              successfulEmails.length === 1
                ? ""
                : "s"
            }.`
          : `Enquiry sent to ${
              successfulEmails.length
            } recipient${
              successfulEmails.length === 1
                ? ""
                : "s"
            }. ${failedEmails.length} email${
              failedEmails.length === 1 ? "" : "s"
            } failed.`,
    });
  } catch (error) {
    console.error(
      "Send enquiry email list error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to send enquiry to the email list.",
      },
      { status: 500 }
    );
  }
}