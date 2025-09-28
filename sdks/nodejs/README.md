# CertNode Node.js SDK

Official Node.js SDK for the CertNode Content Authenticity API. Detect AI-generated content with 90%+ accuracy using advanced perplexity analysis and model fingerprinting.

## Installation

```bash
npm install @certnode/sdk
```

## Quick Start

```javascript
import { CertNodeClient } from '@certnode/sdk';

const client = new CertNodeClient({
  apiKey: 'your_api_key_here'
});

// Certify text content
const result = await client.certifyContent({
  content: 'Your text content here',
  contentType: 'text/plain'
});

console.log('AI Confidence:', result.receipt.aiDetection.confidence);
console.log('Detected Models:', result.receipt.aiDetection.detectedModels);
```

## Features

- 🤖 **Advanced AI Detection** - 90%+ accuracy for GPT-4, Claude, Gemini
- 📄 **Text Analysis** - Perplexity analysis, linguistic patterns, model fingerprinting
- 🖼️ **Image Analysis** - EXIF metadata forensics, compression analysis
- 🔒 **Cryptographic Receipts** - Immutable proof of content authenticity
- ⚡ **Rate Limiting** - Automatic retry with exponential backoff
- 📊 **Batch Processing** - Certify up to 100 items at once
- 🛠️ **TypeScript** - Full type safety and IntelliSense

## API Reference

### CertNodeClient

```javascript
const client = new CertNodeClient({
  apiKey: 'your_api_key',
  baseURL: 'https://certnode.io/api/v1', // optional
  timeout: 30000, // optional
  retries: 3 // optional
});
```

### Methods

#### `certifyContent(request)`

Certify content and receive AI detection analysis.

```javascript
const result = await client.certifyContent({
  content: 'Text content or Buffer',
  contentType: 'text/plain',
  metadata: { // optional
    filename: 'document.txt',
    source: 'user_upload'
  },
  provenance: { // optional
    author: 'John Doe',
    organization: 'Acme Corp'
  }
});
```

**Response:**
```javascript
{
  success: true,
  receipt: {
    id: 'rec_abc123',
    contentHash: 'sha256:...',
    contentType: 'text/plain',
    status: 'VERIFIED',
    createdAt: '2025-09-27T10:00:00Z',
    aiDetection: {
      confidence: 0.87,
      methods: {
        linguistic: 0.82,
        statistical: 0.75,
        perplexity: 0.91,
        fingerprint: 0.89
      },
      detectedModels: ['gpt-4'],
      indicators: ['high_formality', 'low_perplexity_score'],
      reasoning: 'Text shows strong indicators of AI generation...',
      confidenceInterval: [0.82, 0.92],
      processingTime: 245
    }
  }
}
```

#### `verifyContent(receiptId)`

Verify a content receipt.

```javascript
const verification = await client.verifyContent('rec_abc123');
console.log('Valid:', verification.valid);
```

#### `certifyBatch(requests)`

Batch certify multiple content items (max 100).

```javascript
const results = await client.certifyBatch([
  { content: 'Text 1', contentType: 'text/plain' },
  { content: 'Text 2', contentType: 'text/plain' }
]);
```

#### `getUsageStats()`

Get API usage statistics.

```javascript
const usage = await client.getUsageStats();
console.log('Requests used:', usage.currentPeriod.requests);
console.log('Tier:', usage.tier);
```

## Error Handling

```javascript
import { CertNodeError } from '@certnode/sdk';

try {
  const result = await client.certifyContent({
    content: 'Text content',
    contentType: 'text/plain'
  });
} catch (error) {
  if (error instanceof CertNodeError) {
    console.log('Status:', error.statusCode);
    console.log('Code:', error.code);

    if (error.rateLimitInfo) {
      console.log('Rate limit exceeded. Retry after:', error.rateLimitInfo.retryAfter);
    }
  }
}
```

## Rate Limiting

The SDK automatically handles rate limiting with exponential backoff:

- **FREE**: 10 requests/minute
- **STARTER**: 100 requests/minute
- **PRO**: 1,000 requests/minute
- **ENTERPRISE**: 10,000 requests/minute

## Examples

### Text Analysis

```javascript
// Analyze text for AI generation
const textResult = await client.certifyContent({
  content: 'This is a sample text that might be AI-generated.',
  contentType: 'text/plain',
  metadata: {
    source: 'blog_post',
    url: 'https://example.com/post'
  }
});

if (textResult.receipt.aiDetection.confidence > 0.8) {
  console.log('High likelihood of AI generation');
  console.log('Detected models:', textResult.receipt.aiDetection.detectedModels);
}
```

### Image Analysis

```javascript
import fs from 'fs';

// Analyze image for AI generation
const imageBuffer = fs.readFileSync('image.jpg');
const imageResult = await client.certifyContent({
  content: imageBuffer,
  contentType: 'image/jpeg'
});

console.log('AI Confidence:', imageResult.receipt.aiDetection.confidence);
```

### Batch Processing

```javascript
// Process multiple documents
const documents = [
  'Document 1 content...',
  'Document 2 content...',
  'Document 3 content...'
];

const batchResults = await client.certifyBatch(
  documents.map(content => ({
    content,
    contentType: 'text/plain'
  }))
);

batchResults.forEach((result, index) => {
  console.log(`Document ${index + 1} confidence:`, result.receipt.aiDetection.confidence);
});
```

## TypeScript Support

The SDK is written in TypeScript and provides full type safety:

```typescript
import { CertNodeClient, ContentCertificationRequest, AIDetectionResult } from '@certnode/sdk';

const client = new CertNodeClient({ apiKey: 'your_key' });

const request: ContentCertificationRequest = {
  content: 'Sample text',
  contentType: 'text/plain'
};

const result = await client.certifyContent(request);
const detection: AIDetectionResult = result.receipt.aiDetection;
```

## Support

- **Documentation**: https://docs.certnode.io
- **Support**: support@certnode.io
- **GitHub**: https://github.com/srbryant86/certnode
- **Status**: https://status.certnode.io