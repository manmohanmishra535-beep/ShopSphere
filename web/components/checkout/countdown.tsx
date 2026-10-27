"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export function Countdown({
  target,
  onExpire,
  className,
}: {
  target: string;
  onExpire?: () => void;
  className?: string;
}) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(target).getTime() - Date.now()));

  useEffect(() => {
    const timer = setInterval(() => {
      const next = Math.max(0, new Date(target).getTime() - Date.now());
      setRemaining(next);
      if (next === 0) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [target, onExpire]);

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <span className={className}>
      <Clock className="mr-1 inline h-3.5 w-3.5" />
      {remaining === 0 ? "Expired" : `${minutes}:${String(seconds).padStart(2, "0")} left`}
    </span>
  );
}
