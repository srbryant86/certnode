import { Metadata } from 'next';
import Footer from '@/components/Footer';
import ReceiptGraphMultiMode from '@/components/ReceiptGraphMultiMode';
import CompetitorComparison from '@/components/CompetitorComparison';

export const metadata: Metadata = {
  title: 'Platform Architecture — CertNode Receipt Graph',
  description: 'Technical deep-dive into CertNode\'s cross-domain receipt graph. Cryptographic linking, DAG structure, ES256 signatures, and blockchain anchoring.',
  keywords: 'receipt graph, DAG, cryptographic receipts, ES256, SHA-256, blockchain anchoring, cross-domain verification, merkle tree',
  openGraph: {
    title: 'Platform Architecture — CertNode Receipt Graph',
    description: 'Technical documentation for CertNode\'s cryptographic receipt infrastructure. DAG-based linking, ES256 signatures, blockchain anchoring.',
    type: 'website',
    url: 'https://certnode.io/platform',
  },
};

export default function PlatformPage() {
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl">
              <div className="inline-block bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-mono px-4 py-1.5 rounded mb-4">
                TECHNICAL DOCUMENTATION
              </div>

              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Cross-Domain Receipt Graph Architecture
              </h1>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                A directed acyclic graph (DAG) linking cryptographic receipts across transactions, content, and operations.
                ES256 signatures, SHA-256 hashing, blockchain anchoring, and deterministic verification.
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Signature Algorithm</div>
                  <div className="font-mono text-lg font-bold">ES256 (ECDSA)</div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Hashing</div>
                  <div className="font-mono text-lg font-bold">SHA-256</div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Graph Structure</div>
                  <div className="font-mono text-lg font-bold">DAG</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#architecture"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-all text-center"
                >
                  View Architecture
                </a>
                <a
                  href="/platform-api"
                  className="bg-transparent border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-lg font-semibold transition-all text-center"
                >
                  API Documentation
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="architecture" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">How Receipt Linking Works</h2>

            <div className="grid md:grid-cols-2 gap-12 mb-12">
              {/* Left: Explanation */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Receipt Creation</h3>
                <p className="text-gray-700 mb-6">
                  Every event (transaction, content upload, operation) generates a cryptographic receipt:
                </p>
                <div className="bg-gray-900 text-gray-100 rounded-xl p-6 font-mono text-sm overflow-x-auto mb-6">
                  <pre>{`{
  "id": "rcpt_abc123",
  "type": "transaction",
  "hash": "sha256:f7a8b...",
  "signature": "ES256:9k2l...",
  "timestamp": "2025-10-04T12:00:00Z",
  "data": {
    "amount": 199.00,
    "merchant": "shop.example"
  },
  "parentIds": [],
  "depth": 0
}`}</pre>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Graph Linking</h3>
                <p className="text-gray-700 mb-6">
                  Receipts reference parent receipts via <code className="bg-gray-100 px-2 py-1 rounded">parentIds</code>,
                  creating a tamper-evident chain:
                </p>
                <div className="bg-gray-900 text-gray-100 rounded-xl p-6 font-mono text-sm overflow-x-auto">
                  <pre>{`{
  "id": "rcpt_xyz789",
  "type": "shipment",
  "hash": "sha256:a3c9d...",
  "signature": "ES256:7h4m...",
  "parentIds": ["rcpt_abc123"],
  "depth": 1,
  "relationType": "fulfillment"
}`}</pre>
                </div>
              </div>

              {/* Right: Visual */}
              <div>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Example: E-Commerce Flow</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                        1
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Order Receipt</div>
                        <div className="text-sm text-gray-600 font-mono">rcpt_order_001</div>
                        <div className="text-xs text-gray-500">Depth: 0, Parents: []</div>
                      </div>
                    </div>
                    <div className="ml-4 border-l-2 border-blue-300 h-6"></div>
                    <div className="flex items-start gap-3">
                      <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                        2
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Payment Receipt</div>
                        <div className="text-sm text-gray-600 font-mono">rcpt_payment_001</div>
                        <div className="text-xs text-gray-500">Depth: 1, Parents: [rcpt_order_001]</div>
                      </div>
                    </div>
                    <div className="ml-4 border-l-2 border-blue-300 h-6"></div>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                        3
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Shipment Receipt</div>
                        <div className="text-sm text-gray-600 font-mono">rcpt_ship_001</div>
                        <div className="text-xs text-gray-500">Depth: 2, Parents: [rcpt_payment_001]</div>
                      </div>
                    </div>
                    <div className="ml-4 border-l-2 border-blue-300 h-6"></div>
                    <div className="flex items-start gap-3">
                      <div className="bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                        4
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Delivery Receipt</div>
                        <div className="text-sm text-gray-600 font-mono">rcpt_delivery_001</div>
                        <div className="text-xs text-gray-500">Depth: 3, Parents: [rcpt_ship_001]</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-blue-200">
                    <div className="text-sm text-gray-700">
                      <strong>Result:</strong> Tamper-evident chain from order → delivery.
                      Any modification breaks the cryptographic signatures.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cryptographic Details */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">Cryptographic Specifications</h2>

            <div className="grid md:grid-cols-3 gap-8">
              {/* ES256 Signatures */}
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <div className="text-3xl mb-4">🔐</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">ES256 Signatures</h3>
                <p className="text-gray-700 mb-4">
                  ECDSA with P-256 curve and SHA-256. Industry standard used by JWT, WebAuthn, and Apple.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs">
                  <div className="text-gray-600 mb-2">// Signature format</div>
                  <div>ES256:base64(r||s)</div>
                  <div className="text-gray-600 mt-2">// 64 bytes total</div>
                </div>
              </div>

              {/* SHA-256 Hashing */}
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <div className="text-3xl mb-4">🔗</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">SHA-256 Hashing</h3>
                <p className="text-gray-700 mb-4">
                  Content-addressable receipts. Hash includes all receipt data + parent hashes for Merkle tree properties.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs">
                  <div className="text-gray-600 mb-2">// Hash input</div>
                  <div>SHA256(data + metadata + parentHashes)</div>
                  <div className="text-gray-600 mt-2">// Output: 32 bytes</div>
                </div>
              </div>

              {/* Blockchain Anchoring */}
              <div className="bg-white rounded-xl p-8 border border-gray-200">
                <div className="text-3xl mb-4">⛓️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Blockchain Anchoring</h3>
                <p className="text-gray-700 mb-4">
                  Merkle root of receipt batches anchored to Ethereum mainnet every 24 hours for timestamping.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs">
                  <div className="text-gray-600 mb-2">// Anchor transaction</div>
                  <div>0x7f9a3b...</div>
                  <div className="text-gray-600 mt-2">// Block: 18,234,567</div>
                </div>
              </div>
            </div>

            {/* Verification Code Example */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Offline Verification Example</h3>
              <div className="bg-gray-900 text-gray-100 rounded-xl p-8">
                <div className="text-sm text-gray-400 mb-4">Node.js / TypeScript</div>
                <pre className="overflow-x-auto text-sm font-mono">{`import { createHash } from 'crypto';
import { verify } from 'jsonwebtoken';

// Verify receipt signature (offline, no API call)
function verifyReceipt(receipt: Receipt, publicKey: string): boolean {
  // 1. Recompute hash
  const computedHash = createHash('sha256')
    .update(JSON.stringify({
      id: receipt.id,
      type: receipt.type,
      data: receipt.data,
      parentIds: receipt.parentIds,
      timestamp: receipt.timestamp
    }))
    .digest('hex');

  // 2. Verify hash matches
  if (computedHash !== receipt.hash) {
    return false;
  }

  // 3. Verify ES256 signature
  try {
    verify(receipt.signature, publicKey, {
      algorithms: ['ES256']
    });
    return true;
  } catch {
    return false;
  }
}

// Verify entire graph chain
function verifyReceiptChain(receipts: Receipt[]): boolean {
  const receiptMap = new Map(receipts.map(r => [r.id, r]));

  for (const receipt of receipts) {
    // Verify this receipt
    if (!verifyReceipt(receipt, PUBLIC_KEY)) {
      return false;
    }

    // Verify parent links
    for (const parentId of receipt.parentIds) {
      const parent = receiptMap.get(parentId);
      if (!parent || parent.depth >= receipt.depth) {
        return false; // Invalid DAG structure
      }
    }
  }

  return true;
}`}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Receipt Graph */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Interactive Receipt Graph Explorer
              </h2>
              <p className="text-xl text-gray-600">
                Explore how receipts link across different domains and industries
              </p>
            </div>
            <ReceiptGraphMultiMode />
          </div>
        </section>

        {/* Technical Comparison */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">Technical Comparison</h2>
            <CompetitorComparison />

            {/* Why DAG vs Linear Chain */}
            <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Why DAG Instead of Linear Blockchain?</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">✓ DAG Advantages</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span><strong>Parallel receipts:</strong> Multiple branches can evolve simultaneously (e.g., order + payment + shipment)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span><strong>Cross-domain linking:</strong> Receipt from one merchant can reference another merchant&apos;s receipts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span><strong>No global ordering:</strong> Don&apos;t need consensus on sequence, only parentage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span><strong>Efficient verification:</strong> Verify sub-graph without loading entire chain</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-3">✗ Linear Chain Limitations</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span><strong>Sequential only:</strong> Can&apos;t represent parallel events</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span><strong>Single domain:</strong> Hard to link across merchants/systems</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span><strong>Global state:</strong> Requires consensus mechanism</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span><strong>Verification overhead:</strong> Must process entire chain</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Integration Guide */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">Integration Options</h2>

            <div className="grid md:grid-cols-3 gap-8">
              {/* REST API */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-8 border border-blue-200">
                <div className="text-3xl mb-4">🔌</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">REST API</h3>
                <p className="text-gray-700 mb-6">
                  Simple HTTP endpoints for receipt creation, verification, and graph traversal.
                </p>
                <a
                  href="/platform-api"
                  className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700"
                >
                  View API Docs →
                </a>
              </div>

              {/* Webhooks */}
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-8 border border-purple-200">
                <div className="text-3xl mb-4">🔔</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Webhooks</h3>
                <p className="text-gray-700 mb-6">
                  Real-time notifications when receipts are created, linked, or verified.
                </p>
                <div className="text-gray-500 text-sm font-mono">
                  POST /api/webhooks
                </div>
              </div>

              {/* SDKs */}
              <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-8 border border-green-200">
                <div className="text-3xl mb-4">📦</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">SDKs</h3>
                <p className="text-gray-700 mb-6">
                  Native libraries for Node.js, Python, Ruby, Go, and PHP.
                </p>
                <div className="text-gray-500 text-sm font-mono">
                  npm install @certnode/sdk
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Build?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Start creating cryptographic receipts and building tamper-proof audit trails.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/pricing"
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-lg font-bold text-lg transition-all"
              >
                View Pricing
              </a>
              <a
                href="mailto:contact@certnode.io?subject=Technical Integration"
                className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-10 py-4 rounded-lg font-bold text-lg transition-all"
              >
                Contact Engineering
              </a>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
