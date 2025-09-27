"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { loginAction, type AuthFormState } from "../actions";
import { AuthSubmitButton } from "../components/submit-button";

const INITIAL_STATE: AuthFormState = { status: "idle" };

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, INITIAL_STATE);

  return (
    <form className="space-y-6" action={formAction}>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
        <p className="text-sm text-slate-400">
          Sign in with your CertNode enterprise credentials.
        </p>
      </div>

      {state.status === "error" ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {state.message}
        </div>
      ) : null}

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-200">
            Work email
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            placeholder="you@enterprise.com"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-200">
            Password
          </span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            placeholder="••••••••"
            minLength={8}
          />
        </label>
      </div>

      <AuthSubmitButton label="Sign in" />

      <p className="text-center text-sm text-slate-400">
        Need an account?{" "}
        <Link className="text-blue-400 hover:text-blue-300" href="/register">
          Request access
        </Link>
      </p>
    </form>
  );
}
