"use client";

import { create } from "zustand";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/format";
import { useEffect, useState } from "react";

type Tone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  description?: string;
  tone: Tone;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id">) => void;
  dismiss: (id: number) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = ++counter;
    set((state) => ({ toasts: [...state.toasts.slice(-2), { ...toast, id }] }));
    setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), 5000);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string, description?: string) =>
    useToastStore.getState().push({ tone: "success", message, description }),
  error: (message: string, description?: string) =>
    useToastStore.getState().push({ tone: "error", message, description }),
  info: (message: string, description?: string) =>
    useToastStore.getState().push({ tone: "info", message, description }),
};

export function ToastViewport() {
  const { toasts, dismiss } = useToastStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:bottom-6 md:right-6 md:items-end md:px-0"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((item) => {
        const Icon = item.tone === "success" ? CheckCircle2 : item.tone === "error" ? XCircle : Info;
        return (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm animate-toast items-start gap-3 rounded-xl border bg-raised p-4 shadow-[var(--shadow-pop)]",
              item.tone === "success" && "border-success/30",
              item.tone === "error" && "border-danger/30",
              item.tone === "info" && "border-border"
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0",
                item.tone === "success" && "text-success",
                item.tone === "error" && "text-danger",
                item.tone === "info" && "text-info"
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text">{item.message}</p>
              {item.description ? <p className="mt-0.5 text-xs text-muted">{item.description}</p> : null}
            </div>
            <button
              onClick={() => dismiss(item.id)}
              className="-m-1 rounded p-1 text-muted transition-colors hover:text-text"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
