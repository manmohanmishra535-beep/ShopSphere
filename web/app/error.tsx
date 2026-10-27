"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="h-5 w-5" />
      </span>
      <h1 className="mt-5 text-[28px] font-semibold tracking-[-0.03em] sm:text-[34px]">Something went sideways.</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted">
        We hit an unexpected error loading this page. Try again — if it keeps happening, our team is one email away.
      </p>
      {error.digest ? <p className="mt-2 font-mono text-[10px] text-muted/70">Reference: {error.digest}</p> : null}
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>
          <RotateCcw className="h-4 w-4" /> Try again
        </Button>
        <Link href="/" className={buttonStyles("outline")}>Back home</Link>
        <a href="mailto:help@shopsphere.in" className={buttonStyles("ghost")}>Contact support</a>
      </div>
    </div>
  );
}
