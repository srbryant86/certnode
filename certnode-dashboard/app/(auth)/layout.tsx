import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="h-8 w-8 rounded-full bg-blue-500/90" />
          <span className="text-lg font-semibold tracking-tight">CertNode Dashboard</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-800/70 bg-slate-900/70 p-8 shadow-xl shadow-blue-500/10">
          {children}
        </div>
      </main>
      <footer className="px-6 pb-6 text-sm text-slate-500">
        Built for enterprise trust • Universal receipt protocol
      </footer>
    </div>
  );
}
