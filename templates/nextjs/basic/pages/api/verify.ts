/**
 * CertNode Receipt Verification API
 * Next.js API route for verifying CertNode receipts
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyReceipt, JWKSManager } from '@certnode/sdk';

interface VerifyRequestBody {
  receipt: {
    protected: string;
    payload: any;
    signature: string;
    kid: string;
    receipt_id?: string;
  };
  jwks?: {
    keys: any[];
  };
}

interface VerifyResponse {
  valid: boolean;
  reason?: string;
  receiptId?: string;
  algorithm?: string;
  timestamp: string;
}

interface ErrorResponse {
  error: string;
  message: string;
  details?: string;
}

// Initialize JWKS manager with caching
const jwksManager = new JWKSManager({
  ttlMs: parseInt(process.env.JWKS_CACHE_TTL || '300000'), // 5 minutes
});

const JWKS_URL = process.env.CERTNODE_JWKS_URL || 'https://api.certnode.io/.well-known/jwks.json';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResponse | ErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      error: 'method_not_allowed',
      message: 'Only POST method is allowed'
    });
  }

  try {
    const { receipt, jwks: providedJwks }: VerifyRequestBody = req.body;

    // Validate request body
    if (!receipt) {
      return res.status(400).json({
        error: 'missing_receipt',
        message: 'Receipt is required for verification'
      });
    }

    // Validate receipt structure
    if (!receipt.protected || !receipt.signature || !receipt.kid) {
      return res.status(400).json({
        error: 'invalid_receipt',
        message: 'Receipt must contain protected, signature, and kid fields'
      });
    }

    // Use provided JWKS or fetch from configured URL
    const jwks = providedJwks || await jwksManager.fetchFromUrl(JWKS_URL);

    // Verify the receipt
    const result = await verifyReceipt({ receipt, jwks });

    // Extract algorithm from protected header
    let algorithm: string | undefined;
    try {
      const protectedHeader = JSON.parse(
        Buffer.from(receipt.protected, 'base64').toString()
      );
      algorithm = protectedHeader.alg;
    } catch {
      // Algorithm extraction failed, but verification result is still valid
    }

    // Return verification result
    return res.status(200).json({
      valid: result.ok,
      reason: result.reason || undefined,
      receiptId: receipt.receipt_id || receipt.kid,
      algorithm,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Verification API error:', error);

    // Handle specific error types
    if (error instanceof SyntaxError) {
      return res.status(400).json({
        error: 'invalid_json',
        message: 'Invalid JSON in request body'
      });
    }

    // Generic error response
    return res.status(500).json({
      error: 'verification_error',
      message: 'Failed to verify receipt',
      details: process.env.NODE_ENV === 'development' ?
        (error as Error).message : undefined
    });
  }
}

// Configure API route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};