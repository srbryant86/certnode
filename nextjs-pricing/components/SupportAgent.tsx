'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Sender = 'agent' | 'user';

type Message = {
  id: string;
  sender: Sender;
  content: string;
};

type EscalationState = {
  intent: 'support' | 'sales';
  reason: string;
  lastUserMessage: string;
};

const quickPrompts: Array<{ id: string; label: string; prompt: string }> = [
  { id: 'integration', label: 'Integration help', prompt: 'How do I issue the first receipt with the API?' },
  { id: 'demo', label: 'Enterprise demo', prompt: 'Can we schedule an enterprise demo and pricing review?' },
  { id: 'trust', label: 'Security posture', prompt: 'Where can I find SOC 2, uptime, and security documentation?' },
  { id: 'metering', label: 'Usage metering', prompt: 'How is usage metered across receipt types?' },
];

const escalationRules: Array<{ keywords: string[]; reason: string; intent: 'support' | 'sales' }> = [
  { keywords: ['security incident', 'breach', 'data leak', 'p1', 'sev1', 'urgent outage', 'downtime'], reason: 'Potential incident reported', intent: 'support' },
  { keywords: ['legal review', 'msa', 'procurement', 'security questionnaire'], reason: 'Enterprise procurement workflow', intent: 'sales' },
  { keywords: ['custom pricing', 'large contract', 'seven figure'], reason: 'Custom commercial structure', intent: 'sales' },
];

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalize(input: string): string {
  return input.trim().toLowerCase();
}

function classifyIntent(input: string): 'support' | 'sales' {
  const normalized = normalize(input);
  const supportHits = ['integrat', 'api', 'sdk', 'webhook', 'verify', 'trust', 'incident', 'sla'].filter(keyword => normalized.includes(keyword)).length;
  const salesHits = ['price', 'pricing', 'quote', 'cost', 'contract', 'demo', 'sales', 'budget'].filter(keyword => normalized.includes(keyword)).length;
  return supportHits >= salesHits ? 'support' : 'sales';
}

function detectEscalation(input: string): EscalationState | null {
  const normalized = normalize(input);
  for (const rule of escalationRules) {
    if (rule.keywords.some(keyword => normalized.includes(keyword))) {
      return {
        intent: rule.intent,
        reason: rule.reason,
        lastUserMessage: input.trim(),
      };
    }
  }
  return null;
}

function buildSupportResponse(input: string): string {
  const normalized = normalize(input);
  if (['verify', 'jwks', 'trust'].some(keyword => normalized.includes(keyword))) {
    return `Receipts verify against the public JWKS published at trust.certnode.io.\nEach receipt carries a detached JWS so partners can verify offline without calling our API.\nRegulated deployments should follow the caching guidance in the trust center notes.`;
  }
  if (['incident', 'downtime', 'outage'].some(keyword => normalized.includes(keyword))) {
    return `We run a 99.97 percent uptime SLA with redundant signing infrastructure and audit logging.\nVisit trust.certnode.io for live status, incident history, and security documentation.\nIf you believe you are seeing an outage, use the escalate button so the on call steward is paged.`;
  }
  return `Start with the platform docs at /platform for schema, signing, and verification details.\nGenerate an API key, sign the payload with ES256 or Ed25519, then POST to /api/receipts.\nSample payloads live in the /examples directory and the SDK repos so you can mirror our test vectors.`;
}

function buildSalesResponse(): string {
  return `Every tier unlocks all three receipt domains; pricing shifts with monthly receipts and compliance needs.\nGrowth adds SOC aligned controls and enterprise telemetry, while Business unlocks custom SLAs and signing enclaves.\nShare projected volume, regions, and compliance drivers and I will connect you with the right person.`;
}

export default function SupportAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      sender: 'agent',
      content: `I am the CertNode support steward. I can cover standards questions, integration patterns, pricing tiers, and security posture.\nAsk anything about receipts and I will escalate to a human when deeper collaboration is required.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [pendingEscalation, setPendingEscalation] = useState<EscalationState | null>(null);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const conversationSummary = useMemo(() => {
    return messages
      .slice(-6)
      .map(message => `${message.sender === 'agent' ? 'Agent' : 'You'}: ${message.content}`)
      .join('\n');
  }, [messages]);

  const escalationMailto = useMemo(() => {
    if (!pendingEscalation) {
      return null;
    }
    const subject = pendingEscalation.intent === 'sales' ? 'CertNode sales escalation' : 'CertNode support escalation';
    const body = [
      pendingEscalation.reason,
      '',
      'Conversation transcript:',
      conversationSummary || pendingEscalation.lastUserMessage,
    ].join('\n');
    return `mailto:contact@certnode.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [conversationSummary, pendingEscalation]);

  const handleUserMessage = (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: Message = {
      id: createMessageId(),
      sender: 'user',
      content: trimmed,
    };

    const escalation = detectEscalation(trimmed);
    const intent = classifyIntent(trimmed);
    const agentResponse = escalation
      ? [
          `I need to loop in our ${escalation.intent === 'sales' ? 'enterprise commercial team' : 'on call support steward'} for this.`,
          'I have noted your latest message so the right person can follow up.',
          'Use the escalate button below to send the thread to contact@certnode.io and we will respond quickly.',
        ].join('\n')
      : intent === 'sales'
        ? buildSalesResponse()
        : buildSupportResponse(trimmed);

    const agentMessage: Message = {
      id: createMessageId(),
      sender: 'agent',
      content: agentResponse,
    };

    setMessages(prev => [...prev, userMessage, agentMessage]);

    if (escalation) {
      setPendingEscalation(escalation);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleUserMessage(input);
    setInput('');
  };

  const handleQuickPrompt = (prompt: string) => {
    handleUserMessage(prompt);
  };

  const handleManualEscalation = () => {
    const lastUser = [...messages].reverse().find(message => message.sender === 'user');
    const baseText = lastUser?.content ?? 'Manual escalation requested without a specific question.';
    const intent = classifyIntent(baseText);
    const state: EscalationState = {
      intent,
      reason: 'Manual escalation requested from support page',
      lastUserMessage: baseText,
    };
    setPendingEscalation(state);
    setMessages(prev => [
      ...prev,
      {
        id: createMessageId(),
        sender: 'agent',
        content: [
          `I need to loop in our ${intent === 'sales' ? 'enterprise commercial team' : 'on call support steward'} for this.`,
          'I have noted your latest message so the right person can follow up.',
          'Use the escalate button below to send the thread to contact@certnode.io and we will respond quickly.',
        ].join('\n'),
      },
    ]);
  };

  const handleDismissEscalation = () => {
    setPendingEscalation(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div className="flex flex-col gap-2 border-b border-gray-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Receipt Support Agent</p>
          <p className="text-xs text-gray-500">Answers standards, integration, and pricing questions. Escalates to humans for complex requests.</p>
        </div>
        <button
          type="button"
          onClick={handleManualEscalation}
          className="inline-flex items-center justify-center rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
        >
          Escalate manually
        </button>
      </div>

      <div className="px-6 py-6">
        <div
          className="max-h-96 space-y-4 overflow-y-auto rounded-xl bg-gray-50 p-4"
          role="log"
          aria-live="polite"
          aria-label="AI support conversation"
        >
          {messages.map(message => (
            <div
              key={message.id}
              className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
                message.sender === 'agent'
                  ? 'border-blue-100 bg-blue-50 text-blue-900'
                  : 'border-gray-800 bg-gray-900 text-gray-100'
              }`}
            >
              <p className="font-semibold">{message.sender === 'agent' ? 'CertNode Agent' : 'You'}</p>
              <p className="whitespace-pre-line text-sm">{message.content}</p>
            </div>
          ))}
          <div ref={logRef} />
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label htmlFor="support-agent-input" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Ask a question
          </label>
          <textarea
            id="support-agent-input"
            value={input}
            onChange={event => setInput(event.target.value)}
            placeholder="Describe your support or sales question..."
            rows={4}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Include technical details or escalation keywords if you need a human handoff.</p>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </form>

        {pendingEscalation && (
          <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <p className="font-semibold">Escalation ready</p>
            <p className="mt-1 text-sm leading-6">{pendingEscalation.reason}. Share your preferred contact details so the team can respond.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {escalationMailto && (
                <a
                  href={escalationMailto}
                  className="inline-flex items-center justify-center rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
                >
                  Email the team
                </a>
              )}
              <button
                type="button"
                onClick={handleDismissEscalation}
                className="inline-flex items-center justify-center rounded-full border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
