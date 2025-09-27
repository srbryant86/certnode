"use client";

import { useState, useTransition } from "react";

interface BillingPortalButtonProps {
  className?: string;
}

export function BillingPortalButton({ className = "" }: BillingPortalButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        type="button"
        onClick={() => {
          startTransition(async () => {
            setError(null);
            try {
              const response = await fetch("/api/billing/portal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              });

              if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                const message = typeof payload.error === "string" ? payload.error : "Unable to open billing portal.";
                setError(message);
                return;
              }

              const payload = (await response.json()) as { url?: string };
              if (!payload.url) {
                setError("Billing portal unavailable.");
                return;
              }

              window.open(payload.url, "_blank", "noopener,noreferrer");
            } catch (err) {
              console.error("Billing portal open failed", err);
              setError("Unexpected error opening billing portal.");
            }
          });
        }}
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-lg border border-blue-500/50 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Opening billing portal..." : "Manage billing in Stripe"}
      </button>
      {error ? <p className="text-xs text-amber-300">{error}</p> : null}
    </div>
  );
}
