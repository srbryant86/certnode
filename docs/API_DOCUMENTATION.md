# CertNode Content Authenticity API Documentation

**Version:** 2.0
**Base URL:** `https://certnode.io/api/v1`
**Last Updated:** 2025-09-27

## Overview

CertNode's Content Authenticity API provides advanced AI detection for text and images with 90%+ accuracy. Detect AI-generated content from GPT-4, Claude, Gemini, and other models using proprietary algorithms including perplexity analysis, model fingerprinting, and ensemble scoring.

## Authentication

All API endpoints require authentication via API key in the request header:

```http
X-API-Key: your_api_key_here
```

## Rate Limits

Rate limits are enforced based on your enterprise tier:

| Tier | Requests per Minute | Monthly Quota |
|------|-------------------|---------------|
| FREE | 10 | 1,000 |
| STARTER | 100 | 50,000 |
| PRO | 1,000 | 500,000 |
| ENTERPRISE | 10,000 | Unlimited |

Rate limit headers are included in all responses:
- `X-RateLimit-Limit`: Your rate limit ceiling for that given endpoint
- `X-RateLimit-Remaining`: Number of requests left for the time window
- `X-RateLimit-Reset`: UTC epoch timestamp when the rate limit resets

## Endpoints

### Create Content Receipt

Certify content and receive AI detection analysis.

**POST** `/receipts/content`

#### Request Body

```json
{
  "contentBase64": "string", // Base64 encoded content (required for AI detection)
  "contentHash": "string",   // SHA-256 hash of content (optional)
  "contentType": "string",   // MIME type (e.g., "text/plain", "image/jpeg")
  "metadata": {              // Optional metadata
    "filename": "document.txt",
    "source": "user_upload",
    "timestamp": "2025-09-27T10:00:00Z"
  },
  "provenance": {            // Optional provenance information
    "author": "John Doe",
    "organization": "Acme Corp",
    "creation_tool": "Microsoft Word"
  },
  "detectorResults": {}      // Optional: pre-computed detection results
}
```

#### Response

```json
{
  "success": true,
  "receipt": {
    "id": "rec_abc123",
    "contentHash": "sha256:abcd1234...",
    "contentType": "text/plain",
    "status": "VERIFIED",
    "createdAt": "2025-09-27T10:00:00Z",
    "aiDetection": {
      "confidence": 0.87,
      "methods": {
        "linguistic": 0.82,
        "statistical": 0.75,
        "perplexity": 0.91,
        "fingerprint": 0.89
      },
      "detectedModels": ["gpt-4"],
      "indicators": [
        "high_formality",
        "low_perplexity_score",
        "gpt4_signature"
      ],
      "reasoning": "Text shows strong indicators of AI generation: low_perplexity_score, highly_predictable_text. Possible models: gpt-4.",
      "confidenceInterval": [0.82, 0.92],
      "processingTime": 245
    },
    "cryptographicProof": {
      "signature": "0x...",
      "merkleRoot": "0x...",
      "algorithm": "RSA-PSS",
      "issuedAt": "2025-09-27T10:00:00Z"
    }
  }
}
```

#### Status Codes

- `201` - Content successfully certified
- `400` - Invalid request body or missing required fields
- `401` - Invalid API key
- `429` - Rate limit exceeded
- `500` - Internal server error

### Verify Content

Verify a content receipt and retrieve detection results.

**GET** `/verify/content/{receiptId}`

#### Response

```json
{
  "valid": true,
  "receipt": {
    "id": "rec_abc123",
    "contentHash": "sha256:abcd1234...",
    "aiDetection": {
      "confidence": 0.87,
      "detectedModels": ["gpt-4"],
      "indicators": ["high_formality", "low_perplexity_score"]
    },
    "verifiedAt": "2025-09-27T10:00:00Z"
  }
}
```

## AI Detection Features

### Text Analysis

Our advanced text detection includes:

- **Perplexity Analysis**: N-gram model likelihood scoring
- **Model Fingerprinting**: Signature detection for specific AI models
- **Linguistic Patterns**: Grammar, syntax, and formality analysis
- **Statistical Metrics**: Vocabulary distribution and Zipf's law analysis

### Image Analysis

Our image detection analyzes:

- **EXIF Metadata**: Consistency checks and software signatures
- **Compression Patterns**: AI generation artifacts in JPEG/PNG
- **Statistical Properties**: Pixel distribution and noise patterns
- **Software Detection**: Known AI image generators (DALL-E, Midjourney, etc.)

### Supported Content Types

#### Text
- `text/plain`
- `text/html`
- `text/markdown`
- `application/json`

#### Images
- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`

## AI Model Detection

We detect content from these AI models:

| Model | Detection Features |
|-------|-------------------|
| **GPT-4** | Phrase patterns, formality markers, transition words |
| **Claude** | Helpful language patterns, clarification phrases |
| **Gemini** | Research-oriented language, evidence citations |
| **ChatGPT** | OpenAI-specific disclaimers and limitations |
| **Generic AI** | Business jargon, optimization language |

## Error Handling

All errors follow this format:

```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific error details"
  }
}
```

### Common Error Codes

- `INVALID_API_KEY` - API key is missing or invalid
- `RATE_LIMIT_EXCEEDED` - Too many requests for your tier
- `INVALID_CONTENT_TYPE` - Unsupported content type
- `CONTENT_TOO_LARGE` - Content exceeds size limits
- `PROCESSING_FAILED` - AI detection processing error

## Content Size Limits

| Content Type | Maximum Size |
|--------------|-------------|
| Text | 1 MB |
| Images | 10 MB |

## SDKs and Libraries

### JavaScript/Node.js

```bash
npm install @certnode/sdk
```

```javascript
import { CertNodeClient } from '@certnode/sdk';

const client = new CertNodeClient('your_api_key');

const result = await client.certifyContent({
  content: 'Your text content here',
  contentType: 'text/plain'
});

console.log('AI Confidence:', result.aiDetection.confidence);
```

### Python

```bash
pip install certnode-python
```

```python
from certnode import CertNodeClient

client = CertNodeClient('your_api_key')

result = client.certify_content(
    content='Your text content here',
    content_type='text/plain'
)

print(f"AI Confidence: {result.ai_detection.confidence}")
```

### cURL

```bash
curl -X POST https://certnode.io/api/v1/receipts/content \
  -H "X-API-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "contentBase64": "'$(echo "Your text content" | base64)'",
    "contentType": "text/plain"
  }'
```

## Webhooks

Configure webhooks to receive real-time notifications when content is processed:

```json
{
  "event": "content.processed",
  "receiptId": "rec_abc123",
  "status": "VERIFIED",
  "aiDetection": {
    "confidence": 0.87,
    "detectedModels": ["gpt-4"]
  },
  "timestamp": "2025-09-27T10:00:00Z"
}
```

## Batch Processing

For large volumes, use our batch processing endpoint:

**POST** `/receipts/content/batch`

Process up to 100 content items in a single request.

## Enterprise Features

### Custom Models
- Train custom AI detection models for your specific use cases
- White-label API endpoints with your domain
- Dedicated infrastructure and SLA guarantees

### Analytics
- Detailed detection analytics and reporting
- Export data in CSV, JSON, or API format
- Real-time dashboard with confidence trending

### Compliance
- SOC 2 Type II certified infrastructure
- GDPR and CCPA compliant data handling
- Audit logs and compliance reporting

## Support

- **Documentation**: https://docs.certnode.io
- **Support**: support@certnode.io
- **Status**: https://status.certnode.io
- **GitHub**: https://github.com/certnode

## Changelog

### v2.0 (2025-09-27)
- Added advanced AI detection with 90%+ accuracy
- Introduced multi-model fingerprinting
- Added enterprise tier rate limiting
- Enhanced image metadata analysis

### v1.0
- Initial content authenticity API
- Basic text and image analysis
- Cryptographic proof generation