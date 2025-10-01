export default function TrustBadges() {
  return (
    <div className="border-t border-gray-200 pt-8 mt-8">
      <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
        {/* SOC 2 */}
        <div className="flex items-center gap-2">
          <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z"/>
          </svg>
          <div>
            <div className="font-semibold text-gray-700 text-sm">SOC 2 Type II</div>
            <div className="text-xs text-gray-500">Compliant</div>
          </div>
        </div>

        {/* Stripe */}
        <div className="flex items-center gap-2">
          <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
          </svg>
          <div>
            <div className="font-semibold text-gray-700 text-sm">Powered by Stripe</div>
            <div className="text-xs text-gray-500">Secure Payments</div>
          </div>
        </div>

        {/* SSL */}
        <div className="flex items-center gap-2">
          <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
          <div>
            <div className="font-semibold text-gray-700 text-sm">256-bit SSL</div>
            <div className="text-xs text-gray-500">Bank-level Security</div>
          </div>
        </div>

        {/* GDPR */}
        <div className="flex items-center gap-2">
          <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm2-1.645A3.502 3.502 0 0012 6.5a3.501 3.501 0 00-3.433 2.813l1.962.393A1.5 1.5 0 1112 11.5a1 1 0 00-1 1V14h2v-.645z"/>
          </svg>
          <div>
            <div className="font-semibold text-gray-700 text-sm">GDPR Ready</div>
            <div className="text-xs text-gray-500">Privacy Compliant</div>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Trusted by developers and enterprises worldwide • 99.9% uptime SLA
      </p>
    </div>
  );
}
