import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAdminEmail, sendUserEmail } from "@/lib/send-admin-email";

export const runtime = "edge";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const { error } = await supabase.from("enquiries").insert([data]);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const itemsSummary = Array.isArray(data.items)
       ? data.items
      .map((item: any, index: number) => {
            return `${index + 1}. ${item.title || ""} | ${
              item.vendor || ""
            } | Qty: ${item.quantity || 1} | Price: ${
              Number(item.price) > 0
                ? `₹${Number(item.price).toLocaleString("en-IN")}`
                : "Price on Request"
            }`;
          })
          .join("\n")
      : "";

    const emailData = {
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      message: data.message,
      products: itemsSummary,
    };

   const [adminEmailResult, customerEmailResult] =
    await Promise.allSettled([
      sendAdminEmail({
        subject: "Product Enquiry - Sparesco",
        title: "Product Enquiry",
        data: emailData,
      }),

      sendUserEmail({
        to: data.email,
        subject: "Product Enquiry Received - Sparesco",
        title: "Product Enquiry Received",
        data: emailData,
      }),
    ]);

  console.log("Admin Email:", adminEmailResult);
  console.log("Customer Email:", customerEmailResult);

  if (adminEmailResult.status === "rejected") {
    console.error("Admin email error:", adminEmailResult.reason);
  }

  if (customerEmailResult.status === "rejected") {
    console.error("Customer email error:", customerEmailResult.reason);
  }

  return NextResponse.json({
    success: true,
    adminEmail: adminEmailResult.status,
    customerEmail: customerEmailResult.status,
  });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Server error",
      },
      { status: 500 }
    );
  }
}