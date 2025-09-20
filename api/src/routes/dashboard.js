/**
 * Analytics Dashboard API - Track subscribers, trials, and conversions
 */

const { getAnalyticsDashboard } = require('../plugins/customer-analytics');
const { PRICING_TIERS } = require('../plugins/stripe-billing');

// In-memory storage for demo (production should use proper database)
const analytics = {
  subscribers: new Map(),
  trials: new Map(),
  conversions: new Map(),
  revenue: []
};

/**
 * Get comprehensive dashboard metrics
 */
function getDashboardMetrics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get customer analytics data
  const customerData = getAnalyticsDashboard();

  // Calculate subscription metrics
  const subscribers = Array.from(analytics.subscribers.values());
  const trials = Array.from(analytics.trials.values());

  const activeSubscribers = subscribers.filter(s => s.status === 'active');
  const cancelledSubscribers = subscribers.filter(s => s.status === 'cancelled');

  const activeTiers = {
    free: activeSubscribers.filter(s => s.tier === 'free').length,
    starter: activeSubscribers.filter(s => s.tier === 'starter').length,
    pro: activeSubscribers.filter(s => s.tier === 'pro').length,
    business: activeSubscribers.filter(s => s.tier === 'business').length,
    enterprise: activeSubscribers.filter(s => s.tier === 'enterprise').length
  };

  // Calculate Monthly Recurring Revenue (MRR)
  const mrr = activeSubscribers.reduce((total, sub) => {
    const tier = PRICING_TIERS[sub.tier];
    return total + (tier?.price || 0);
  }, 0) / 100; // Convert from cents

  // Calculate Average Revenue Per User (ARPU)
  const arpu = activeSubscribers.length > 0 ? mrr / activeSubscribers.length : 0;

  // Calculate conversion metrics
  const totalTrials = trials.length;
  const convertedTrials = trials.filter(t => t.converted).length;
  const conversionRate = totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0;

  // Growth metrics (last 30 days)
  const recentSubscribers = activeSubscribers.filter(s =>
    new Date(s.created_at) >= thirtyDaysAgo
  );
  const recentTrials = trials.filter(t =>
    new Date(t.started_at) >= thirtyDaysAgo
  );

  // Churn rate (cancelled in last 30 days / total active at start of period)
  const recentCancellations = cancelledSubscribers.filter(s =>
    new Date(s.cancelled_at) >= thirtyDaysAgo
  );
  const churnRate = activeSubscribers.length > 0 ?
    (recentCancellations.length / (activeSubscribers.length + recentCancellations.length)) * 100 : 0;

  return {
    // Subscription Metrics
    totalSubscribers: activeSubscribers.length,
    newSubscribersThisMonth: recentSubscribers.length,
    cancelledSubscribers: cancelledSubscribers.length,
    churnRate: Math.round(churnRate * 100) / 100,

    // Tier Distribution
    subscribersByTier: activeTiers,

    // Trial Metrics
    totalTrials: totalTrials,
    activeTrials: trials.filter(t => t.status === 'active').length,
    expiredTrials: trials.filter(t => t.status === 'expired').length,
    convertedTrials: convertedTrials,
    newTrialsThisMonth: recentTrials.length,

    // Conversion Metrics
    trialToSubscriberConversionRate: Math.round(conversionRate * 100) / 100,

    // Revenue Metrics
    monthlyRecurringRevenue: Math.round(mrr * 100) / 100,
    averageRevenuePerUser: Math.round(arpu * 100) / 100,

    // Growth Metrics
    monthlyGrowthRate: calculateGrowthRate(activeSubscribers),

    // Customer Analytics
    apiUsage: customerData,

    // Top Performers
    topCustomersByUsage: getTopCustomersByUsage(),
    enterpriseProspects: getEnterpriseProspects(),

    // Recent Activity
    recentSubscriptions: recentSubscribers.slice(-10),
    recentTrials: recentTrials.slice(-10),
    recentCancellations: recentCancellations.slice(-5),

    // Health Metrics
    healthScore: calculateHealthScore(activeTiers, conversionRate, churnRate, mrr)
  };
}

/**
 * Track new subscriber
 */
function trackSubscriber(customerId, tier, stripeCustomerId = null) {
  const subscriber = {
    id: customerId,
    tier: tier,
    status: 'active',
    created_at: new Date().toISOString(),
    stripe_customer_id: stripeCustomerId,
    last_active: new Date().toISOString(),
    total_usage: 0,
    billing_cycle: 'monthly'
  };

  analytics.subscribers.set(customerId, subscriber);

  // Track conversion if they were previously a trial
  if (analytics.trials.has(customerId)) {
    const trial = analytics.trials.get(customerId);
    trial.converted = true;
    trial.converted_at = new Date().toISOString();
    trial.converted_to_tier = tier;
  }

  return subscriber;
}

/**
 * Track new trial
 */
function trackTrial(customerId, email = null) {
  const trial = {
    id: customerId,
    email: email,
    status: 'active',
    started_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
    total_usage: 0,
    features_used: [],
    converted: false,
    source: 'website'
  };

  analytics.trials.set(customerId, trial);
  return trial;
}

/**
 * Update subscriber status
 */
function updateSubscriberStatus(customerId, status, reason = null) {
  const subscriber = analytics.subscribers.get(customerId);
  if (!subscriber) return null;

  subscriber.status = status;
  subscriber.updated_at = new Date().toISOString();

  if (status === 'cancelled') {
    subscriber.cancelled_at = new Date().toISOString();
    subscriber.cancellation_reason = reason;
  }

  return subscriber;
}

/**
 * Track usage for subscriber/trial
 */
function trackUsage(customerId, endpoint, payload = null) {
  // Update subscriber usage
  if (analytics.subscribers.has(customerId)) {
    const subscriber = analytics.subscribers.get(customerId);
    subscriber.total_usage++;
    subscriber.last_active = new Date().toISOString();
  }

  // Update trial usage
  if (analytics.trials.has(customerId)) {
    const trial = analytics.trials.get(customerId);
    trial.total_usage++;
    if (!trial.features_used.includes(endpoint)) {
      trial.features_used.push(endpoint);
    }
  }
}

/**
 * Get top customers by usage
 */
function getTopCustomersByUsage() {
  const subscribers = Array.from(analytics.subscribers.values());
  return subscribers
    .sort((a, b) => b.total_usage - a.total_usage)
    .slice(0, 10)
    .map(s => ({
      id: s.id,
      tier: s.tier,
      usage: s.total_usage,
      last_active: s.last_active
    }));
}

/**
 * Get enterprise prospects
 */
function getEnterpriseProspects() {
  const subscribers = Array.from(analytics.subscribers.values());
  const trials = Array.from(analytics.trials.values());

  const prospects = [
    ...subscribers.filter(s => s.total_usage > 1000 && s.tier !== 'enterprise'),
    ...trials.filter(t => t.total_usage > 100 && !t.converted)
  ];

  return prospects.slice(0, 10);
}

/**
 * Calculate monthly growth rate
 */
function calculateGrowthRate(subscribers) {
  const now = new Date();
  const thisMonth = now.getMonth();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;

  const thisMonthSubs = subscribers.filter(s =>
    new Date(s.created_at).getMonth() === thisMonth
  ).length;

  const lastMonthSubs = subscribers.filter(s =>
    new Date(s.created_at).getMonth() === lastMonth
  ).length;

  if (lastMonthSubs === 0) return thisMonthSubs > 0 ? 100 : 0;

  return Math.round(((thisMonthSubs - lastMonthSubs) / lastMonthSubs) * 100 * 100) / 100;
}

/**
 * Calculate overall health score
 */
function calculateHealthScore(tiers, conversionRate, churnRate, mrr) {
  let score = 0;

  // Subscriber distribution (0-25 points)
  const totalSubs = Object.values(tiers).reduce((sum, count) => sum + count, 0);
  if (totalSubs > 0) {
    const paidSubs = totalSubs - tiers.free;
    score += Math.min(25, (paidSubs / totalSubs) * 25);
  }

  // Conversion rate (0-25 points)
  score += Math.min(25, conversionRate * 2.5);

  // Low churn rate (0-25 points)
  score += Math.max(0, 25 - churnRate);

  // Revenue growth (0-25 points)
  score += Math.min(25, mrr / 100); // $1 MRR = 1 point

  return Math.round(score);
}

/**
 * API Routes
 */
function setupDashboardRoutes(app) {
  // Get dashboard metrics
  app.get('/api/dashboard/metrics', (req, res) => {
    try {
      const metrics = getDashboardMetrics();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(metrics, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });

  // Track new subscriber
  app.post('/api/dashboard/subscriber', (req, res) => {
    try {
      const { customerId, tier, stripeCustomerId } = req.body;
      const subscriber = trackSubscriber(customerId, tier, stripeCustomerId);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(subscriber));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });

  // Track new trial
  app.post('/api/dashboard/trial', (req, res) => {
    try {
      const { customerId, email } = req.body;
      const trial = trackTrial(customerId, email);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(trial));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });

  // Export data for analysis
  app.get('/api/dashboard/export', (req, res) => {
    try {
      const data = {
        subscribers: Array.from(analytics.subscribers.values()),
        trials: Array.from(analytics.trials.values()),
        timestamp: new Date().toISOString()
      };

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="certnode-analytics.json"'
      });
      res.end(JSON.stringify(data, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });
}

module.exports = {
  getDashboardMetrics,
  trackSubscriber,
  trackTrial,
  updateSubscriberStatus,
  trackUsage,
  setupDashboardRoutes
};