"use client";

import { useFormStatus } from "react-dom";

interface PlanChangeButtonProps {
  label: string;
  intent?: "upgrade" | "downgrade" | "switch";
}

const intentStyles: Record<NonNullable<PlanChangeButtonProps["intent"]>, string> = {
  upgrade: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100 hover:border-emerald-300",
  downgrade: "border-amber-400/40 bg-amber-500/10 text-amber-100 hover:border-amber-300",
  switch: "border-blue-400/40 bg-blue-500/10 text-blue-100 hover:border-blue-300",
};

export function PlanChangeButton({ label, intent = "switch" }: PlanChangeButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60 ${intentStyles[intent]}`}
    >
      {pending ? "Updating..." : label}
    </button>
  );
}
