"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      toast.success("Message sent", "We'll reply within one working day.");
      setName("");
      setEmail("");
      setOrder("");
      setMessage("");
    }, 600);
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-center">
        <p className="text-sm font-semibold">Thanks — your message is with us.</p>
        <p className="mt-1 text-xs text-muted">We reply within one working day, Monday to Saturday.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Your name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required minLength={2} />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </div>
      <Input
        label="Order number"
        hint="Optional — helps us answer faster."
        value={order}
        onChange={(event) => setOrder(event.target.value)}
        placeholder="SS2601…"
      />
      <Textarea
        label="How can we help?"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Tell us what's going on…"
        required
        minLength={10}
        rows={5}
      />
      <Button type="submit" loading={sending}>
        <Send className="h-4 w-4" /> Send message
      </Button>
    </form>
  );
}
