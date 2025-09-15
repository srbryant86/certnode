/**
 * Customer Analytics Plugin - Track user behavior for monetization insights
 *
 * Tracks:
 * - API usage patterns (who, when, how much)
 * - Customer journey (free → paid conversion signals)
 * - Feature adoption (which endpoints, payload types)
 * - Enterprise signals (high volume, specific use cases)
 */

const { emit } = require('./metrics');
const crypto = require('crypto');

// In-memory analytics store (production should use proper analytics DB)
const analytics = {
  customers: new Map(), // customer_id -> profile data
  sessions: new Map(),  // session_id -> session data
  events: []           // event log
};

/**
 * Generate anonymous customer ID from IP/User-Agent
 */
function generateCustomerId(req) {
  const ip = req.headers['x-forwarded-for'] ||
            req.headers['x-real-ip'] ||
            req.connection?.remoteAddress ||
            '127.0.0.1';

  const userAgent = req.headers['user-agent'] || 'unknown';
  const fingerprint = crypto.createHash('sha256')
    .update(ip + '|' + userAgent)
    .digest('hex')
    .substring(0, 16);

  return `anon_${fingerprint}`;
}

/**
 * Get or create customer profile
 */
function getCustomerProfile(customerId) {
  if (!analytics.customers.has(customerId)) {
    analytics.customers.set(customerId, {
      id: customerId,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      total_requests: 0,
      unique_days: new Set(),
      endpoints_used: new Set(),
      payload_types: new Set(),
      error_count: 0,
      enterprise_signals: 0,
      conversion_signals: []
    });
  }

  return analytics.customers.get(customerId);
}

/**
 * Track API request for analytics
 */
function trackApiRequest(req, res, endpoint, payload = null) {
  const customerId = generateCustomerId(req);
  const profile = getCustomerProfile(customerId);

  // Update profile
  profile.last_seen = new Date().toISOString();
  profile.total_requests++;
  profile.unique_days.add(new Date().toISOString().split('T')[0]);
  profile.endpoints_used.add(endpoint);

  if (payload) {
    // Analyze payload for enterprise signals
    const payloadStr = JSON.stringify(payload).toLowerCase();

    // Detect enterprise patterns
    const enterpriseKeywords = [
      'invoice', 'payment', 'transaction', 'audit', 'compliance',
      'financial', 'legal', 'contract', 'policy', 'medical',
      'patient', 'hipaa', 'gdpr', 'sox', 'pci'
    ];

    enterpriseKeywords.forEach(keyword => {
      if (payloadStr.includes(keyword)) {
        profile.enterprise_signals++;
        profile.payload_types.add(keyword);
      }
    });
  }

  // Track conversion signals
  if (profile.total_requests === 10) {
    profile.conversion_signals.push('engaged_user');
  }
  if (profile.total_requests === 100) {
    profile.conversion_signals.push('power_user');
  }
  if (profile.unique_days.size >= 5) {
    profile.conversion_signals.push('regular_user');
  }
  if (profile.enterprise_signals >= 3) {
    profile.conversion_signals.push('enterprise_prospect');
  }

  // Emit analytics event
  const event = {
    timestamp: new Date().toISOString(),
    customer_id: customerId,
    event_type: 'api_request',
    endpoint: endpoint,
    has_payload: !!payload,
    enterprise_signals: profile.enterprise_signals,
    total_requests: profile.total_requests,
    conversion_signals: profile.conversion_signals
  };

  analytics.events.push(event);
  emit('customer_analytics', 1, event);

  // Check for enterprise lead qualification
  if (shouldTriggerEnterpriseOutreach(profile)) {
    emit('enterprise_lead_qualified', 1, {
      customer_id: customerId,
      signals: profile.conversion_signals,
      enterprise_score: profile.enterprise_signals,
      total_usage: profile.total_requests
    });
  }
}

/**
 * Track usage limit hit for conversion insights
 */
function trackUsageLimitHit(req, currentUsage, limit) {
  const customerId = generateCustomerId(req);
  const profile = getCustomerProfile(customerId);

  profile.conversion_signals.push('hit_usage_limit');

  const event = {
    timestamp: new Date().toISOString(),
    customer_id: customerId,
    event_type: 'usage_limit_hit',
    current_usage: currentUsage,
    limit: limit,
    enterprise_signals: profile.enterprise_signals
  };

  analytics.events.push(event);
  emit('conversion_opportunity', 1, event);
}

/**
 * Track form submissions and lead capture
 */
function trackLeadCapture(formType, formData) {
  const leadId = crypto.randomUUID();

  const event = {
    timestamp: new Date().toISOString(),
    lead_id: leadId,
    event_type: 'lead_captured',
    form_type: formType,
    data: {
      company: formData.company,
      use_case: formData.use_case,
      company_size: formData.company_size,
      urgency: formData.urgency,
      compliance_type: formData.compliance_type
    }
  };

  analytics.events.push(event);
  emit('lead_captured', 1, event);

  return leadId;
}

/**
 * Determine if customer qualifies for enterprise outreach
 */
function shouldTriggerEnterpriseOutreach(profile) {
  const score = profile.enterprise_signals;
  const usage = profile.total_requests;
  const signals = profile.conversion_signals;

  // High-value prospect indicators
  return (
    score >= 5 || // Multiple compliance keywords
    usage >= 500 || // High volume usage
    signals.includes('enterprise_prospect') ||
    (usage >= 50 && signals.includes('regular_user'))
  );
}

/**
 * Get analytics dashboard data
 */
function getAnalyticsDashboard() {
  const customers = Array.from(analytics.customers.values());

  const stats = {
    total_customers: customers.length,
    enterprise_prospects: customers.filter(c => c.conversion_signals.includes('enterprise_prospect')).length,
    power_users: customers.filter(c => c.conversion_signals.includes('power_user')).length,
    conversion_ready: customers.filter(c => c.conversion_signals.includes('hit_usage_limit')).length,
    top_use_cases: getTopUseCases(customers),
    recent_activity: analytics.events.slice(-50)
  };

  return stats;
}

function getTopUseCases(customers) {
  const useCases = {};
  customers.forEach(customer => {
    customer.payload_types.forEach(type => {
      useCases[type] = (useCases[type] || 0) + 1;
    });
  });

  return Object.entries(useCases)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
}

module.exports = {
  trackApiRequest,
  trackUsageLimitHit,
  trackLeadCapture,
  getAnalyticsDashboard,
  shouldTriggerEnterpriseOutreach
};