import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/dal";
import { homePathFor } from "@/lib/auth/session-token";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const user = await getCurrentUser();
  if (user) redirect(homePathFor(user.role));
  const { code } = await searchParams;

  return (
    <>
      <Card className="p-6 sm:p-8">
        <h1 className="text-xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-ink-3">Athletes track their development. Coaches evaluate and guide it.</p>
        <RegisterForm defaultInviteCode={typeof code === "string" ? code : ""} />
      </Card>
      <p className="mt-6 text-center text-sm text-ink-3">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
