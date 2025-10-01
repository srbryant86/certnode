import { Metadata } from 'next';
import { Suspense } from 'react';
import PricingTabs from '@/components/PricingTabs';
import Pillars from '@/components/Pillars';
import CTAGroup from '@/components/CTAGroup';
import ConsentBanner from '@/components/ConsentBanner';
import Footer from '@/components/Footer';
import PlanRecommendation from '@/components/PlanRecommendation';
import SmartRecommendationBanner from '@/components/SmartRecommendationBanner';
import SocialProofWidget from '@/components/SocialProofWidget';
import UrgencyTrigger from '@/components/UrgencyTrigger';
import RiskReversalSection from '@/components/RiskReversalSection';
import ThreeProductShowcase from '@/components/ThreeProductShowcase';
import ROICalculator from '@/components/ROICalculator';
import CompetitorComparison from '@/components/CompetitorComparison';
import FAQSection from '@/components/FAQSection';

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

const jsonLdProducts = pricingData.coreTiers.map(tier => ({
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
        {/* 1. Hero Section - Hook attention, establish credibility */}
        <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white py-20 overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-100 px-4 py-2 rounded-full text-sm font-medium mb-6">
                🔐 Enterprise Security & Compliance
              </div>

              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Enterprise-grade transaction records.<br />
                <span className="text-transparent bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text">
                  Audit-ready from day one.
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-8 leading-relaxed">
                Cryptographic receipts that satisfy compliance teams, <strong className="text-white">CFOs, and external auditors.</strong>
              </p>

              {/* Key Benefits */}
              <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>SOX controls & SOC 2 readiness</span>
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
                  <span>Enterprise SSO ready</span>
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
                  href="/trust"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2"
                >
                  Visit the Trust Center
                </a>
              </div>

              <p className="text-blue-200 text-sm">
                Enterprise-grade infrastructure • SOX compliant • Secure payments by Stripe
              </p>
            </div>
          </div>
        </section>

        {/* 2. Competitor Comparison - Create FOMO & justify premium pricing BEFORE price reveal */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <CompetitorComparison />
          </div>
        </section>

        {/* 3. Three Product Showcase - Show what's included after differentiation */}
        <ThreeProductShowcase />

        {/* 4. Pricing Tabs - THE ANCHOR: Show pricing after value is established */}
        <section className="py-16 bg-gray-50" id="pricing-table">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Enterprise-ready compliance infrastructure
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Cryptographic receipt technology that scales with your business. SOX compliant, audit-ready, enterprise-grade security from day one.
              </p>
            </div>

            <PricingTabs />

            <Suspense fallback={null}>
              <PlanRecommendation />
            </Suspense>
          </div>
        </section>

        {/* 5. ROI Calculator - Post-price justification: prove it pays for itself */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <ROICalculator />
          </div>
        </section>

        {/* 6. Risk Reversal - Remove purchase anxiety */}
        <RiskReversalSection />

        {/* 7. FAQ Section - Handle objections while engaged */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <FAQSection />
          </div>
        </section>

        {/* 8. High-Ticket CTA - Final conversion push */}
        <section className="py-16 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Protect Your Revenue?
            </h2>
            <p className="text-xl text-blue-100 mb-6">
              Join businesses saving thousands in disputes and compliance costs.
            </p>
            <p className="text-blue-200 mb-8">
              One saved $10,000 dispute pays for months of CertNode. Start with our 60-day money-back guarantee.
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
