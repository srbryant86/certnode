'use client';

import { useState } from 'react';
import { PricingAnalytics } from '@/lib/analytics';

interface Guarantee {
  title: string;
  description: string;
  icon: string;
  feature: string;
}

export default function RiskReversalSection() {
  const [analytics] = useState(() => PricingAnalytics.getInstance());

  const guarantees: Guarantee[] = [
    {
      title: "60-Day Money-Back Guarantee",
      description: "If CertNode doesn't deflect disputes and save you money within 60 days, get a full refund.",
      icon: "🛡️",
      feature: "dispute_deflection"
    },
    {
      title: "99.9% Uptime SLA",
      description: "Your receipts are generated 24/7. If we go down, you get service credits automatically.",
      icon: "⚡",
      feature: "uptime_guarantee"
    },
    {
      title: "Enterprise Security",
      description: "Your transaction data is protected with industry-standard encryption and security practices.",
      icon: "🔒",
      feature: "security_compliance"
    },
    {
      title: "Transparent Pricing",
      description: "No hidden fees, setup costs, or surprise charges. What you see is what you pay.",
      icon: "💰",
      feature: "transparent_pricing"
    },
    {
      title: "No Long-term Contracts",
      description: "Cancel anytime with 30 days notice. No setup fees, no hidden costs, no commitments.",
      icon: "📋",
      feature: "flexible_terms"
    }
  ];

  const handleGuaranteeClick = (guarantee: Guarantee) => {
    analytics.trackInteraction('risk_reversal_clicked', {
      guarantee: guarantee.feature,
      title: guarantee.title
    });
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Risk-Free Guarantee
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're so confident CertNode will protect your revenue that we offer a 60-day money-back guarantee.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {guarantees.map((guarantee, index) => (
            <div
              key={index}
              onClick={() => handleGuaranteeClick(guarantee)}
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer group"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {guarantee.icon}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {guarantee.title}
              </h3>

              <p className="text-gray-600 text-sm leading-relaxed">
                {guarantee.description}
              </p>
            </div>
          ))}
        </div>

        {/* Security Features */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              </span>
              Encrypted Data Storage
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              </span>
              Privacy Focused
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              </span>
              Security Best Practices
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              </span>
              Regular Security Reviews
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Protect Your Revenue?
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Enterprise-grade cryptographic receipt technology designed for revenue protection.
              Get started with our 60-day money-back guarantee.
            </p>

            <button
              onClick={() => {
                analytics.trackInteraction('final_cta_clicked', {
                  location: 'risk_reversal_section',
                  cta_text: 'Get Started Risk-Free'
                });

                const pricingSection = document.getElementById('pricing-table');
                if (pricingSection) {
                  pricingSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started Risk-Free →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}