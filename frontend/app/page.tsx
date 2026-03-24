import { Dashboard } from "@/components/dashboard";
import { hasBackendSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  if (!(await hasBackendSession())) {
    redirect("/login");
  }

  return <Dashboard />;
}
