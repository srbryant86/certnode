const express = require('express');
const cors = require('cors');
const { verifyReceipt, JWKSManager } = require('@certnode/sdk');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize JWKS Manager with 5-minute cache
const jwksManager = new JWKSManager({ ttlMs: 5 * 60 * 1000 });

// CertNode verification middleware
function certNodeVerification(jwksUrl) {
  return async (req, res, next) => {
    try {
      const receipt = req.body.receipt;
      if (!receipt) {
        return res.status(400).json({
          error: 'Receipt required',
          message: 'Please provide a receipt in the request body'
        });
      }

      // Fetch JWKS from configured endpoint
      const jwks = await jwksManager.fetchFromUrl(jwksUrl);
      const result = await verifyReceipt({ receipt, jwks });

      if (result.ok) {
        // Store verified payload in request for downstream use
        req.verifiedPayload = receipt.payload;
        req.receiptKid = receipt.kid;
        next();
      } else {
        res.status(401).json({
          error: 'Invalid receipt',
          reason: result.reason
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({
        error: 'Verification failed',
        details: error.message
      });
    }
  };
}

// Routes
app.get('/', (req, res) => {
  res.json({
    name: '{{projectName}}',
    description: 'CertNode Express.js API with receipt verification',
    endpoints: {
      'GET /': 'This API information',
      'POST /api/submit': 'Submit verified data (requires valid receipt)',
      'POST /api/verify': 'Verify a receipt manually',
      'GET /health': 'Health check'
    },
    version: '1.0.0'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Manual verification endpoint
app.post('/api/verify', async (req, res) => {
  try {
    const { receipt, jwksUrl } = req.body;

    if (!receipt) {
      return res.status(400).json({ error: 'Receipt is required' });
    }

    if (!jwksUrl) {
      return res.status(400).json({ error: 'JWKS URL is required' });
    }

    const jwks = await jwksManager.fetchFromUrl(jwksUrl);
    const result = await verifyReceipt({ receipt, jwks });

    res.json({
      valid: result.ok,
      reason: result.reason,
      kid: receipt.kid,
      algorithm: receipt.protected ?
        JSON.parse(Buffer.from(receipt.protected, 'base64url').toString()).alg :
        null
    });

  } catch (error) {
    console.error('Manual verification error:', error);
    res.status(500).json({
      error: 'Verification failed',
      details: error.message
    });
  }
});

// Protected endpoint that requires valid receipt
app.post('/api/submit',
  certNodeVerification('https://api.certnode.io/.well-known/jwks.json'),
  (req, res) => {
    // This handler only runs if receipt verification succeeds
    console.log('Verified payload:', req.verifiedPayload);
    console.log('Receipt kid:', req.receiptKid);

    res.json({
      status: 'success',
      message: 'Data accepted with valid receipt',
      data: req.verifiedPayload,
      receiptKid: req.receiptKid,
      timestamp: new Date().toISOString()
    });
  }
);

// Example protected endpoint with custom business logic
app.post('/api/documents',
  certNodeVerification('https://api.certnode.io/.well-known/jwks.json'),
  (req, res) => {
    const document = req.verifiedPayload;

    // Custom validation for document structure
    if (!document.document_id || !document.content) {
      return res.status(400).json({
        error: 'Invalid document structure',
        required: ['document_id', 'content']
      });
    }

    // Simulate storing the document
    const storedDocument = {
      id: document.document_id,
      content: document.content,
      timestamp: document.timestamp || new Date().toISOString(),
      receiptKid: req.receiptKid,
      storedAt: new Date().toISOString()
    };

    console.log('Document stored:', storedDocument);

    res.json({
      status: 'success',
      message: 'Document stored with verified receipt',
      document: storedDocument
    });
  }
);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 {{projectName}} server running on http://localhost:${port}`);
  console.log(`📋 API docs available at http://localhost:${port}`);
  console.log(`🔐 CertNode SDK version: ${require('@certnode/sdk/package.json').version}`);
});

module.exports = app;