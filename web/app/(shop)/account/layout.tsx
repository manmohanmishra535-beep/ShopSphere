import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AccountNav } from "@/components/account/account-nav";
import { getCurrentUser } from "@/lib/api";
import { initials } from "@/lib/format";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/account/orders");

  return (
    <div className="container-shop py-8 md:py-12">
      <div className="grid gap-8 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-12">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-white">
              {initials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>

          <div className="mt-4">
            <AccountNav />
          </div>

          <div className="mt-6 hidden space-y-1 border-t border-border pt-5 lg:block">
            {user.role === "admin" ? (
              <Link
                href="/admin"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-primary transition-colors hover:bg-primary-subtle"
              >
                <ShieldCheck className="h-4 w-4" /> Admin console
              </Link>
            ) : null}
            <Link
              href="/products"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-muted transition-colors hover:bg-surface hover:text-text"
            >
              <ArrowLeft className="h-4 w-4" /> Continue shopping
            </Link>
          </div>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
