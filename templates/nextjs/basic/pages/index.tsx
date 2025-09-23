/**
 * CertNode Next.js Template - Home Page
 * Interactive receipt verification demo
 */

import React, { useState } from 'react';
import { useCertNodeVerification } from '@certnode/react';
import { CheckCircle, XCircle, Upload, Loader2, Key, Shield, FileText } from 'lucide-react';
import Head from 'next/head';

interface Receipt {
  protected: string;
  payload: any;
  signature: string;
  kid: string;
  receipt_id?: string;
}

interface JWKS {
  keys: any[];
}

export default function Home() {
  const [receiptText, setReceiptText] = useState('');
  const [jwksText, setJwksText] = useState('');
  const [useExampleData, setUseExampleData] = useState(false);

  const { verify, result, loading, error, isValid, reset } = useCertNodeVerification();

  // Example data for demonstration
  const exampleReceipt = {
    protected: "eyJhbGciOiJFUzI1NiIsImtpZCI6ImVzMjU2LWtleSJ9",
    payload: {
      document_id: "DOC-EXAMPLE-001",
      content: "Example document content",
      timestamp: new Date().toISOString()
    },
    signature: "EXAMPLE_ES256_SIGNATURE_BASE64URL_ENCODED",
    kid: "es256-key"
  };

  const exampleJWKS = {
    keys: [{
      kty: "EC",
      crv: "P-256",
      x: "f83OJ3D2xF1Bg8vub9tLe1gHMzV76e8Tus9uPHvRVEU",
      y: "x_FEzRu9m36HLN_tue659LNpXW6pCyStikYjKIWI5a0",
      kid: "es256-key",
      alg: "ES256"
    }]
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let receipt: Receipt;
      let jwks: JWKS;

      if (useExampleData) {
        receipt = exampleReceipt;
        jwks = exampleJWKS;
      } else {
        if (!receiptText.trim() || !jwksText.trim()) {
          alert('Please provide both receipt and JWKS JSON');
          return;
        }

        receipt = JSON.parse(receiptText);
        jwks = JSON.parse(jwksText);
      }

      await verify(receipt, jwks);
    } catch (err) {
      console.error('Parse error:', err);
      alert('Invalid JSON format. Please check your input.');
    }
  };

  const loadExampleData = () => {
    setReceiptText(JSON.stringify(exampleReceipt, null, 2));
    setJwksText(JSON.stringify(exampleJWKS, null, 2));
    setUseExampleData(false);
  };

  const clearData = () => {
    setReceiptText('');
    setJwksText('');
    setUseExampleData(false);
    reset();
  };

  return (
    <>
      <Head>
        <title>CertNode Verification Demo</title>
        <meta name="description" content="Interactive CertNode receipt verification demo" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Shield className="w-16 h-16 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              CertNode Verification Demo
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Interactive demo for verifying tamper-evident digital receipts using CertNode
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-3">
                <Key className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold">ES256 & EdDSA</h3>
              </div>
              <p className="text-gray-600">
                Support for both ES256 (ECDSA P-256) and EdDSA (Ed25519) cryptographic algorithms
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-3">
                <Shield className="w-6 h-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold">Zero Dependencies</h3>
              </div>
              <p className="text-gray-600">
                Pure Node.js crypto implementation with no external dependencies
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-3">
                <FileText className="w-6 h-6 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold">RFC Compliant</h3>
              </div>
              <p className="text-gray-600">
                Full compliance with RFC 7515 (JWS) and RFC 8785 (JCS) standards
              </p>
            </div>
          </div>

          {/* Main Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <form onSubmit={handleVerify} className="space-y-6">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-4 mb-6">
                <button
                  type="button"
                  onClick={loadExampleData}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Load Example Data
                </button>
                <button
                  type="button"
                  onClick={clearData}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Clear All
                </button>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={useExampleData}
                    onChange={(e) => setUseExampleData(e.target.checked)}
                    className="mr-2"
                  />
                  Use example data (for demo)
                </label>
              </div>

              {/* Input Fields */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="receipt" className="block text-sm font-medium text-gray-700 mb-2">
                    Receipt JSON
                  </label>
                  <textarea
                    id="receipt"
                    value={receiptText}
                    onChange={(e) => setReceiptText(e.target.value)}
                    placeholder="Paste your CertNode receipt JSON here..."
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    disabled={useExampleData}
                  />
                </div>

                <div>
                  <label htmlFor="jwks" className="block text-sm font-medium text-gray-700 mb-2">
                    JWKS JSON
                  </label>
                  <textarea
                    id="jwks"
                    value={jwksText}
                    onChange={(e) => setJwksText(e.target.value)}
                    placeholder="Paste your JWKS JSON here..."
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    disabled={useExampleData}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading || (!useExampleData && (!receiptText.trim() || !jwksText.trim()))}
                  className="inline-flex items-center px-8 py-3 bg-blue-600 text-white text-lg font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Verify Receipt
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Results */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <XCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">Error</span>
                </div>
                <p className="text-red-700 mt-1">{error.message}</p>
              </div>
            )}

            {result && (
              <div className={`mt-6 p-4 border rounded-md ${
                isValid
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center mb-2">
                  {isValid ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-green-800 font-medium">Receipt Verified ✅</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600 mr-2" />
                      <span className="text-red-800 font-medium">Verification Failed ❌</span>
                    </>
                  )}
                </div>

                {!isValid && result.reason && (
                  <p className="text-red-700">
                    <strong>Reason:</strong> {result.reason}
                  </p>
                )}

                {isValid && (
                  <div className="text-green-700 space-y-1">
                    <p>The receipt signature is valid and the content has not been tampered with.</p>
                    <p className="text-sm">
                      <strong>Algorithm:</strong> {
                        receiptText && JSON.parse(receiptText).protected ?
                          JSON.parse(Buffer.from(JSON.parse(receiptText).protected, 'base64').toString()).alg :
                          'Unknown'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-gray-600">
            <p>
              Built with{' '}
              <a
                href="https://certnode.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                CertNode
              </a>
              {' '}and{' '}
              <a
                href="https://nextjs.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Next.js
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}