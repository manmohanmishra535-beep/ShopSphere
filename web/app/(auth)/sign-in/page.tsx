import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentUser } from "@/lib/api";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to ShopSphere to see your orders, wishlist and saved addresses.",
};

function safeNext(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const user = await getCurrentUser();
  if (user) redirect(user.role === "admin" && next === "/" ? "/admin" : next);

  return (
    <AuthShell>
      <AuthForm mode="sign-in" next={next} />
    </AuthShell>
  );
}
