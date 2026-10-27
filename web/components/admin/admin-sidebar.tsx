"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Boxes,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Store,
  Users,
  X,
} from "lucide-react";
import type { User } from "@/lib/types";
import { api } from "@/lib/client";
import { cn, initials } from "@/lib/format";

const groups = [
  {
    label: "Store",
    links: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes },
    ],
  },
  {
    label: "People",
    links: [
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
    ],
  },
  {
    label: "System",
    links: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

function NavContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Admin">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">{group.label}</p>
          <ul className="space-y-0.5">
            {group.links.map((link) => {
              const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-white/10 text-white shadow-[inset_2px_0_0_0_#818cf8]"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <link.icon className={cn("h-4 w-4", active ? "text-[#a5b4fc]" : "text-white/40")} strokeWidth={1.8} />
                    {link.label}
                    {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#a5b4fc]" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5" aria-label="ShopSphere admin">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#4f46e5] text-white">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="8.5" />
          <ellipse cx="12" cy="12" rx="8.5" ry="3.4" transform="rotate(-28 12 12)" opacity="0.8" />
          <circle cx="16.5" cy="7.4" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <div>
        <p className="text-[15px] font-semibold leading-tight tracking-[-0.02em] text-white">
          Shop<span className="text-[#a5b4fc]">Sphere</span>
        </p>
        <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">Admin console</p>
      </div>
    </Link>
  );
}

export function AdminSidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const logout = async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/");
    router.refresh();
  };

  const account = (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-semibold text-white ring-1 ring-white/15">
          {initials(user.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-white">{user.name}</p>
          <p className="truncate text-[10px] text-white/40">{user.email}</p>
        </div>
        <button
          onClick={() => void logout()}
          className="grid h-8 w-8 place-items-center rounded-md text-white/40 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-1 flex items-center justify-between px-1.5">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[10px] text-white/35 transition-colors hover:text-white/70"
        >
          <Store className="h-3 w-3" /> View storefront <ArrowUpRight className="h-2.5 w-2.5" />
        </Link>
        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/40">v1.0</span>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col border-r border-white/5 bg-[#0b1020] lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-4">
          <Brand />
        </div>
        <NavContent pathname={pathname} />
        {account}
      </aside>

      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-bg/90 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="8.5" />
              <ellipse cx="12" cy="12" rx="8.5" ry="3.4" transform="rotate(-28 12 12)" opacity="0.8" />
            </svg>
          </span>
          <span className="text-sm font-semibold">Admin console</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted"
          aria-label="Open admin menu"
          aria-expanded={open}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-[84%] max-w-[280px] animate-fade-in flex-col bg-[#0b1020] shadow-[var(--shadow-modal)]">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
                aria-label="Close admin menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavContent pathname={pathname} onNavigate={() => setOpen(false)} />
            {account}
          </div>
        </div>
      ) : null}
    </>
  );
}
