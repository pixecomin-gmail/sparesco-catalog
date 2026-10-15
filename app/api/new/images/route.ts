import { NextResponse } from "next/server";
export const runtime = "edge";
export const dynamic = "force-dynamic";
const unavailable = () => NextResponse.json({ error: "Product Studio storage is unavailable on this deployment." }, { status: 503, headers: { "Cache-Control": "no-store" } });
export const GET = unavailable;
export const POST = unavailable;
export const PUT = unavailable;
export const PATCH = unavailable;
export const DELETE = unavailable;
