/**
 * Key Rotation Log Endpoint - /trust/keys.jsonl
 *
 * Provides public access to key rotation history for transparency
 * Returns JSONL format (one JSON object per line) for streaming consumption
 */

async function handle(req, res) {
  if (req.method !== 'GET') {
    const { sendError } = require('../middleware/errorHandler');
    return sendError(res, req, 405, 'method_not_allowed', 'Only GET is allowed');
  }

  try {
    // Key rotation log entries (in production, this would come from a database or S3)
    const rotationLog = [
      {
        timestamp: "2025-01-15T10:30:00Z",
        kid: "cert-2025-01-15-prod",
        action: "added",
        algorithm: "ES256",
        comment: "Initial production key deployment"
      },
      {
        timestamp: "2025-01-01T00:00:00Z",
        kid: "cert-2024-12-test",
        action: "deprecated",
        algorithm: "ES256",
        comment: "Retired test environment key"
      }
    ];

    // Convert to JSONL format (one JSON object per line)
    const jsonlContent = rotationLog
      .map(entry => JSON.stringify(entry))
      .join('\n');

    res.writeHead(200, {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    return res.end(jsonlContent);
  } catch (e) {
    console.error('Keys endpoint error:', e);
    const { sendError } = require('../middleware/errorHandler');
    return sendError(res, req, 500, 'keys_unavailable', 'Key rotation log unavailable');
  }
}

module.exports = { handle };
