import { BACKEND_URL } from "@/lib/backend";
import { cookies } from "next/headers";

export async function hasBackendSession() {
  const cookieStore = await cookies();

  try {
    const response = await fetch(`${BACKEND_URL}/session`, {
      headers: {
        cookie: cookieStore.toString(),
      },
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  }
}
