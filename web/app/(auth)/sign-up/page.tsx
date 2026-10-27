import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentUser } from "@/lib/api";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a ShopSphere account for faster checkout, order tracking and wishlists.",
};

function safeNext(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const user = await getCurrentUser();
  if (user) redirect(next);

  return (
    <AuthShell>
      <AuthForm mode="sign-up" next={next} />
    </AuthShell>
  );
}
