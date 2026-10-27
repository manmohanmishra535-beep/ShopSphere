"use client";

import { useState } from "react";
import { MapPin, Truck } from "lucide-react";
import { deliveryEstimate } from "@/lib/format";

export function PinCheck() {
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<{ days: number; cod: boolean } | null>(null);
  const [error, setError] = useState("");

  const check = () => {
    setError("");
    setResult(null);
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setError("Enter a valid 6-digit PIN code");
      return;
    }
    const seed = Number(pin.slice(-1));
    setResult({ days: 3 + (seed % 3), cod: seed % 4 !== 0 });
  };

  return (
    <div className="rounded-lg border border-border p-3.5">
      <p className="flex items-center gap-2 text-[12px] font-medium">
        <MapPin className="h-3.5 w-3.5 text-muted" /> Check delivery
      </p>
      <div className="mt-2.5 flex gap-2">
        <input
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(event) => event.key === "Enter" && check()}
          inputMode="numeric"
          placeholder="Enter PIN code"
          aria-label="PIN code"
          className="h-9 w-36 rounded-md border border-border bg-bg px-2.5 text-xs tabular-nums focus:border-primary focus:outline-none"
        />
        <button
          onClick={check}
          className="h-9 rounded-md border border-border px-3 text-xs font-medium text-text transition-colors hover:border-primary hover:text-primary"
        >
          Check
        </button>
      </div>
      {error ? <p className="mt-2 text-[11px] text-danger" role="alert">{error}</p> : null}
      {result ? (
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-success">
          <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Delivers by <strong>{deliveryEstimate(result.days)}</strong>
            <span className="text-muted"> · {result.cod ? "Cash on delivery available" : "Prepaid only in this area"}</span>
          </span>
        </p>
      ) : null}
    </div>
  );
}
