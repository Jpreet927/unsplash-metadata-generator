import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { hasBackendSession } from "@/lib/session";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams?: Promise<{
    auth?: string;
    reason?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await hasBackendSession()) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const authError =
    resolvedSearchParams?.auth === "error"
      ? (resolvedSearchParams.reason ?? "Unsplash sign-in failed.")
      : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12 md:px-10">
      <Card className="relative w-full overflow-hidden p-8 md:p-12">
        <p className="text-xs uppercase tracking-[0.28em] text-muted">
          Unsplash Metadata Generator
        </p>
        <CardTitle className="mt-5 max-w-2xl text-4xl leading-tight md:text-5xl">
          Sign in with Unsplash before opening the dashboard.
        </CardTitle>
        <CardDescription className="mt-4 max-w-xl text-base leading-7">
          Authentication happens through Unsplash OAuth. Once the backend
          creates the session cookie, you will be redirected straight to the
          dashboard.
        </CardDescription>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-[0_16px_30px_-18px_rgba(31,111,95,0.9)] transition hover:brightness-105"
            href="/api/login"
          >
            Continue with Unsplash
          </a>
          <p className="text-sm text-muted">
            You will return to the app after consent.
          </p>
        </div>
        {authError ? (
          <p className="mt-6 text-sm font-medium text-red-700">{authError}</p>
        ) : null}
      </Card>
    </main>
  );
}
