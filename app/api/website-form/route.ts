import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAdminEmail, sendUserEmail } from "@/lib/send-admin-email";

export const runtime = "nodejs";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const payload = {
      form_type: String(body.formType || "").trim(),
      name: String(body.name || "").trim(),
      email: String(body.email || "").trim(),
      phone: String(body.phone || "").trim(),
      role: String(body.role || "").trim(),
      message: String(body.message || "").trim(),
    };

    if (!payload.form_type || !payload.name || !payload.email || !payload.phone) {
      return NextResponse.json(
        { success: false, error: "Please fill all required fields." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("website_form_submissions")
      .insert(payload);

    if (error) throw error;

    const isSupplier = payload.form_type === "supplier";

    await sendAdminEmail({
      subject: isSupplier
        ? "Registration - Sparesco"
        : "Contact Form Submission - Sparesco",
      title: isSupplier ? "Supplier Registration" : "Contact Form Submission",
      data: payload,
    });

    await sendUserEmail({
      to: payload.email,
      subject: isSupplier
        ? "Registration Received - Sparesco"
        : "Enquiry Received - Sparesco",
      title: isSupplier ? "Registration Received" : "Enquiry Received",
      data: payload,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unable to submit form.",
      },
      { status: 500 }
    );
  }
}