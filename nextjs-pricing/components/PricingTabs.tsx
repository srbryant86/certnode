'use client'

import { useState, Suspense } from 'react'
import PricingTable from './PricingTable'
import EnterpriseSavingsCalculator from './EnterpriseSavingsCalculator'
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
    label: 'Standard Plans',
    description: 'Choose from our pre-configured plans'
  },
  {
    id: 'custom',
    label: 'Custom Pricing',
    description: 'Get pricing tailored to your volume'
  },
  {
    id: 'high-ticket',
    label: 'High-Ticket Protection',
    description: 'Specialized dispute protection plans'
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
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>}>
                <PricingTable tiers={pricingData.smbTiers} highlightTier="growth" />
              </Suspense>
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <EnterpriseSavingsCalculator />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Get Custom Pricing for Your Volume
              </h3>
              <p className="text-gray-600">
                Use our calculator to see exactly what CertNode will cost for your specific needs.
                Volumes over 2,500 receipts/month automatically qualify for enterprise pricing.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <EnterpriseSavingsCalculator />

              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 mb-2">🎯</div>
                    <h4 className="font-semibold text-gray-900 mb-1">Precise Pricing</h4>
                    <p className="text-sm text-gray-600">Exact costs based on your volume and usage patterns</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 mb-2">💰</div>
                    <h4 className="font-semibold text-gray-900 mb-1">ROI Calculator</h4>
                    <p className="text-sm text-gray-600">See your projected savings from dispute deflection</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600 mb-2">⚡</div>
                    <h4 className="font-semibold text-gray-900 mb-1">Instant Quote</h4>
                    <p className="text-sm text-gray-600">Get pricing immediately or request enterprise consultation</p>
                  </div>
                </div>
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
                Specialized plans for businesses with high-value transactions and significant chargeback risk.
                One saved $10,000 dispute pays for 4 months.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Pro Dispute Protection */}
              <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Legal Shield</h4>
                  <div className="text-3xl font-bold text-blue-600 mb-1">$12,000</div>
                  <div className="text-sm text-gray-600">per year</div>
                  <div className="text-sm text-blue-600 font-medium mt-1">Up to $2M annual sales</div>
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
                  MOST POPULAR
                </div>

                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Dispute Fortress</h4>
                  <div className="text-3xl font-bold text-purple-600 mb-1">$30,000</div>
                  <div className="text-sm text-gray-600">per year</div>
                  <div className="text-sm text-purple-600 font-medium mt-1">Up to $10M annual sales</div>
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
                All high-ticket plans include white-glove onboarding, dedicated support, and revenue protection guarantees.
                <br />
                <a href="mailto:contact@certnode.io" className="text-blue-600 hover:text-blue-700">
                  Contact us
                </a>{' '}
                for custom enterprise volumes above $10M annual sales.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
