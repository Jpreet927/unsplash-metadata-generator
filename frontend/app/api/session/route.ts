import { BACKEND_URL } from "@/lib/backend";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const requestHeaders = await headers();

  const response = await fetch(`${BACKEND_URL}/session`, {
    headers: {
      cookie: requestHeaders.get("cookie") ?? "",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { authenticated: false },
      { status: response.status },
    );
  }

  const payload = await response.json();
  return NextResponse.json(payload);
}
