import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAdminEmail, sendUserEmail } from "@/lib/send-admin-email";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;

    const supabaseServiceKey =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SECRET;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables.", {
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasSupabaseSecret: Boolean(supabaseServiceKey),
      });

      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error. Please contact support.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const payload = {
      form_type: String(body.formType || "").trim(),
      name: String(body.name || "").trim(),
      email: String(body.email || "").trim().toLowerCase(),
      phone: String(body.phone || "").trim(),
      role: String(body.role || "").trim(),
      message: String(body.message || "").trim(),
    };

    if (
      !payload.form_type ||
      !payload.name ||
      !payload.email ||
      !payload.phone
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please fill all required fields.",
        },
        { status: 400 }
      );
    }

    if (!/^\S+@\S+\.\S+$/.test(payload.email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (payload.form_type === "contact" && !payload.role) {
      return NextResponse.json(
        {
          success: false,
          error: "Please select whether you are a buyer or seller.",
        },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: databaseError } = await supabase
      .from("website_form_submissions")
      .insert(payload);

    if (databaseError) {
      console.error("Supabase website form error:", databaseError);

      return NextResponse.json(
        {
          success: false,
          error: "Unable to save your submission. Please try again.",
        },
        { status: 500 }
      );
    }

    const isSupplier = payload.form_type === "supplier";

    const adminEmailResult = await sendAdminEmail({
      subject: isSupplier
        ? "Registration - Sparesco"
        : "Contact Form Submission - Sparesco",
      title: isSupplier
        ? "Supplier Registration"
        : "Contact Form Submission",
      data: payload,
    });

    const customerEmailResult = await sendUserEmail({
      to: payload.email,
      subject: isSupplier
        ? "Registration Received - Sparesco"
        : "Enquiry Received - Sparesco",
      title: isSupplier
        ? "Registration Received"
        : "Enquiry Received",
      data: payload,
    });

    console.log("Website form completed:", {
      formType: payload.form_type,
      databaseSaved: true,
      adminEmailResult,
      customerEmailResult,
    });

    return NextResponse.json({
      success: true,
      saved: true,
      adminEmailSent: true,
      customerEmailSent: true,
    });
  } catch (error) {
    console.error("Website form submission failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit form.",
      },
      { status: 500 }
    );
  }
}