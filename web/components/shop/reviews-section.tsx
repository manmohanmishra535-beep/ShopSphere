"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, ChevronDown, MessageSquare, ThumbsUp } from "lucide-react";
import type { ReviewsResponse } from "@/lib/types";
import { api, errorMessage } from "@/lib/client";
import { formatDate, initials } from "@/lib/format";
import { RatingStars, StarInput } from "@/components/ui/rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";

export function ReviewsSection({
  productId,
  productName,
  initial,
  signedIn,
}: {
  productId: string;
  productName: string;
  initial: ReviewsResponse;
  signedIn: boolean;
}) {
  const [state, setState] = useState(initial);
  const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = async (nextSort = sort) => {
    setLoading(true);
    try {
      const data = await api<ReviewsResponse>(`/products/${productId}/reviews?sort=${nextSort}`);
      setState(data);
    } catch (error) {
      toast.error("Could not load reviews", errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const helpful = async (reviewId: string) => {
    try {
      const result = await api<{ helpful: number }>(`/products/${productId}/reviews/${reviewId}/helpful`, { method: "POST" });
      setState((current) => ({
        ...current,
        data: current.data.map((review) => (review.id === reviewId ? { ...review, helpful: result.helpful } : review)),
      }));
      toast.success("Thanks for the feedback");
    } catch (error) {
      toast.error("Could not register your vote", errorMessage(error));
    }
  };

  const { summary, data } = state;
  const maxCount = Math.max(1, ...summary.histogram.map((item) => item.count));

  return (
    <section id="reviews" className="mt-16 border-t border-border pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">From people who bought it</p>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.02em]">Ratings &amp; reviews</h2>
        </div>
        {state.myReview ? (
          <Badge tone={state.myReview.status === "published" ? "success" : "warning"}>
            Your review is {state.myReview.status}
          </Badge>
        ) : state.canReview ? (
          <Button onClick={() => setOpen(true)} size="sm">
            <MessageSquare className="h-4 w-4" /> Write a review
          </Button>
        ) : signedIn ? (
          <p className="text-[11px] text-muted">Reviews open to verified buyers after delivery.</p>
        ) : (
          <Link href={`/sign-in?next=/products/${productId}`} className="text-[11px] font-medium text-primary hover:underline">
            Sign in to review
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14">
        <div>
          <div className="flex items-end gap-3">
            <span className="text-[44px] font-bold leading-none tracking-[-0.04em]">{summary.avg.toFixed(1)}</span>
            <div className="pb-1">
              <RatingStars value={summary.avg} size="md" />
              <p className="mt-1 text-[11px] text-muted">{summary.count} published {summary.count === 1 ? "review" : "reviews"}</p>
            </div>
          </div>

          <div className="mt-5 space-y-1.5">
            {summary.histogram.map((item) => (
              <div key={item.star} className="flex items-center gap-2.5 text-[11px] text-muted">
                <span className="w-2.5 tabular-nums">{item.star}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-amber-500/80"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right tabular-nums">{item.count}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-border bg-surface/60 p-3.5">
            <p className="text-[11px] leading-5 text-muted">
              Only customers with a delivered order can review. Every review is read by a human before it goes live.
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <p className="text-[12px] text-muted">{data.length} {data.length === 1 ? "review" : "reviews"}</p>
            <div className="relative inline-flex items-center">
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  void load(event.target.value);
                }}
                aria-label="Sort reviews"
                className="h-8 appearance-none rounded-md border border-border bg-bg pl-2.5 pr-7 text-[11px] font-medium focus:border-primary focus:outline-none"
              >
                <option value="recent">Most recent</option>
                <option value="helpful">Most helpful</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-muted" />
            </div>
          </div>

          {loading ? (
            <div className="divide-y divide-border">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2 py-5">
                  <div className="skeleton h-3 w-32" />
                  <div className="skeleton h-4 w-48" />
                  <div className="skeleton h-10 w-full" />
                </div>
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium">No reviews yet</p>
              <p className="mt-1 text-xs text-muted">Be the first to share how it fits and feels.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.map((review) => (
                <li key={review.id} className="py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-subtle text-[10px] font-semibold text-primary">
                        {initials(review.author)}
                      </span>
                      <div>
                        <p className="flex items-center gap-1.5 text-[13px] font-medium">
                          {review.author}
                          {review.verified ? <BadgeCheck className="h-3.5 w-3.5 text-success" aria-label="Verified purchase" /> : null}
                        </p>
                        <p className="text-[11px] text-muted">{formatDate(review.createdAt)}</p>
                      </div>
                    </div>
                    <RatingStars value={review.rating} />
                  </div>
                  <h3 className="mt-3 text-[13px] font-semibold">{review.title}</h3>
                  <p className="mt-1 text-[13px] leading-6 text-muted">{review.body}</p>
                  {review.images.length > 0 ? (
                    <div className="mt-3 flex gap-2">
                      {review.images.map((image) => (
                        <img key={image} src={image} alt="" className="h-16 w-16 rounded-md object-cover" />
                      ))}
                    </div>
                  ) : null}
                  {review.reply ? (
                    <div className="mt-3 rounded-lg bg-surface px-3 py-2.5">
                      <p className="text-[11px] font-medium text-text">ShopSphere replied</p>
                      <p className="mt-0.5 text-[12px] text-muted">{review.reply}</p>
                    </div>
                  ) : null}
                  <button
                    onClick={() => void helpful(review.id)}
                    className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted transition-colors hover:text-text"
                  >
                    <ThumbsUp className="h-3 w-3" /> Helpful {review.helpful ? `(${review.helpful})` : ""}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ReviewModal
        open={open}
        onClose={() => setOpen(false)}
        productId={productId}
        productName={productName}
        onSubmitted={() => {
          setOpen(false);
          toast.success("Review submitted", "It will appear once our team has approved it.");
          void load();
        }}
      />
    </section>
  );
}

function ReviewModal({
  open,
  onClose,
  productId,
  productName,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (rating === 0) {
      setError("Choose a star rating first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api(`/products/${productId}/reviews`, {
        method: "POST",
        body: { rating, title, body, images: [] },
      });
      setRating(0);
      setTitle("");
      setBody("");
      onSubmitted();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Write a review"
      description={productName}
      size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={submit} loading={loading}>Submit review</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <p className="mb-2 text-[13px] font-medium">Your rating</p>
          <StarInput value={rating} onChange={setRating} />
        </div>
        <Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Sum it up in a line" required minLength={3} />
        <Textarea
          label="Your review"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="How is the fit, fabric and finish?"
          required
          minLength={10}
          hint="Your review will be published after moderation."
        />
        {error ? <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger" role="alert">{error}</p> : null}
      </form>
    </Modal>
  );
}
