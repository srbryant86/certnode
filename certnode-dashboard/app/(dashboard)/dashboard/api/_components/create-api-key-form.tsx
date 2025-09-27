"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import { createApiKeyAction, type CreateApiKeyState } from "../actions";

const INITIAL_STATE: CreateApiKeyState = { status: "idle" };

const rateLimitWindows = [
  { value: "1m", label: "Per minute" },
  { value: "1h", label: "Per hour" },
  { value: "1d", label: "Per day" },
] as const;

export function CreateApiKeyForm() {
  const [state, formAction] = useFormState(createApiKeyAction, INITIAL_STATE);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (state.status === "success" && state.secret) {
      setShowSecret(true);
    }
  }, [state.status, state.secret]);

  return (
    <form className="space-y-6" action={formAction}>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white">Create new API key</h2>
        <p className="text-sm text-slate-400">
          Keys inherit enterprise permissions. Configure rate limits and network restrictions per key.
        </p>
      </div>

      {state.status === "error" ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {state.message}
        </p>
      ) : null}

      {showSecret && state.secret ? (
        <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-4 text-sm text-blue-100">
          <p className="font-semibold text-white">New API key</p>
          <p className="mt-2 font-mono text-base tracking-wide">{state.secret}</p>
          <p className="mt-2 text-xs text-blue-200">Copy this value now. It will not be shown again.</p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm text-slate-300">
          <span className="font-medium text-slate-100">Key name</span>
          <input
            name="name"
            required
            placeholder="Production ingestion key"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </label>

        <label className="space-y-1 text-sm text-slate-300">
          <span className="font-medium text-slate-100">Rate limit</span>
          <input
            type="number"
            min={1}
            name="rateLimit"
            defaultValue={1000}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </label>

        <label className="space-y-1 text-sm text-slate-300">
          <span className="font-medium text-slate-100">Rate limit window</span>
          <select
            name="rateLimitWindow"
            defaultValue="1m"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            {rateLimitWindows.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm text-slate-300">
          <span className="font-medium text-slate-100 flex items-center justify-between">
            Expires at
            <span className="text-xs text-slate-500">Optional</span>
          </span>
          <input
            type="date"
            name="expiresAt"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <fieldset className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
          <legend className="text-sm font-medium text-white">Permissions</legend>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" name="permissions" value="receipts:read" defaultChecked className="h-4 w-4 rounded border-slate-700 bg-slate-900" />
            Receipts: read
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" name="permissions" value="receipts:write" defaultChecked className="h-4 w-4 rounded border-slate-700 bg-slate-900" />
            Receipts: write
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" name="permissions" value="analytics:read" className="h-4 w-4 rounded border-slate-700 bg-slate-900" />
            Analytics access
          </label>
        </fieldset>

        <label className="space-y-2 text-sm text-slate-300">
          <span className="font-medium text-slate-100 flex items-center justify-between">
            IP restrictions
            <span className="text-xs text-slate-500">Comma or newline separated</span>
          </span>
          <textarea
            name="ipRestrictions"
            rows={4}
            placeholder="203.0.113.10\n198.51.100.0/24"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </label>
      </div>

      <SubmitButton label="Create API key" />
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-disabled={pending}
      className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400 aria-disabled:cursor-not-allowed aria-disabled:opacity-70"
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
