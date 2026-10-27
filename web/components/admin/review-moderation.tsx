"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, EyeOff, MessageSquare, Star } from "lucide-react";
import type { AdminReview } from "@/lib/types";
import { api, errorMessage } from "@/lib/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/format";

export function ReviewModeration({ initial }: { initial: AdminReview[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [replying, setReplying] = useState<AdminReview | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRows(initial);
  }, [initial]);

  const moderate = async (review: AdminReview, status: "published" | "hidden") => {
    setBusy(review.id);
    try {
      await api(`/reviews/${review.id}`, { method: "PATCH", body: { status } });
      setRows((current) => current.map((row) => (row.id === review.id ? { ...row, status } : row)));
      toast.success(status === "published" ? "Review published" : "Review hidden", `“${review.title}” by ${review.author}.`);
      router.refresh();
    } catch (error) {
      toast.error("Could not update review", errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const openReply = (review: AdminReview) => {
    setReplying(review);
    setReply(review.reply ?? "");
  };

  const saveReply = async () => {
    if (!replying) return;
    setSaving(true);
    try {
      await api(`/reviews/${replying.id}`, { method: "PATCH", body: { reply } });
      setRows((current) => current.map((row) => (row.id === replying.id ? { ...row, reply } : row)));
      toast.success("Reply saved");
      setReplying(null);
      router.refresh();
    } catch (error) {
      toast.error("Could not save reply", errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="mt-4 space-y-3">
        {rows.map((review) => (
          <article key={review.id} className="rounded-xl border border-border bg-bg p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <img src={review.productImage} alt="" className="h-12 w-10 shrink-0 rounded border border-border object-cover" loading="lazy" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn("h-3.5 w-3.5", star <= review.rating ? "fill-warning text-warning" : "text-border")}
                        />
                      ))}
                    </div>
                    <Badge tone={review.status === "published" ? "success" : review.status === "pending" ? "warning" : "neutral"}>
                      {review.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[13px] font-semibold">{review.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {review.author} · {review.authorEmail} · Order {review.orderNumber} · {formatDate(review.createdAt)}
                  </p>
                  <Link href={`/products/${review.productSlug}`} target="_blank" className="mt-1 inline-block text-[11px] font-medium text-primary hover:underline">
                    {review.productTitle}
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {review.status !== "published" ? (
                  <Button size="sm" variant="outline" loading={busy === review.id} onClick={() => void moderate(review, "published")}>
                    <Check className="h-3.5 w-3.5" /> Publish
                  </Button>
                ) : null}
                {review.status !== "hidden" ? (
                  <Button size="sm" variant="ghost" className="text-muted hover:text-danger" loading={busy === review.id} onClick={() => void moderate(review, "hidden")}>
                    <EyeOff className="h-3.5 w-3.5" /> Hide
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" className="text-muted" onClick={() => openReply(review)}>
                  <MessageSquare className="h-3.5 w-3.5" /> {review.reply ? "Edit reply" : "Reply"}
                </Button>
              </div>
            </div>

            <p className="mt-3 text-[13px] leading-6 text-muted">{review.body}</p>

            {review.images.length > 0 ? (
              <div className="mt-2 flex gap-2">
                {review.images.map((image) => (
                  <img key={image} src={image} alt="" className="h-14 w-14 rounded border border-border object-cover" loading="lazy" />
                ))}
              </div>
            ) : null}

            {review.reply ? (
              <div className="mt-3 rounded-lg border border-border bg-surface/60 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">ShopSphere replied</p>
                <p className="mt-0.5 text-[12px] leading-5 text-muted">{review.reply}</p>
              </div>
            ) : null}
          </article>
        ))}
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-bg px-6 py-14 text-center">
            <p className="text-sm font-semibold">Nothing to moderate here</p>
            <p className="mt-1 text-xs text-muted">New reviews from verified purchases will appear in this queue.</p>
          </div>
        ) : null}
      </div>

      <Modal
        open={Boolean(replying)}
        onClose={() => setReplying(null)}
        title="Reply to review"
        description={replying ? `${replying.title} · ${replying.author}` : undefined}
        size="md"
      >
        <div className="space-y-3">
          <Textarea
            label="Public reply"
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Thank you for the thoughtful note…"
          />
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" size="sm" onClick={() => setReplying(null)}>Cancel</Button>
            <Button size="sm" loading={saving} onClick={() => void saveReply()} disabled={!reply.trim()}>
              Save reply
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
