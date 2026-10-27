import Link from "next/link";
import { getAdminReviews } from "@/lib/api";
import { PageHeader } from "@/components/admin/page-header";
import { ReviewModeration } from "@/components/admin/review-moderation";
import { cn } from "@/lib/format";

export const metadata = { title: "Reviews" };

const tabs = [
  { key: "all", label: "All", count: "all" as const },
  { key: "pending", label: "Pending", count: "pending" as const },
  { key: "published", label: "Published", count: "published" as const },
  { key: "hidden", label: "Hidden", count: "hidden" as const },
];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = tabs.some((tab) => tab.key === params.status) ? params.status! : "all";
  const result = await getAdminReviews(status);

  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Reviews"
        description="Only customers with a delivered order can review. Publish the thoughtful ones, hide anything that breaks the guidelines."
      />

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border pb-px">
        {tabs.map((tab) => {
          const active = tab.key === status;
          return (
            <Link
              key={tab.key}
              href={`/admin/reviews${tab.key === "all" ? "" : `?status=${tab.key}`}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-medium transition-colors",
                active ? "border-primary text-primary" : "border-transparent text-muted hover:text-text"
              )}
            >
              {tab.label}
              <span className={cn("text-[11px]", active ? "text-primary/70" : "text-muted/70")}>{result.counts[tab.count]}</span>
            </Link>
          );
        })}
      </div>

      <ReviewModeration initial={result.data} />
    </div>
  );
}
