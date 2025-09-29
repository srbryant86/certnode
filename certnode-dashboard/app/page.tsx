import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="text-lg font-semibold text-white">CertNode</div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Digital Trust Platform for the AI Era
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto">
            Comprehensive cryptographic verification for transactions, content authenticity, and operational trust.
            Build confidence in digital interactions with advanced AI detection and blockchain-grade security.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-blue-700"
            >
              Start Free Trial
            </Link>
            <Link
              href="#demo"
              className="rounded-lg border border-slate-700 px-8 py-3 text-lg font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              See Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Three Pillars */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Three Pillars of Digital Trust
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Transaction Receipts */}
          <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700/50">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Transaction Receipts</h3>
            <p className="text-slate-400 mb-6">
              Cryptographic verification for digital transactions with SOC 2 Type II readiness and hardware security modules.
            </p>
            <ul className="text-sm text-slate-300 space-y-2">
              <li>• Immutable transaction proofs</li>
              <li>• Multi-tenant architecture</li>
              <li>• Enterprise compliance ready</li>
              <li>• Real-time verification</li>
            </ul>
          </div>

          {/* Content Authenticity */}
          <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700/50">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Content Authenticity</h3>
            <p className="text-slate-400 mb-6">
              Advanced AI detection with 90%+ accuracy for text and images. Detect generated content before it spreads.
            </p>
            <ul className="text-sm text-slate-300 space-y-2">
              <li>• GPT-4, Claude, Gemini detection</li>
              <li>• Image metadata forensics</li>
              <li>• Perplexity analysis</li>
              <li>• Real-time confidence scoring</li>
            </ul>
          </div>

          {/* Operational Trust */}
          <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700/50">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Operational Trust</h3>
            <p className="text-slate-400 mb-6">
              Complete transparency for system operations, deployments, and infrastructure changes.
            </p>
            <ul className="text-sm text-slate-300 space-y-2">
              <li>• Deployment verification</li>
              <li>• System state proofs</li>
              <li>• Audit trail integrity</li>
              <li>• Infrastructure transparency</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Content Authenticity Spotlight */}
      <section id="demo" className="mx-auto max-w-6xl px-6 py-16">
        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-2xl p-12 border border-blue-700/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Stop AI-Generated Content Before It Spreads
              </h2>
              <p className="text-lg text-slate-300 mb-8">
                Our proprietary algorithms detect AI-generated text and images with industry-leading accuracy.
                Get real-time analysis with confidence scoring and model identification.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-slate-300">90%+ detection accuracy</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-slate-300">Multi-model fingerprinting</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-slate-300">Real-time API responses</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-slate-300">Image metadata analysis</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <div className="text-sm text-slate-400 mb-2">Content Analysis Result</div>
              <div className="bg-slate-900 rounded p-4 font-mono text-sm">
                <div className="text-red-400 mb-2">⚠️ AI Generated Content Detected</div>
                <div className="text-slate-300 mb-2">Confidence: <span className="text-red-400 font-semibold">87%</span></div>
                <div className="text-slate-300 mb-2">Model: <span className="text-yellow-400">GPT-4</span></div>
                <div className="text-slate-400 text-xs">
                  Indicators: high_formality, low_perplexity_score, gpt4_signature
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Build Digital Trust?
          </h2>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Join enterprises using CertNode to verify transactions, authenticate content, and ensure operational transparency.
          </p>
          <Link
            href="/register"
            className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition hover:bg-blue-700"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 mt-20">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="text-center text-slate-400">
            <p>&copy; 2025 CertNode. Building trust in the digital age. v2.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
