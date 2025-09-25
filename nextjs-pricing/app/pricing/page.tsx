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
  description: 'Transparent pricing for CertNode cryptographic receipt platform. Developer plans start free, Professional solutions from $199/month. SOC 2 Type II ready.',
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
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Protect every sale. Build trust with customers, affiliates, and banks.
              </h1>
              <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-6">
                Contracts convince lawyers. CertNode receipts convince banks.
              </p>

              {/* Analytics Dashboard Link */}
              <div className="mt-6">
                <a
                  href="/analytics"
                  className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  📊 View Analytics Dashboard
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Three Pillars */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <Pillars />
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-6">
            <SocialProofWidget />
          </div>
        </section>

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
              One saved $6,000 dispute pays for half a year.
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