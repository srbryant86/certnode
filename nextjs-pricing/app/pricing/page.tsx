import { Metadata } from 'next';
import { Suspense } from 'react';
import PricingTable from '@/components/PricingTable';
import ROIWidget from '@/components/ROIWidget';
import Pillars from '@/components/Pillars';
import CTAGroup from '@/components/CTAGroup';
import ConsentBanner from '@/components/ConsentBanner';
import Footer from '@/components/Footer';
import PlanRecommendation from '@/components/PlanRecommendation';
import SmartRecommendationBanner from '@/components/SmartRecommendationBanner';
import SocialProofWidget from '@/components/SocialProofWidget';
import UrgencyTrigger from '@/components/UrgencyTrigger';
import RiskReversalSection from '@/components/RiskReversalSection';

// Import pricing data
import pricingData from '../(data)/pricing.json';
import fxData from '../(data)/fx.json';

export const metadata: Metadata = {
  title: 'Pricing — CertNode Cryptographic Receipt Platform',
  description: 'Transparent pricing for CertNode cryptographic receipt platform. Developer plans start free, Professional solutions from $199/month. Enterprise security standards.',
  openGraph: {
    title: 'Pricing — CertNode Cryptographic Receipt Platform',
    description: 'Transparent pricing for cryptographic receipt infrastructure. Free developer tier, professional plans, and business solutions.',
    type: 'website',
    url: 'https://certnode.io/pricing',
  },
  twitter: {
    card: 'summary',
    title: 'Pricing — CertNode',
    description: 'Transparent pricing for cryptographic receipt infrastructure.',
  },
};

const jsonLdProducts = pricingData.smbTiers.map(tier => ({
  "@type": "Product",
  "name": `CertNode ${tier.name}`,
  "description": tier.tagline,
  "offers": {
    "@type": "Offer",
    "price": tier.priceMonthly,
    "priceCurrency": "USD",
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": tier.priceMonthly,
      "priceCurrency": "USD",
      "billingIncrement": "P1M"
    }
  }
}));

const jsonLdFAQ = {
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How is monthly/annual pricing calculated?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Monthly plans are billed at the listed rate. Annual plans offer 2 months free (10x monthly rate for 12 months of service)."
      }
    },
    {
      "@type": "Question",
      "name": "What is a receipt?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A receipt is a cryptographic proof of a digital transaction, providing immutable evidence for disputes, audits, and compliance."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need FanBasis or Stripe?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CertNode works with any payment processor. We integrate with Stripe, FanBasis, and other major payment platforms."
      }
    }
  ]
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              ...jsonLdProducts,
              jsonLdFAQ
            ]
          })
        }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white py-20 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>

          <div className="relative max-w-7xl mx-auto px-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-100 px-4 py-2 rounded-full text-sm font-medium mb-6">
                🔐 Enterprise Security & Compliance
              </div>

              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Protect every sale.<br />
                <span className="text-transparent bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text">
                  Build unshakeable trust.
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-8 leading-relaxed">
                Contracts convince lawyers. <strong className="text-white">CertNode receipts convince banks.</strong>
              </p>

              {/* Key Benefits */}
              <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Instant API access</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>99.9% uptime SLA</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Free developer sandbox</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <a
                  href="#pricing-table"
                  className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  View Pricing Plans
                </a>
                <a
                  href="/analytics"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2"
                >
                  📊 Analytics Dashboard
                </a>
              </div>

              <p className="text-blue-200 text-sm">
                Trusted by developers and enterprises • Secure checkout by Stripe
              </p>
            </div>
          </div>
        </section>

        {/* Three Pillars */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <Pillars />
          </div>
        </section>

        {/* Social Proof - Temporarily disabled to remove fake metrics */}
        {/* <section className="py-8">
          <div className="max-w-7xl mx-auto px-6">
            <SocialProofWidget />
          </div>
        </section> */}

        {/* Pricing Table */}
        <section className="py-16 bg-white" id="pricing-table">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Choose the plan that fits your business size. All plans include our core cryptographic receipt technology.
              </p>
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
                <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>}>
                  <PricingTable tiers={pricingData.smbTiers} highlightTier="growth" />
                </Suspense>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-6">
                  <ROIWidget />
                </div>
              </div>
            </div>

            <Suspense fallback={null}>
              <PlanRecommendation />
            </Suspense>
          </div>
        </section>

        {/* Risk Reversal */}
        <RiskReversalSection />

        {/* High-Ticket CTA */}
        <section className="py-16 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">
              High-Ticket Dispute Protection
            </h2>
            <p className="text-xl text-gray-300 mb-6">
              One saved $10,000 dispute pays for 4 months.
            </p>
            <p className="text-gray-400 mb-8">
              Specialized plans for businesses with high-value transactions and significant chargeback risk.
            </p>
            <CTAGroup />
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>

      {/* Consent Banner */}
      <ConsentBanner />

      {/* Smart Recommendation Banner */}
      <SmartRecommendationBanner />

      {/* Urgency Trigger */}
      <UrgencyTrigger />
    </>
  );
}