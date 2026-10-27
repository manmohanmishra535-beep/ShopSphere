"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { api } from "@/lib/client";
import { cn, formatINR } from "@/lib/format";

interface Suggestions {
  products: { id: string; title: string; slug: string; price: number; image: string; brand: string }[];
  categories: { name: string; slug: string }[];
}

const empty: Suggestions = { products: [], categories: [] };

export function SearchBox({
  autoFocus = false,
  onNavigate,
  className,
}: {
  autoFocus?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Suggestions>(empty);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setData(empty);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const result = await api<Suggestions>(`/storefront/suggest?q=${encodeURIComponent(q.trim())}`, {
          signal: controller.signal,
        });
        setData(result);
        setActive(-1);
      } catch {
        // Aborted or offline — keep the previous suggestions.
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const options = data.products;
  const navigate = (href: string) => {
    setOpen(false);
    setQ("");
    onNavigate?.();
    router.push(href);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (active >= 0 && options[active]) {
      navigate(`/products/${options[active].slug}`);
      return;
    }
    if (!q.trim()) return;
    navigate(`/products?q=${encodeURIComponent(q.trim())}`);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((v) => Math.min(options.length - 1, v + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((v) => Math.max(-1, v - 1));
    } else if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const showPanel = open && q.trim().length >= 2;

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      <form onSubmit={submit} role="search">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.8} />
          <input
            ref={inputRef}
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search products, brands…"
            aria-label="Search products"
            aria-expanded={showPanel}
            aria-controls="search-suggestions"
            role="combobox"
            aria-autocomplete="list"
            className="h-10 w-full rounded-full border border-border bg-surface pl-10 pr-16 text-sm text-text outline-none transition-colors placeholder:text-muted focus:border-primary focus:bg-bg focus:ring-2 focus:ring-primary/15"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted" /> : null}
            {q ? (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  inputRef.current?.focus();
                }}
                className="rounded-full p-1 text-muted hover:text-text"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="hidden rounded border border-border bg-bg px-1.5 py-0.5 text-[10px] text-muted md:inline">↵</kbd>
            )}
          </div>
        </div>
      </form>

      {showPanel ? (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-raised p-2 shadow-[var(--shadow-pop)]"
        >
          {data.products.length === 0 && data.categories.length === 0 && !loading ? (
            <p className="px-3 py-6 text-center text-sm text-muted">No matches for “{q}”. Try another search.</p>
          ) : null}

          {data.categories.length > 0 ? (
            <div className="mb-1 border-b border-border px-2 pb-2 pt-1">
              <p className="eyebrow mb-1.5">Categories</p>
              <div className="flex flex-wrap gap-1.5">
                {data.categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/products?category=${cat.slug}`}
                    onClick={() => {
                      setOpen(false);
                      setQ("");
                      onNavigate?.();
                    }}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-text transition-colors hover:border-primary hover:text-primary"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {data.products.length > 0 ? (
            <ul className="py-1">
              {data.products.map((product, index) => (
                <li key={product.id} role="option" aria-selected={active === index}>
                  <Link
                    href={`/products/${product.slug}`}
                    onClick={() => {
                      setOpen(false);
                      setQ("");
                      onNavigate?.();
                    }}
                    onMouseEnter={() => setActive(index)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-2 py-2 transition-colors",
                      active === index ? "bg-surface" : "hover:bg-surface"
                    )}
                  >
                    <img src={product.image} alt="" className="h-11 w-11 rounded-md bg-surface object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-text">{product.title}</span>
                      <span className="block text-[11px] text-muted">{product.brand}</span>
                    </span>
                    <span className="price-num text-xs font-semibold">{formatINR(product.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {q.trim() ? (
            <button
              type="button"
              onClick={() => navigate(`/products?q=${encodeURIComponent(q.trim())}`)}
              className="mt-1 flex w-full items-center justify-between rounded-lg bg-surface px-3 py-2.5 text-left text-[13px] font-medium text-text hover:bg-primary-subtle"
            >
              <span>See all results for “{q.trim()}”</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
