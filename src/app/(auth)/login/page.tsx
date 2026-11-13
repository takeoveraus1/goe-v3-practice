import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui/card";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, isDemoMode } from "@/config/demo";
import { getCurrentUser } from "@/lib/auth/dal";
import { homePathFor } from "@/lib/auth/session-token";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));
  const showDemo = isDemoMode();

  return (
    <>
      <Card className="p-6 sm:p-8">
        <h1 className="text-xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-3">Log in to your athlete or coach dashboard.</p>
        <LoginForm demo={showDemo ? { accounts: DEMO_ACCOUNTS, password: DEMO_PASSWORD } : undefined} />
      </Card>
      <p className="mt-6 text-center text-sm text-ink-3">
        New here?{" "}
        <Link href="/register" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
