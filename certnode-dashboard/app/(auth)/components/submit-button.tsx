"use client";

import { useFormStatus } from "react-dom";

export function AuthSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400 aria-disabled:cursor-not-allowed aria-disabled:opacity-70"
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
          {label}
        </span>
      ) : (
        label
      )}
    </button>
  );
}
