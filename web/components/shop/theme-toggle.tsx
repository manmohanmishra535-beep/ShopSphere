"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("ss-theme", next);
    } catch {
      // Storage may be unavailable in private mode.
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={`grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-text ${className ?? ""}`}
    >
      {theme === "dark" ? <Sun className="h-[18px] w-[18px]" strokeWidth={1.7} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={1.7} />}
    </button>
  );
}
