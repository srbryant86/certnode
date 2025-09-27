"use client";

import { useFormStatus } from "react-dom";

export function RevokeApiKeyButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-disabled={pending}
      className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-red-500 hover:text-red-300 aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
    >
      {pending ? "Revoking..." : "Revoke"}
    </button>
  );
}
