"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/toast";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          setEmail("");
          toast.success("You're on the list", "Look out for good things in your inbox.");
        }, 500);
      }}
      className="flex w-full max-w-md items-center gap-2"
    >
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email address"
        className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-bg px-3.5 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
      />
      <button
        type="submit"
        disabled={loading}
        className="flex h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {loading ? "Joining…" : "Join"}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
