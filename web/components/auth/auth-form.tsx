"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { api, ClientApiError, errorMessage } from "@/lib/client";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { User } from "@/lib/types";

export function AuthForm({ mode, next }: { mode: "sign-in" | "sign-up"; next: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const refreshCart = useCartStore((state) => state.refresh);
  const setSignedIn = useWishlistStore((state) => state.setSignedIn);
  const refreshWishlist = useWishlistStore((state) => state.refresh);

  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = mode === "sign-in" ? { email, password } : { name, email, password };
      const endpoint = mode === "sign-in" ? "/auth/login" : "/auth/register";
      const data = await api<{ user: User }>(endpoint, { method: "POST", body: payload });
      await api("/cart/merge", { method: "POST", body: { items: [] } }).catch(() => null);
      setSignedIn(true);
      await Promise.all([refreshCart(), refreshWishlist()]);
      toast.success(mode === "sign-in" ? `Welcome back, ${data.user.name.split(" ")[0]}` : "Your account is ready");
      router.push(destination);
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError && err.status === 401) {
        setError("Email or password is incorrect.");
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: "customer" | "admin") => {
    setEmail(role === "admin" ? "admin@shopsphere.in" : "demo@shopsphere.in");
    setPassword(role === "admin" ? "admin123" : "demo123");
    setError("");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold tracking-[-0.03em]">
          {mode === "sign-in" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">
          {mode === "sign-in"
            ? "Sign in to see your orders, wishlist and saved addresses."
            : "One account for orders, wishlists and faster checkout."}
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "sign-up" ? (
          <Input
            label="Full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            placeholder="Your name"
            required
            minLength={2}
          />
        ) : null}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            placeholder={mode === "sign-up" ? "At least 6 characters" : "Your password"}
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute bottom-2.5 right-2.5 rounded p-1 text-muted hover:text-text"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error ? (
          <p className="rounded-md bg-danger/10 px-3 py-2 text-xs text-danger" role="alert">{error}</p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <div className="mt-5 rounded-lg border border-border bg-surface/60 p-3.5">
        <p className="text-[11px] font-medium text-text">Demo accounts</p>
        <p className="mt-0.5 text-[10px] text-muted">One click fills the form — no password hunting.</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fillDemo("customer")}
            className="rounded-md border border-border bg-bg px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:border-primary hover:text-primary"
          >
            Customer · demo@shopsphere.in
          </button>
          <button
            type="button"
            onClick={() => fillDemo("admin")}
            className="rounded-md border border-border bg-bg px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:border-primary hover:text-primary"
          >
            Admin · admin@shopsphere.in
          </button>
        </div>
        <p className="mt-2 text-[10px] text-muted">Passwords: demo123 / admin123</p>
      </div>

      <p className="mt-5 text-center text-[12px] text-muted">
        {mode === "sign-in" ? (
          <>
            New here?{" "}
            <Link href={`/sign-up?next=${encodeURIComponent(next)}`} className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/sign-in?next=${encodeURIComponent(next)}`} className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
