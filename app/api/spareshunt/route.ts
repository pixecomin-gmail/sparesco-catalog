import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAdminEmail, sendUserEmail } from "@/lib/send-admin-email";

export const runtime = "edge";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const photo = formData.get("photo") as File | null;
    let photoUrl = "";

    if (photo && photo.size > 0) {
      if (photo.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: "Photo size must be less than 2MB." },
          { status: 400 }
        );
      }

      const fileExtension = photo.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("spares-hunt")
        .upload(fileName, photo, {
          contentType: photo.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("spares-hunt")
        .getPublicUrl(fileName);

      photoUrl = data.publicUrl;
    }

    const payload = {
      machine_category: String(formData.get("machineCategory") || "").trim(),
      machine_make: String(formData.get("machineMake") || "").trim(),
      machine_model: String(formData.get("machineModel") || "").trim(),
      year: String(formData.get("year") || "").trim(),
      serial_number: String(formData.get("serialNumber") || "").trim(),
      machine_country: String(formData.get("machineCountry") || "").trim(),
      machine_details: String(formData.get("machineDetails") || "").trim(),

      part_number: String(formData.get("partNumber") || "").trim(),
      part_name: String(formData.get("partName") || "").trim(),
      brand: String(formData.get("brand") || "").trim(),
      quantity_required: String(formData.get("quantityRequired") || "").trim(),
      condition: String(formData.get("condition") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      photo_url: photoUrl,

      name: String(formData.get("name") || "").trim(),
      company: String(formData.get("company") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      location: String(formData.get("location") || "").trim(),
      notes: String(formData.get("notes") || "").trim(),
    };

    if (
      !payload.machine_category ||
      !payload.part_number ||
      !payload.quantity_required ||
      !payload.name ||
      !payload.phone ||
      !payload.email
    ) {
      return NextResponse.json(
        { success: false, error: "Please fill all required fields." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("spares_hunt_requests")
      .insert(payload);

    if (error) throw error;

    await sendAdminEmail({
      subject: "Spares Hunt Request - Sparesco",
      title: "Spares Hunt Request",
      data: payload,
    });

    await sendUserEmail({
      to: payload.email,
      subject: "Spares Hunt Request Received - Sparesco",
      title: "Spares Hunt Request Received",
      data: payload,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit request.",
      },
      { status: 500 }
    );
  }
}