import { BACKEND_URL } from "@/lib/backend";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const body = await request.json();

  const response = await fetch(`${BACKEND_URL}/photos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: requestHeaders.get("cookie") ?? "",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json",
    },
  });
}
