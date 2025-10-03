'use client';

import { useState, useRef, useEffect } from 'react';

type MessageRole = 'agent' | 'user';

type Message = {
  role: MessageRole;
  content: string;
  timestamp: Date;
};

type LeadData = {
  businessType?: string;
  monthlyVolume?: string;
  painPoint?: string;
  company?: string;
  name?: string;
  email?: string;
  phone?: string;
};

type ConversationStage =
  | 'greeting'
  | 'business_type'
  | 'volume'
  | 'pain_point'
  | 'recommendation'
  | 'contact_info'
  | 'complete';

export default function SalesAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [stage, setStage] = useState<ConversationStage>('greeting');
  const [leadData, setLeadData] = useState<LeadData>({});
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      setTimeout(() => {
        addAgentMessage(
          "👋 Hi! I'm the CertNode Sales Assistant. I'll help you find the perfect plan for your business.\n\nWhat type of business are you running?"
        );
        addAgentMessage(
          "1️⃣ E-commerce / Retail\n2️⃣ SaaS / Software\n3️⃣ Content / Media Platform\n4️⃣ Logistics / Supply Chain\n5️⃣ Financial Services\n6️⃣ Other"
        );
      }, 500);
    }
  }, [isOpen]);

  const addAgentMessage = (content: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'agent',
        content,
        timestamp: new Date()
      }]);
      setIsTyping(false);
    }, 800);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      role: 'user',
      content,
      timestamp: new Date()
    }]);
  };

  const getRecommendation = (data: LeadData): { tier: string; price: string; reason: string } => {
    const { businessType, monthlyVolume, painPoint } = data;

    // High-ticket or dispute-heavy = Dispute Shield
    if (painPoint?.toLowerCase().includes('dispute') ||
        painPoint?.toLowerCase().includes('chargeback') ||
        painPoint?.toLowerCase().includes('fraud')) {

      const volumeNum = parseVolume(monthlyVolume || '');
      const annualGMV = volumeNum * 12;

      if (annualGMV > 2000000) {
        return {
          tier: 'Dispute Shield Elite',
          price: '$2,500/month ($30K/year)',
          reason: 'Your volume and dispute prevention needs require our premium tier with 24-hour priority SLA, processor advocacy, and performance guarantees.'
        };
      } else {
        return {
          tier: 'Dispute Shield Pro',
          price: '$1,000/month ($12K/year)',
          reason: 'Perfect for dispute prevention with 48-hour evidence SLA, automated receipt generation, and quarterly optimization reviews.'
        };
      }
    }

    // Volume-based recommendations for general use
    const volumeNum = parseVolume(monthlyVolume || '');

    if (volumeNum < 100000) {
      return {
        tier: 'Starter',
        price: '$49/month',
        reason: 'Great starting point with all core features and 1,000 receipts/month.'
      };
    } else if (volumeNum < 300000) {
      return {
        tier: 'Professional',
        price: '$199/month',
        reason: 'Includes webhooks, advanced analytics, and 5,000 receipts/month.'
      };
    } else if (volumeNum < 1000000) {
      return {
        tier: 'Scale',
        price: '$499/month',
        reason: 'Multi-tenant, SSO, compliance reporting, and 10,000 receipts/month.'
      };
    } else {
      return {
        tier: 'Enterprise Core Trust',
        price: 'Starting at $2,083/month ($25K/year)',
        reason: 'Unlimited receipts, dedicated support, custom SLAs, and enterprise features.'
      };
    }
  };

  const parseVolume = (volume: string): number => {
    const num = parseFloat(volume.replace(/[^0-9.]/g, ''));
    if (volume.toLowerCase().includes('k')) return num * 1000;
    if (volume.toLowerCase().includes('m')) return num * 1000000;
    return num || 0;
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    addUserMessage(inputValue);
    processInput(inputValue);
    setInputValue('');
  };

  const processInput = (input: string) => {
    const lowerInput = input.toLowerCase();

    switch (stage) {
      case 'greeting':
      case 'business_type':
        // Detect business type
        let businessType = '';
        if (lowerInput.includes('ecommerce') || lowerInput.includes('e-commerce') || lowerInput.includes('retail') || lowerInput === '1') {
          businessType = 'E-commerce / Retail';
        } else if (lowerInput.includes('saas') || lowerInput.includes('software') || lowerInput === '2') {
          businessType = 'SaaS / Software';
        } else if (lowerInput.includes('content') || lowerInput.includes('media') || lowerInput.includes('platform') || lowerInput === '3') {
          businessType = 'Content / Media Platform';
        } else if (lowerInput.includes('logistics') || lowerInput.includes('supply') || lowerInput === '4') {
          businessType = 'Logistics / Supply Chain';
        } else if (lowerInput.includes('financial') || lowerInput.includes('fintech') || lowerInput.includes('finance') || lowerInput === '5') {
          businessType = 'Financial Services';
        } else {
          businessType = 'Other';
        }

        setLeadData(prev => ({ ...prev, businessType }));
        setStage('volume');

        setTimeout(() => {
          addAgentMessage(
            `Great! For ${businessType}, what's your approximate monthly transaction volume or GMV?\n\n(e.g., "$50K", "$500K", "$2M")`
          );
        }, 500);
        break;

      case 'volume':
        setLeadData(prev => ({ ...prev, monthlyVolume: input }));
        setStage('pain_point');

        setTimeout(() => {
          addAgentMessage(
            "What's your biggest challenge right now?\n\n1️⃣ Chargebacks & Disputes\n2️⃣ Compliance & Audits\n3️⃣ Fraud Prevention\n4️⃣ Content Authenticity\n5️⃣ Operations Documentation\n6️⃣ Other"
          );
        }, 500);
        break;

      case 'pain_point':
        let painPoint = input;
        if (lowerInput === '1' || lowerInput.includes('chargeback') || lowerInput.includes('dispute')) {
          painPoint = 'Chargebacks & Disputes';
        } else if (lowerInput === '2' || lowerInput.includes('compliance') || lowerInput.includes('audit')) {
          painPoint = 'Compliance & Audits';
        } else if (lowerInput === '3' || lowerInput.includes('fraud')) {
          painPoint = 'Fraud Prevention';
        } else if (lowerInput === '4' || lowerInput.includes('content') || lowerInput.includes('authenticity')) {
          painPoint = 'Content Authenticity';
        } else if (lowerInput === '5' || lowerInput.includes('operations') || lowerInput.includes('documentation')) {
          painPoint = 'Operations Documentation';
        }

        setLeadData(prev => ({ ...prev, painPoint }));
        setStage('recommendation');

        const updatedData = { ...leadData, painPoint };
        const recommendation = getRecommendation(updatedData);

        setTimeout(() => {
          addAgentMessage(
            `Based on your needs, I recommend:\n\n**${recommendation.tier}** - ${recommendation.price}\n\n${recommendation.reason}\n\n✅ All three products included (Transactions, Content, Operations)\n✅ Cross-domain Receipt Graph\n✅ Cryptographic verification\n✅ 60-day money-back guarantee`
          );

          setTimeout(() => {
            addAgentMessage(
              "Would you like to:\n\n1️⃣ Schedule a demo\n2️⃣ Start a free trial\n3️⃣ Get a custom quote\n4️⃣ Talk to our team"
            );
            setStage('contact_info');
          }, 1500);
        }, 800);
        break;

      case 'contact_info':
        if (lowerInput.includes('@')) {
          // Email provided
          setLeadData(prev => ({ ...prev, email: input }));
          setTimeout(() => {
            addAgentMessage("Perfect! And your name?");
          }, 500);
        } else if (leadData.email && !leadData.name) {
          // Name provided
          setLeadData(prev => ({ ...prev, name: input }));
          setTimeout(() => {
            addAgentMessage("Great! Company name?");
          }, 500);
        } else if (leadData.email && leadData.name && !leadData.company) {
          // Company provided
          const finalLeadData = { ...leadData, company: input };
          setLeadData(finalLeadData);
          setStage('complete');

          // Submit to API
          fetch('/api/sales-lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...finalLeadData,
              recommendedTier: getRecommendation(finalLeadData).tier,
              recommendedPrice: getRecommendation(finalLeadData).price
            })
          }).then(res => res.json())
            .then(data => console.log('Lead submitted:', data))
            .catch(err => console.error('Error submitting lead:', err));

          setTimeout(() => {
            addAgentMessage(
              `Thanks ${leadData.name}! 🎉\n\nI've sent your information to our sales team. You'll hear from us within 24 hours.\n\nIn the meantime:\n📊 Check out our [ROI Calculator](/pricing)\n🔍 Explore the [Receipt Graph Demo](/platform)\n📚 Read our [Documentation](/platform)`
            );
          }, 800);
        } else {
          // Initial contact request
          setTimeout(() => {
            addAgentMessage("Great! What's your email address?");
          }, 500);
        }
        break;

      default:
        addAgentMessage("I'm here to help! Let me know if you have any questions about CertNode.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all z-50 flex items-center gap-2 group"
        >
          <span className="hidden group-hover:inline-block text-sm font-semibold mr-2">Talk to Sales</span>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border-2 border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                🤖
              </div>
              <div>
                <div className="font-bold">CertNode Sales Assistant</div>
                <div className="text-xs text-blue-100">Powered by AI</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-line text-sm">{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              Press Enter to send
            </div>
          </div>
        </div>
      )}
    </>
  );
}
