"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  User as UserIcon,
  X,
} from "lucide-react";
import type { Category, User } from "@/lib/types";
import { cn, initials } from "@/lib/format";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { api } from "@/lib/client";
import { SearchBox } from "./search-box";
import { ThemeToggle } from "./theme-toggle";

function Logo() {
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="ShopSphere home">
      <span className="relative grid h-8 w-8 place-items-center rounded-full bg-primary text-white">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="8.5" opacity="0.95" />
          <ellipse cx="12" cy="12" rx="8.5" ry="3.4" transform="rotate(-28 12 12)" opacity="0.8" />
          <circle cx="16.5" cy="7.4" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="text-[19px] font-semibold tracking-[-0.03em] text-text">
        Shop<span className="text-primary">Sphere</span>
      </span>
    </Link>
  );
}

export function Header({ user, categories }: { user: User | null; categories: Category[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const count = useCartStore((state) => state.count);
  const openDrawer = useCartStore((state) => state.openDrawer);
  const resetCart = useCartStore((state) => state.reset);
  const refreshCart = useCartStore((state) => state.refresh);
  const wishlistIds = useWishlistStore((state) => state.ids);
  const setSignedIn = useWishlistStore((state) => state.setSignedIn);

  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const topLevel = categories.filter((category) => !category.parentId);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileSearch(false);
  }, [pathname]);

  const logout = async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => null);
    setAccountOpen(false);
    setSignedIn(false);
    resetCart();
    await refreshCart();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/85 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/75">
      <div className="bg-[#0e1424] text-white">
        <div className="container-shop flex h-8 items-center justify-center gap-2 text-[11px] tracking-wide text-white/75">
          <Sparkles className="h-3 w-3 text-[#a5b4fc]" />
          <span>Free shipping over ₹999</span>
          <span className="text-white/25">·</span>
          <span>7-day easy returns</span>
          <span className="hidden text-white/25 sm:inline">·</span>
          <span className="hidden sm:inline">Secure payments</span>
        </div>
      </div>

      <div className="container-shop">
        <div className="flex h-16 items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-text transition-colors hover:bg-surface lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.7} />
          </button>

          <Logo />

          <nav className="ml-6 hidden items-center gap-0.5 lg:flex" aria-label="Main">
            {topLevel.map((category) => (
              <div key={category.id} className="group relative">
                <Link
                  href={category.slug === "sale" ? "/products?category=sale" : `/products?category=${category.slug}`}
                  className={cn(
                    "relative flex h-16 items-center gap-1 px-3 text-[13px] font-medium transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-200 hover:after:scale-x-100",
                    category.slug === "sale" ? "text-sale after:bg-sale" : "text-text/80 hover:text-text"
                  )}
                >
                  {category.name}
                  {category.children && category.children.length > 0 ? (
                    <ChevronDown className="h-3 w-3 text-muted transition-transform group-hover:rotate-180" />
                  ) : null}
                </Link>
                {category.children && category.children.length > 0 ? (
                  <div className="invisible absolute left-0 top-full w-64 translate-y-1 rounded-xl border border-border bg-raised p-2 opacity-0 shadow-[var(--shadow-pop)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <p className="eyebrow px-2 pb-2 pt-1">Shop {category.name}</p>
                    <ul className="grid grid-cols-2 gap-0.5">
                      {category.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={`/products?category=${child.slug}`}
                            className="flex items-center justify-between rounded-md px-2 py-1.5 text-[13px] text-text/85 transition-colors hover:bg-surface hover:text-text"
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/products?category=${category.slug}`}
                      className="mt-1 flex items-center justify-between rounded-md bg-surface px-2 py-2 text-xs font-medium text-text hover:bg-primary-subtle hover:text-primary"
                    >
                      View all {category.name.toLowerCase()}
                      <span aria-hidden>→</span>
                    </Link>
                  </div>
                ) : null}
              </div>
            ))}
          </nav>

          <div className="mx-auto hidden max-w-sm flex-1 md:block lg:max-w-[390px]">
            <SearchBox />
          </div>

          <div className="ml-auto flex items-center gap-0.5 md:ml-0">
            <button
              onClick={() => setMobileSearch((value) => !value)}
              className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-text md:hidden"
              aria-label="Search"
              aria-expanded={mobileSearch}
            >
              {mobileSearch ? <X className="h-5 w-5" strokeWidth={1.7} /> : <Search className="h-5 w-5" strokeWidth={1.7} />}
            </button>

            <ThemeToggle className="hidden sm:grid" />

            <Link
              href="/wishlist"
              className="relative hidden h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-text sm:grid"
              aria-label={`Wishlist${wishlistIds.length ? `, ${wishlistIds.length} items` : ""}`}
            >
              <Heart className="h-5 w-5" strokeWidth={1.7} />
              {wishlistIds.length > 0 ? (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-sale px-1 text-[10px] font-semibold text-white">
                  {wishlistIds.length}
                </span>
              ) : null}
            </Link>

            <div ref={accountRef} className="relative hidden sm:block">
              {user ? (
                <button
                  onClick={() => setAccountOpen((value) => !value)}
                  className="flex h-10 items-center gap-1.5 rounded-full px-1.5 text-muted transition-colors hover:bg-surface hover:text-text"
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-subtle text-[11px] font-semibold text-primary">
                    {initials(user.name)}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              ) : (
                <Link
                  href="/sign-in"
                  className="flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-text transition-colors hover:bg-surface"
                >
                  <UserIcon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                  Sign in
                </Link>
              )}

              {accountOpen && user ? (
                <div className="absolute right-0 top-[calc(100%+6px)] w-64 animate-fade-in overflow-hidden rounded-xl border border-border bg-raised shadow-[var(--shadow-pop)]">
                  <div className="border-b border-border bg-surface/60 px-4 py-3">
                    <p className="text-sm font-semibold text-text">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link href="/account/orders" className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-text hover:bg-surface">
                      <Package className="h-4 w-4 text-muted" /> Orders
                    </Link>
                    <Link href="/wishlist" className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-text hover:bg-surface">
                      <Heart className="h-4 w-4 text-muted" /> Wishlist
                    </Link>
                    <Link href="/account/addresses" className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-text hover:bg-surface">
                      <MapPin className="h-4 w-4 text-muted" /> Addresses
                    </Link>
                    {user.role === "admin" ? (
                      <Link href="/admin" className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-primary hover:bg-primary-subtle">
                        <LayoutDashboard className="h-4 w-4" /> Admin console
                      </Link>
                    ) : null}
                    <button
                      onClick={() => void logout()}
                      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-text hover:bg-surface"
                    >
                      <LogOut className="h-4 w-4 text-muted" /> Sign out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <button
              onClick={openDrawer}
              className="relative grid h-10 w-10 place-items-center rounded-full text-text transition-colors hover:bg-surface"
              aria-label={`Open cart${count ? `, ${count} items` : ""}`}
            >
              <ShoppingBag className="h-[19px] w-[19px]" strokeWidth={1.7} />
              {count > 0 ? (
                <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                  {count}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {mobileSearch ? (
          <div className="border-t border-border py-3 md:hidden">
            <SearchBox autoFocus onNavigate={() => setMobileSearch(false)} />
          </div>
        ) : null}
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[75] lg:hidden">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm animate-fade-in flex-col bg-bg shadow-[var(--shadow-modal)]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <SearchBox onNavigate={() => setMobileOpen(false)} />
              <nav className="mt-4 space-y-0.5" aria-label="Mobile">
                <Link href="/products" className="block rounded-lg px-2 py-3 text-[15px] font-semibold text-text hover:bg-surface">
                  Shop all
                </Link>
                {topLevel.map((category) => (
                  <div key={category.id}>
                    <Link
                      href={`/products?category=${category.slug}`}
                      className={cn(
                        "block rounded-lg px-2 py-2.5 text-[15px] font-medium hover:bg-surface",
                        category.slug === "sale" ? "text-sale" : "text-text"
                      )}
                    >
                      {category.name}
                    </Link>
                    {category.children && category.children.length > 0 ? (
                      <div className="mb-1 grid grid-cols-2 gap-0.5 pl-2">
                        {category.children.map((child) => (
                          <Link key={child.id} href={`/products?category=${child.slug}`} className="rounded-md px-2 py-1.5 text-xs text-muted hover:text-text">
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </nav>
              <div className="mt-5 border-t border-border pt-4">
                {user ? (
                  <div className="space-y-1">
                    <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-surface px-3 py-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-[11px] font-semibold text-white">{initials(user.name)}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted">{user.email}</p>
                      </div>
                    </div>
                    <Link href="/account/orders" className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-surface"><Package className="h-4 w-4 text-muted" /> Orders</Link>
                    <Link href="/account/addresses" className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-surface"><MapPin className="h-4 w-4 text-muted" /> Addresses</Link>
                    {user.role === "admin" ? (
                      <Link href="/admin" className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium text-primary hover:bg-primary-subtle"><LayoutDashboard className="h-4 w-4" /> Admin console</Link>
                    ) : null}
                    <button onClick={() => void logout()} className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-surface"><LogOut className="h-4 w-4 text-muted" /> Sign out</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/sign-in" className="rounded-lg border border-border px-3 py-2.5 text-center text-sm font-medium hover:bg-surface">Sign in</Link>
                    <Link href="/sign-up" className="rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-hover">Create account</Link>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs text-muted">Appearance</span>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
