'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Sender = 'agent' | 'user';

type Message = {
  id: string;
  sender: Sender;
  content: string;
};

type EscalationState = {
  reason: string;
  lastUserMessage: string;
  conversationHistory: string;
};

type IntentType = 'technical' | 'billing' | 'integration' | 'troubleshooting' | 'graph' | 'general';

const quickPrompts: Array<{ id: string; label: string; prompt: string }> = [
  { id: 'first-receipt', label: 'Create first receipt', prompt: 'How do I create my first receipt with the API?' },
  { id: 'graph-dag', label: 'Receipt graph DAG', prompt: 'How does the receipt graph DAG structure work?' },
  { id: 'troubleshoot-verify', label: 'Verification errors', prompt: 'My receipts are failing verification. How do I debug this?' },
  { id: 'link-receipts', label: 'Link receipts', prompt: 'How do I link receipts together to create a graph?' },
  { id: 'api-key-setup', label: 'API key setup', prompt: 'How do I set up my API key and authentication?' },
  { id: 'webhooks', label: 'Webhook setup', prompt: 'How do I configure webhooks for receipt events?' },
];

const escalationRules: Array<{ keywords: string[]; reason: string }> = [
  { keywords: ['api down', 'outage', 'not responding', '500 error', 'timeout', 'connection refused'], reason: 'Potential service outage reported' },
  { keywords: ['security incident', 'breach', 'unauthorized access', 'compromised key'], reason: 'Security incident reported' },
  { keywords: ['billing error', 'charged twice', 'wrong invoice', 'refund'], reason: 'Billing issue requires manual review' },
  { keywords: ['enterprise contract', 'custom sla', 'legal review'], reason: 'Enterprise support needed' },
  { keywords: ['data loss', 'receipts missing', 'critical bug'], reason: 'Critical issue requiring immediate attention' },
];

const knowledgeBase = {
  // Receipt Creation
  receiptCreation: {
    keywords: ['create receipt', 'first receipt', 'post /api/receipts', 'new receipt'],
    response: `**Creating Your First Receipt:**

\`\`\`typescript
// POST /api/receipts
const receipt = await fetch('https://certnode.io/api/receipts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    domain: 'transaction', // or 'content' or 'operations'
    type: 'payment',       // your custom label
    data: {
      amount: 150.00,
      currency: 'USD',
      stripe_id: 'ch_123'
    },
    parentIds: [] // empty for root receipt
  })
});
\`\`\`

**The receipt is completely flexible** - you control the \`type\` label and \`data\` payload.`
  },

  // Receipt Graph & DAG
  graphStructure: {
    keywords: ['graph', 'dag', 'link receipts', 'parent', 'child', 'relationship'],
    response: `**Receipt Graph (DAG) Structure:**

CertNode receipts form a **Directed Acyclic Graph (DAG)** - receipts can have multiple parents, creating complex verification chains.

**Creating linked receipts:**
\`\`\`typescript
// Step 1: Create root receipt
const payment = await createReceipt({
  domain: 'transaction',
  type: 'payment',
  data: { amount: 150 },
  parentIds: []
});

// Step 2: Link child receipt
const shipping = await createReceipt({
  domain: 'content',
  type: 'shipping-label',
  data: { tracking: 'FDX123' },
  parentIds: [payment.id]  // Links to payment
});

// Step 3: Multi-parent receipt (DAG merge)
const delivery = await createReceipt({
  domain: 'operations',
  type: 'delivery-confirmed',
  data: { signature: 'John Doe' },
  parentIds: [payment.id, shipping.id]  // TWO parents!
});
\`\`\`

**Tier limits affect graph depth:**
- FREE: 3 levels deep
- STARTER: 5 levels
- PROFESSIONAL: 10 levels
- ENTERPRISE: Unlimited`
  },

  // Verification
  verification: {
    keywords: ['verify', 'verification failed', 'signature', 'jwks', 'invalid', 'cryptographic'],
    response: `**Receipt Verification:**

Receipts are verified using our public JWKS at \`https://certnode.io/.well-known/jwks.json\`

**Common verification issues:**

1. **Invalid Signature** → Receipt was tampered with or corrupted
2. **JWKS fetch failed** → Check network/firewall rules
3. **Expired timestamp** → Receipt older than retention policy

**Verify a receipt:**
\`\`\`typescript
// Client-side verification (no CertNode dependency)
import { verifyJWT } from 'jose';

const jwks = await fetch('https://certnode.io/.well-known/jwks.json');
const verified = await verifyJWT(receipt.signature, jwks);
\`\`\`

**Offline verification is supported** - receipts include detached JWS for air-gapped systems.`
  },

  // API Authentication
  apiAuth: {
    keywords: ['api key', 'authentication', 'bearer token', 'unauthorized', '401', '403'],
    response: `**API Authentication:**

All requests require a Bearer token:

\`\`\`bash
curl -X POST https://certnode.io/api/receipts \\
  -H "Authorization: Bearer sk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"domain":"transaction","type":"payment","data":{}}'
\`\`\`

**Common auth errors:**
- \`401 Unauthorized\` → API key missing or malformed
- \`403 Forbidden\` → API key revoked or rate limit exceeded
- \`403 IP Restricted\` → Request from non-allowlisted IP

**Security best practices:**
- Never commit API keys to git
- Rotate keys every 90 days
- Use IP allowlisting for production keys
- Set rate limits appropriate to your usage`
  },

  // Three Domains
  domains: {
    keywords: ['three domains', 'transaction content operations', 'domain types'],
    response: `**Three Receipt Domains:**

CertNode provides **three cryptographically linked domains**:

🟢 **TRANSACTION** - Payments, refunds, transfers
- E-commerce checkouts
- Subscription billing
- Wire transfers

🟣 **CONTENT** - Media, documents, AI detection
- AI-generated content verification
- DMCA protection
- File delivery proof

🟠 **OPERATIONS** - Logs, attestations, compliance
- Access logs
- Incident reports
- Deployment provenance

**Cross-domain linking is the moat:**
Payment (🟢) → AI Content (🟣) → Access Log (🟠) → Refund (🟢)

This creates verification chains **competitors can't replicate** - Stripe only has transactions, C2PA only has content, audit log services only have operations.`
  },

  // Webhooks
  webhooks: {
    keywords: ['webhook', 'event', 'notification', 'callback'],
    response: `**Webhook Configuration:**

Subscribe to receipt events in your dashboard:

\`\`\`json
POST /api/webhooks
{
  "url": "https://yourapp.com/webhooks/certnode",
  "secret": "whsec_YOUR_SECRET",
  "events": [
    "receipt.created",
    "receipt.verified",
    "fraud.detected",
    "graph.updated"
  ]
}
\`\`\`

**Webhook payload structure:**
\`\`\`json
{
  "event": "receipt.created",
  "receipt": { /* full receipt */ },
  "timestamp": "2025-10-03T...",
  "signature": "sha256=..."
}
\`\`\`

**Verify webhook signatures:**
\`\`\`typescript
const signature = req.headers['x-certnode-signature'];
const payload = JSON.stringify(req.body);
const expectedSig = crypto
  .createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex');

if (signature !== \`sha256=\${expectedSig}\`) {
  throw new Error('Invalid signature');
}
\`\`\`

Webhooks retry 3 times with exponential backoff.`
  },

  // Industry Use Cases
  industryGuides: {
    keywords: ['e-commerce', 'saas', 'content creator', 'logistics', 'use case', 'example'],
    response: `**Industry-Specific Guides:**

**E-commerce/Retail:**
- Payment → Shipping Label → FedEx Tracking → Delivery Photo
- Defends chargebacks with 4-receipt proof chain

**SaaS/Software:**
- Payment → Access Granted → Session Logs → Feature Usage
- Proves service delivery for dispute defense

**Content Creators:**
- Original Upload → Blockchain Anchor → Monetization → Revenue
- Protects against DMCA/takedown claims

**Professional Services:**
- Payment → Deliverable → Client Access → Completion Proof
- Documents "work never completed" disputes

**High-Ticket Sales:**
- Payment → Materials → Sessions → Complaint → Investigation → Refund
- Creates auditable refund justification trail

All use the same flexible API - just different receipt types and linking patterns.`
  },

  // Kajabi/Course Platform Integration
  kajabiIntegration: {
    keywords: ['kajabi', 'teachable', 'thinkific', 'course platform', 'high ticket', 'login', 'content view', 'download'],
    response: `**Kajabi/Course Platform Integration for High-Ticket Sales:**

**How it works:**
1. Use Kajabi webhooks to trigger CertNode receipt creation
2. Create receipts for every student action (login, view, download)
3. Link receipts to create a complete engagement graph

**Example workflow:**

\`\`\`typescript
// 1. Payment receipt (when customer pays $15K)
const payment = await createReceipt({
  domain: 'transaction',
  type: 'payment',
  data: {
    amount: 15000,
    currency: 'USD',
    kajabi_order_id: 'ord_123',
    student_email: 'customer@example.com'
  }
});

// 2. Course access granted
const access = await createReceipt({
  domain: 'operations',
  type: 'course-access-granted',
  data: {
    kajabi_product_id: 'prod_456',
    course_name: 'Elite Coaching Program',
    access_date: '2025-10-03'
  },
  parentIds: [payment.id]
});

// 3. Student login (track every login via Kajabi webhook)
const login = await createReceipt({
  domain: 'operations',
  type: 'student-login',
  data: {
    login_timestamp: '2025-10-03T14:30:00Z',
    ip_address: '192.168.1.1',
    device: 'Chrome on MacOS'
  },
  parentIds: [access.id]
});

// 4. Content view (lesson completed)
const lessonView = await createReceipt({
  domain: 'content',
  type: 'lesson-viewed',
  data: {
    lesson_id: 'lesson_789',
    lesson_title: 'Module 3: Advanced Strategies',
    watch_time_minutes: 47,
    completion_percentage: 100
  },
  parentIds: [login.id]
});

// 5. Resource download
const download = await createReceipt({
  domain: 'content',
  type: 'resource-downloaded',
  data: {
    file_name: 'workbook.pdf',
    file_size_mb: 2.4,
    download_timestamp: '2025-10-03T15:15:00Z'
  },
  parentIds: [lessonView.id]
});
\`\`\`

**Kajabi Webhook Setup:**

1. **In Kajabi Admin:**
   - Settings → Webhooks → Add Webhook
   - URL: \`https://yourserver.com/kajabi-webhook\`
   - Events: \`offer.purchased\`, \`course.completed\`, \`member.logged_in\`

2. **Your webhook handler:**
\`\`\`typescript
app.post('/kajabi-webhook', async (req, res) => {
  const event = req.body;

  if (event.type === 'member.logged_in') {
    await createReceipt({
      domain: 'operations',
      type: 'student-login',
      data: event.data
    });
  }

  res.status(200).send('OK');
});
\`\`\`

**For refund disputes:**
When a student requests a refund claiming "never got access", your receipt graph proves:
- Payment receipt ✓
- 47 logins ✓
- 12 lessons completed (89 min watch time) ✓
- 23 resource downloads ✓

**This creates an irrefutable audit trail.**`
  },

  // Troubleshooting
  troubleshooting: {
    keywords: ['error', 'debug', 'not working', 'broken', 'issue', 'problem'],
    response: `**Troubleshooting Checklist:**

**1. Check API Key:**
\`\`\`bash
curl -H "Authorization: Bearer sk_live_YOUR_KEY" \\
  https://certnode.io/api/health
# Should return: {"status":"ok"}
\`\`\`

**2. Verify Request Format:**
- Headers: \`Authorization\` and \`Content-Type: application/json\`
- Body: Valid JSON with \`domain\`, \`type\`, \`data\` fields
- ParentIds: Must be valid receipt IDs (or empty array)

**3. Check Rate Limits:**
- Starter: 1,000 requests/hour
- Professional: 10,000 requests/hour
- Enterprise: Custom limits

**4. Review Logs:**
- Dashboard → API Logs shows all requests
- Check response codes and error messages

**5. Test in Sandbox:**
Use \`sk_test_\` keys for debugging without affecting production data.

**Still stuck?** Share your request/response and I'll help debug, or escalate to support.`
  },

  // Pricing & Billing
  pricing: {
    keywords: ['pricing', 'cost', 'tier', 'upgrade', 'plan'],
    response: `**Pricing Overview:**

**FREE** - 1,000 receipts/month
- 3-level graph depth
- Community support
- Basic verification

**STARTER ($199/mo)** - 10,000 receipts/month
- 5-level graph depth
- Email support
- Webhook notifications

**PROFESSIONAL ($499/mo)** - 50,000 receipts/month
- 10-level graph depth
- Priority support
- Advanced analytics

**BUSINESS ($1,299/mo)** - 250,000 receipts/month
- Unlimited graph depth
- Dedicated support
- Custom SLAs

**ENTERPRISE (Custom)** - Custom volume
- Everything in Business
- On-premise deployment
- Legal review support

**Upgrade anytime** - prorated billing, no long-term contracts.`
  }
};

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalize(input: string): string {
  return input.trim().toLowerCase();
}

function detectIntent(input: string): IntentType {
  const normalized = normalize(input);

  if (['create', 'post', 'first receipt', 'new receipt'].some(kw => normalized.includes(kw))) return 'technical';
  if (['graph', 'dag', 'link', 'parent', 'child'].some(kw => normalized.includes(kw))) return 'graph';
  if (['error', 'debug', 'not working', 'broken', 'issue'].some(kw => normalized.includes(kw))) return 'troubleshooting';
  if (['integrate', 'integration', 'webhook', 'kajabi', 'shopify', 'stripe', 'shippo', 'teachable', 'woocommerce', 'plugin', 'turnkey'].some(kw => normalized.includes(kw))) return 'integration';
  if (['pricing', 'billing', 'upgrade', 'invoice'].some(kw => normalized.includes(kw))) return 'billing';

  return 'general';
}

function detectEscalation(input: string): EscalationState | null {
  const normalized = normalize(input);
  for (const rule of escalationRules) {
    if (rule.keywords.some(keyword => normalized.includes(keyword))) {
      return {
        reason: rule.reason,
        lastUserMessage: input.trim(),
        conversationHistory: ''
      };
    }
  }
  return null;
}

function generateResponse(input: string): string {
  const normalized = normalize(input);

  // Check knowledge base
  for (const [key, kb] of Object.entries(knowledgeBase)) {
    if (kb.keywords.some(keyword => normalized.includes(keyword))) {
      return kb.response;
    }
  }

  // Fallback general response
  const intent = detectIntent(input);

  if (intent === 'technical') {
    return `I can help with technical implementation. Common topics:\n\n• **Creating receipts** - POST /api/receipts with domain, type, and data\n• **Receipt verification** - Using JWKS for cryptographic verification\n• **API authentication** - Bearer token setup and troubleshooting\n\nWhat specific technical question can I help with?`;
  }

  if (intent === 'graph') {
    return `Receipt graphs use a **DAG (Directed Acyclic Graph)** structure where receipts can have multiple parents.\n\nKey concepts:\n• **Domains**: Transaction (🟢), Content (🟣), Operations (🟠)\n• **Linking**: Use \`parentIds\` array when creating receipts\n• **Depth limits**: Based on your pricing tier\n\nWould you like to see code examples for creating linked receipts?`;
  }

  if (intent === 'troubleshooting') {
    return `Let me help debug your issue. Please share:\n\n1. **Error message** or unexpected behavior\n2. **Request details** (endpoint, headers, body)\n3. **Response received** (status code, error)\n\nCommon issues:\n• 401 Unauthorized → Check API key format\n• 403 Forbidden → Rate limit or IP restriction\n• 400 Bad Request → Invalid JSON or missing fields\n\nWhat specific error are you encountering?`;
  }

  if (intent === 'integration') {
    return `CertNode offers **turnkey integrations** - just point your platform webhooks to CertNode and we automatically create receipts.\n\n**🎓 High-Ticket Sales & Courses:**\n• Kajabi - Tracks purchases, logins, lessons, completions\n• Teachable - Course platform integration\n\n**🛒 E-Commerce:**\n• Shopify - Orders, fulfillment, refunds, disputes\n• WooCommerce - WordPress e-commerce\n\n**💳 Payments:**\n• Stripe - Charges, refunds, subscriptions, disputes\n\n**📦 Shipping:**\n• Shippo - Multi-carrier shipping labels & tracking\n• ShipStation - Order fulfillment automation\n\n**Setup is simple:**\n1. Go to your platform's webhook settings\n2. Point to: \`https://certnode.io/api/integrations/{platform}\`\n3. Receipts created automatically for every event\n4. All receipts linked to form a complete audit trail\n\n**Example:** Shopify order → Shippo label → FedEx tracking → Delivery → Stripe chargeback → Evidence\n\nWhich platform are you integrating? I can provide specific setup steps.`;
  }

  if (intent === 'billing') {
    return `For billing questions:\n\n• **Pricing details** - Visit /pricing for tier comparison\n• **Usage monitoring** - Dashboard shows current month's receipt count\n• **Upgrades** - Instant, prorated billing\n• **Invoice issues** - I can escalate to billing team\n\nWhat billing question can I help with?`;
  }

  return `I'm here to help with CertNode technical support, receipt graph usage, and integration guidance.\n\n**Quick topics:**\n• Creating and verifying receipts\n• Building DAG graph structures\n• API authentication and troubleshooting\n• Webhook configuration\n• Industry-specific implementations\n\nWhat can I help you with today?`;
}

export default function TechnicalSupportAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      sender: 'agent',
      content: `**CertNode Technical Support**\n\nI can help with:\n✓ Receipt creation and verification\n✓ Graph/DAG structure and linking\n✓ API integration and troubleshooting\n✓ Webhook configuration\n✓ Industry-specific implementations\n\nAsk me anything about CertNode, or use the quick prompts below. For urgent issues, you can escalate directly to our support team.`,
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
      .slice(-10)
      .map(message => `${message.sender === 'agent' ? 'Agent' : 'You'}: ${message.content}`)
      .join('\n');
  }, [messages]);

  const escalationMailto = useMemo(() => {
    if (!pendingEscalation) return null;

    const subject = 'CertNode Technical Support Request';
    const body = [
      pendingEscalation.reason,
      '',
      'Last message:',
      pendingEscalation.lastUserMessage,
      '',
      'Conversation history:',
      conversationSummary || pendingEscalation.lastUserMessage,
    ].join('\n');

    return `mailto:contact@certnode.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [conversationSummary, pendingEscalation]);

  const handleUserMessage = (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    const userMessage: Message = {
      id: createMessageId(),
      sender: 'user',
      content: trimmed,
    };

    const escalation = detectEscalation(trimmed);
    const agentResponse = escalation
      ? `I understand this is ${escalation.reason.toLowerCase()}. I'm preparing an escalation to our support team with your conversation history.\n\nClick **"Email Support Team"** below to send this directly to contact@certnode.io. Our team typically responds within 2-4 hours.`
      : generateResponse(trimmed);

    const agentMessage: Message = {
      id: createMessageId(),
      sender: 'agent',
      content: agentResponse,
    };

    setMessages(prev => [...prev, userMessage, agentMessage]);

    if (escalation) {
      setPendingEscalation({
        ...escalation,
        conversationHistory: conversationSummary
      });
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
    const state: EscalationState = {
      reason: 'Manual escalation requested',
      lastUserMessage: lastUser?.content ?? 'No specific question provided',
      conversationHistory: conversationSummary
    };
    setPendingEscalation(state);
    setMessages(prev => [
      ...prev,
      {
        id: createMessageId(),
        sender: 'agent',
        content: `I'll escalate this to our support team. Click **"Email Support Team"** below to send your conversation to contact@certnode.io.\n\nOur team will review your conversation history and respond within 2-4 hours.`,
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
          <p className="text-sm font-semibold text-gray-900">CertNode Technical Support</p>
          <p className="text-xs text-gray-500">Get help with receipts, graphs, API integration, and troubleshooting</p>
        </div>
        <button
          type="button"
          onClick={handleManualEscalation}
          className="inline-flex items-center justify-center rounded-full border border-orange-200 px-4 py-2 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-50"
        >
          Escalate to Support
        </button>
      </div>

      <div className="px-6 py-6">
        <div
          className="max-h-96 space-y-4 overflow-y-auto rounded-xl bg-gray-50 p-4"
          role="log"
          aria-live="polite"
          aria-label="Technical support conversation"
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
              <p className="font-semibold mb-1">{message.sender === 'agent' ? '🤖 CertNode Support' : 'You'}</p>
              <div className="whitespace-pre-line text-sm prose prose-sm max-w-none prose-headings:text-inherit prose-strong:text-inherit prose-code:text-inherit prose-code:bg-white/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                {message.content}
              </div>
            </div>
          ))}
          <div ref={logRef} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {quickPrompts.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleQuickPrompt(item.prompt)}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50"
            >
              {item.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label htmlFor="support-agent-input" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Ask a technical question
          </label>
          <textarea
            id="support-agent-input"
            value={input}
            onChange={event => setInput(event.target.value)}
            placeholder="Describe your issue, API question, or integration challenge..."
            rows={4}
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">Include error messages, code snippets, or specific questions for best results.</p>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </form>

        {pendingEscalation && (
          <div className="mt-6 rounded-xl border border-orange-300 bg-orange-50 px-4 py-4 text-sm text-orange-900">
            <p className="font-semibold">Ready to escalate to support team</p>
            <p className="mt-1 text-sm leading-6">{pendingEscalation.reason}. Your conversation history will be included for context.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {escalationMailto && (
                <a
                  href={escalationMailto}
                  className="inline-flex items-center justify-center rounded-full bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-700"
                >
                  📧 Email Support Team
                </a>
              )}
              <button
                type="button"
                onClick={handleDismissEscalation}
                className="inline-flex items-center justify-center rounded-full border border-orange-300 px-4 py-2 text-xs font-semibold text-orange-800 transition-colors hover:bg-orange-100"
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
