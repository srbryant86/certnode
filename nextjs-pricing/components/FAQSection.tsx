'use client';

import { useState } from 'react';

interface FAQ {
  question: string;
  answer: string;
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQ[] = [
    {
      question: 'What happens if I exceed my receipt limit?',
      answer: 'You\'ll only pay for what you use beyond your plan limit at the overage rate (e.g., $0.05/receipt for Professional). No surprise fees - you can set spending caps in your dashboard to control costs.',
    },
    {
      question: 'Can I switch plans anytime?',
      answer: 'Yes! You can upgrade or downgrade anytime. Upgrades take effect immediately, and downgrades apply at your next billing cycle. You\'ll receive a pro-rated credit for any unused time.',
    },
    {
      question: 'What\'s included in the 60-day money-back guarantee?',
      answer: 'If CertNode doesn\'t reduce your disputes or meet your needs within 60 days, we\'ll refund your full payment - no questions asked. We\'re that confident in the value we provide.',
    },
    {
      question: 'Do you integrate with Stripe, Shopify, and other platforms?',
      answer: 'Yes! We integrate with all major payment processors (Stripe, PayPal, Square), e-commerce platforms (Shopify, WooCommerce), and content platforms. We also provide a REST API and webhooks for custom integrations.',
    },
    {
      question: 'How does the Receipt Graph work?',
      answer: 'Each receipt can cryptographically reference other receipts, creating a directed graph of proof. For example: Transaction Receipt → Content Receipt (product delivered) → Operations Receipt (customer confirmed). This creates an unbreakable chain of evidence across your entire business.',
    },
    {
      question: 'Is my data secure and compliant?',
      answer: 'Absolutely. We use industry-standard ES256 cryptographic signing, encrypt all data at rest and in transit, and maintain SOC 2 compliance. All receipts are independently verifiable and can be audited offline without CertNode\'s infrastructure.',
    },
    {
      question: 'What if I need custom features or higher volume?',
      answer: 'Contact our enterprise team at enterprise@certnode.io. We offer custom plans for high-volume businesses, white-label solutions, dedicated infrastructure, and custom feature development.',
    },
    {
      question: 'How long does implementation take?',
      answer: 'Most customers are up and running in less than 1 hour using our SDKs (Node.js, Python, Go). For enterprise integrations with custom workflows, we provide dedicated implementation support (typically 1-2 weeks).',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 md:p-10 shadow-lg">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
            FREQUENTLY ASKED QUESTIONS
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Got Questions? We've Got Answers
          </h2>
          <p className="text-gray-700 text-base md:text-lg">
            Everything you need to know about CertNode pricing and platform.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`border-2 rounded-lg transition-all ${
                openIndex === index
                  ? 'border-blue-600 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Question */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left p-5 flex items-start justify-between gap-4 group"
              >
                <span className={`font-semibold text-lg ${
                  openIndex === index ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {faq.question}
                </span>
                <svg
                  className={`w-6 h-6 flex-shrink-0 transition-transform ${
                    openIndex === index
                      ? 'rotate-180 text-blue-600'
                      : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Answer */}
              {openIndex === index && (
                <div className="px-5 pb-5 pt-0">
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-10 text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-bold text-gray-900 mb-2">Still have questions?</h3>
          <p className="text-gray-600 mb-4">
            Our team is here to help. Get in touch and we'll answer any questions you have.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:contact@certnode.io"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </a>
            <a
              href="/platform"
              className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
            >
              Learn More About the Platform
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
