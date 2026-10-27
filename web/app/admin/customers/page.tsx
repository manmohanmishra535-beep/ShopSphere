import Link from "next/link";
import { Search, Users } from "lucide-react";
import { getCurrentUser, getCustomers } from "@/lib/api";
import { PageHeader } from "@/components/admin/page-header";
import { CustomerTable } from "@/components/admin/customer-table";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/format";

export const metadata = { title: "Customers" };

const roles = [
  { key: "all", label: "Everyone" },
  { key: "customer", label: "Customers" },
  { key: "admin", label: "Admins" },
];

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const role = roles.some((item) => item.key === params.role) ? params.role! : "all";
  const [customers, user] = await Promise.all([getCustomers(q, role), getCurrentUser()]);
  const spend = customers.reduce((sum, row) => sum + row.totalSpend, 0);

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Customers"
        description="Every account, what they've spent and who can access the admin console."
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-bg p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted">Accounts shown</p>
          <p className="price-num mt-1 text-xl font-semibold">{customers.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-bg p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted">Lifetime spend</p>
          <p className="price-num mt-1 text-xl font-semibold">{formatINR(spend)}</p>
        </div>
        <div className="rounded-xl border border-border bg-bg p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted">Admins</p>
          <p className="price-num mt-1 text-xl font-semibold">{customers.filter((row) => row.role === "admin").length}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
          {roles.map((item) => {
            const active = item.key === role;
            return (
              <Link
                key={item.key}
                href={`/admin/customers${item.key === "all" ? "" : `?role=${item.key}`}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-medium transition-colors",
                  active ? "border-primary text-primary" : "border-transparent text-muted hover:text-text"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <form action="/admin/customers" className="flex items-center gap-2">
          {role !== "all" ? <input type="hidden" name="role" value={role} /> : null}
          <label htmlFor="customer-search" className="sr-only">Search customers</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              id="customer-search"
              name="q"
              defaultValue={q}
              placeholder="Name or email…"
              className="h-9 w-full rounded-lg border border-border bg-bg pl-8 pr-3 text-[13px] placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:w-56"
            />
          </div>
          <button type="submit" className="h-9 rounded-lg border border-border bg-bg px-3 text-[13px] font-medium transition-colors hover:bg-surface">
            Search
          </button>
        </form>
      </div>

      {customers.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-bg px-6 py-14 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-surface text-muted">
            <Users className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold">No accounts found</p>
          <p className="mt-1 text-xs text-muted">Try a different search or role filter.</p>
        </div>
      ) : (
        <CustomerTable initial={customers} currentUserId={user?.id ?? ""} />
      )}
    </div>
  );
}
