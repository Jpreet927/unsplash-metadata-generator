import { BACKEND_URL } from "@/lib/backend";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect(`${BACKEND_URL}/login`);
}
