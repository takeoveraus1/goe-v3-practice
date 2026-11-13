import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { homePathFor } from "@/lib/auth/session-token";

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? homePathFor(user.role) : "/login");
}
