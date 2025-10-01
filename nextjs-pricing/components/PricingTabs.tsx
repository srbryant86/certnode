'use client'

import { useState, Suspense } from 'react'
import PricingTable from './PricingTable'
// Removed TriPillarIntelligenceCalculator - focusing on deterministic proof rail
import pricingData from '../app/(data)/pricing.json'

type TabId = 'standard' | 'custom' | 'high-ticket'

interface Tab {
  id: TabId
  label: string
  description: string
}

const tabs: Tab[] = [
  {
    id: 'standard',
    label: 'Core Trust',
    description: 'Deterministic receipts with cryptographic proof'
  },
  {
    id: 'custom',
    label: 'Enterprise & Platforms',
    description: 'Multi-tenant infrastructure and marketplace solutions'
  },
  {
    id: 'high-ticket',
    label: 'High-Ticket Shield',
    description: 'Premium transaction protection with white-glove service'
  }
]

export default function PricingTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('standard')

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-base font-semibold">{tab.label}</div>
              <div className="text-xs text-gray-500 mt-1">{tab.description}</div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'standard' && (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Core Trust - Cryptographic Receipt Platform
              </h3>
              <p className="text-gray-600 max-w-3xl mx-auto">
                Generate cryptographic receipts for transactions, content, and operations. Enterprise-grade proof that's verifiable by anyone, anywhere, offline.
              </p>
            </div>
            <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>}>
              <PricingTable tiers={pricingData.coreTiers} highlightTier="core-professional" />
            </Suspense>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Enterprise Infrastructure
              </h3>
              <p className="text-gray-600 max-w-3xl mx-auto">
                Scalable receipt infrastructure for high-volume enterprises and multi-merchant platforms. Add optional ML-powered advisory intelligence.
              </p>
            </div>

            {/* Enterprise Tiers */}
            <div className="grid md:grid-cols-2 gap-8">
              {pricingData.enterpriseTiers.map((tier) => (
                <div key={tier.id} className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h4>
                    <div className="text-lg text-gray-600 mb-2">{tier.pricing}</div>
                    <div className="text-sm text-gray-500">{tier.tagline}</div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Contact Sales
                  </button>
                </div>
              ))}
            </div>

            {/* Advisory Intelligence Add-Ons */}
            <div className="bg-gray-50 rounded-xl p-8">
              <div className="text-center mb-8">
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Advisory Intelligence Add-Ons
                </h4>
                <p className="text-gray-600">
                  Optional ML-powered fraud detection, content verification, and anomaly alerts to complement your cryptographic receipts. Requires Core Trust subscription.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {pricingData.intelligenceAddOns.map((addon) => (
                  <div key={addon.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <h5 className="font-semibold text-gray-900 mb-2">{addon.name}</h5>
                    <div className="text-lg font-bold text-blue-600 mb-2">
                      ${addon.priceYearly.toLocaleString()}/year
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      {addon.inferences.toLocaleString()} inferences included
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {addon.features.slice(0, 4).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'high-ticket' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                High-Ticket Dispute Protection
              </h3>
              <p className="text-gray-600 mb-6">
                GMV-based protection for premium transactions and high-value businesses. White-glove service with dedicated dispute defense.
                One saved $10,000 dispute pays for 4 months.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Pro Dispute Protection */}
              <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Dispute Shield Pro</h4>
                  <div className="text-3xl font-bold text-blue-600 mb-1">$12,000</div>
                  <div className="text-sm text-gray-600">per year</div>
                  <div className="text-sm text-blue-600 font-medium mt-1">Up to $2M GMV</div>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">Unlimited receipts up to $2M annual sales</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">Priority dispute-deflection support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">Dedicated merchant success manager</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">Advanced chargeback protection</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">Real-time fraud monitoring</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">Custom integration support</span>
                  </li>
                </ul>

                <button
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  onClick={() => window.location.href = 'https://buy.stripe.com/28E7sK9rYces1s2fD7bAs09'}
                >
                  Get Started
                </button>
              </div>

              {/* Elite Dispute Protection */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-8 shadow-lg relative">
                <div className="absolute top-0 right-6 bg-purple-600 text-white px-3 py-1 rounded-b-lg text-xs font-semibold">
                  RECOMMENDED
                </div>

                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Dispute Shield Elite</h4>
                  <div className="text-3xl font-bold text-purple-600 mb-1">$30,000</div>
                  <div className="text-sm text-gray-600">per year</div>
                  <div className="text-sm text-purple-600 font-medium mt-1">Up to $10M GMV</div>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">Unlimited receipts up to $10M annual sales</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">SLA-backed dispute-deflection commitment</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">Affiliate attribution receipts included</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">White-glove onboarding</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">24/7 priority support</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">Custom compliance reporting</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm text-gray-700">Revenue protection guarantee</span>
                  </li>
                </ul>

                <button
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  onClick={() => window.location.href = 'https://buy.stripe.com/aFa7sK8nU1zO9YycqVbAs0b'}
                >
                  Get Started
                </button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                All plans include white-glove onboarding, dedicated support, and revenue protection guarantees.
                <br />
                <strong>Recommended:</strong> Upgrade to <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('standard'); }} className="text-blue-600 hover:text-blue-700 cursor-pointer">Core Trust</a> for cryptographic proof and maximum ROI.
                <br />
                <a href="mailto:contact@certnode.io" className="text-blue-600 hover:text-blue-700">
                  Contact us
                </a>{' '}
                for custom enterprise volumes.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
