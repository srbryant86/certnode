// Lead capture and revenue tracking endpoint
const { readJsonLimited } = require('../plugins/validation');
const { emit } = require('../plugins/metrics');

async function handle(req, res) {
  if (req.method !== 'POST') {
    const headers = { 'Content-Type': 'application/json' };
    if (req && req.id) headers['X-Request-Id'] = req.id;
    res.writeHead(405, headers);
    const body = { error: 'method_not_allowed' };
    if (req && req.id) body.request_id = req.id;
    return res.end(JSON.stringify(body));
  }

  try {
    const rawBody = await readJsonLimited(req, { limitBytes: 16384 });
    const { action, ...data } = rawBody;

    // Emit lead event for revenue tracking
    emit('lead_event', 1, {
      action: action,
      company: data.company || 'unknown',
      company_size: data.companySize || 'unknown',
      urgency: data.urgency || 'unknown',
      use_case: data.useCase || 'unknown',
      source: data.source || 'unknown',
      request_id: req.id || 'unknown'
    });

    // For high-value leads, emit special tracking
    if (data.companySize === 'enterprise' || data.urgency === 'immediate') {
      emit('high_value_lead', 1, {
        action: action,
        company: data.company || 'unknown',
        priority: 'high',
        estimated_value: data.estimatedValue || 0,
        request_id: req.id || 'unknown'
      });
    }

    // Success response
    const headers = { 'Content-Type': 'application/json' };
    if (req && req.id) headers['X-Request-Id'] = req.id;
    res.writeHead(200, headers);
    res.end(JSON.stringify({
      success: true,
      message: 'Lead tracked successfully',
      request_id: req.id
    }));

  } catch (e) {
    // Error response
    const code = e.statusCode || 400;
    const headers = { 'Content-Type': 'application/json' };
    if (req && req.id) headers['X-Request-Id'] = req.id;
    res.writeHead(code, headers);
    const body = {
      error: e.code || 'invalid_request',
      message: e.message || 'Invalid lead data'
    };
    if (req && req.id) body.request_id = req.id;
    res.end(JSON.stringify(body));
  }
}

module.exports = { handle };