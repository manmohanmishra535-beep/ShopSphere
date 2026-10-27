import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/format";

export function Pagination({
  page,
  pages,
  hrefFor,
}: {
  page: number;
  pages: number;
  hrefFor: (page: number) => string;
}) {
  if (pages <= 1) return null;

  const around = new Set<number>([1, pages, page - 1, page, page + 1]);
  const numbers: (number | "gap")[] = [];
  let previous = 0;
  for (let i = 1; i <= pages; i++) {
    if (!around.has(i)) continue;
    if (previous && i - previous > 1) numbers.push("gap");
    numbers.push(i);
    previous = i;
  }

  return (
    <nav className="mt-12 flex items-center justify-center gap-1" aria-label="Pagination">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={cn(
          "grid h-9 w-9 place-items-center rounded-md border border-border text-muted transition-colors hover:bg-surface",
          page === 1 && "pointer-events-none opacity-40"
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      {numbers.map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="grid h-9 w-7 place-items-center text-xs text-muted">…</span>
        ) : (
          <Link
            key={item}
            href={hrefFor(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "grid h-9 min-w-9 place-items-center rounded-md border px-2 text-[13px] font-medium transition-colors",
              item === page
                ? "border-primary bg-primary text-white"
                : "border-border text-text hover:bg-surface"
            )}
          >
            {item}
          </Link>
        )
      )}
      <Link
        href={hrefFor(Math.min(pages, page + 1))}
        aria-disabled={page === pages}
        className={cn(
          "grid h-9 w-9 place-items-center rounded-md border border-border text-muted transition-colors hover:bg-surface",
          page === pages && "pointer-events-none opacity-40"
        )}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
