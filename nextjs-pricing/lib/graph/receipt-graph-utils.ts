/**
 * Receipt Graph DAG Utilities
 *
 * Core functions for creating, querying, and analyzing the receipt graph.
 * Zero-cost implementation using PostgreSQL.
 */

import type {
  Receipt,
  ReceiptRelationship,
  ReceiptGraph,
  ReceiptPath,
  GraphAnalytics,
  GraphPattern,
  PatternMatch,
  CompletenessCheck,
  CrossProductVerification,
  RelationType,
  TrustLevel
} from '../types/receipt-graph';

import { getTrustLevelFromScore, TRUST_THRESHOLDS } from '../types/receipt-graph';

/**
 * Create a hash of parent receipts for cryptographic proof
 */
export function createGraphHash(parentHashes: string[]): string {
  const sortedHashes = parentHashes.sort();
  const combined = sortedHashes.join('');

  // Use Web Crypto API for SHA-256 (available in Node.js 16+)
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Calculate trust score for a receipt based on graph structure
 */
export function calculateTrustScore(receipt: Receipt, parentReceipts: Receipt[] = []): number {
  let score = 0.60; // Base: single receipt = 60%

  const linkedDomains = new Set<string>([receipt.type]);

  // Add domains from parent receipts
  for (const parent of parentReceipts) {
    linkedDomains.add(parent.type);
  }

  // Add points for domain coverage
  if (linkedDomains.has('content')) {
    score += 0.20; // +20% for content domain
  }

  if (linkedDomains.has('operations')) {
    score += 0.15; // +15% for operations domain
  }

  // Bonus for graph depth
  if (receipt.graph_depth && receipt.graph_depth >= 3) {
    score += 0.05; // +5% for deep graphs
  }

  // Bonus for having provenance (parent receipts)
  if (parentReceipts.length > 0) {
    score += 0.05; // +5% for provenance
  }

  // Cap at 1.0
  return Math.min(score, 1.0);
}

/**
 * Calculate graph completeness score
 */
export function calculateGraphCompleteness(receipt: Receipt, parentReceipts: Receipt[], childReceipts: Receipt[]): CompletenessCheck {
  let score = 0;
  const checks: Array<{ name: string; passed: boolean; message: string }> = [];

  // Check 1: Has parent receipts? (+25%)
  if (parentReceipts.length > 0) {
    score += 0.25;
    checks.push({
      name: 'Provenance',
      passed: true,
      message: `✓ Has ${parentReceipts.length} parent receipt(s)`
    });
  } else {
    checks.push({
      name: 'Provenance',
      passed: false,
      message: '✗ Missing parent receipts - add provenance'
    });
  }

  // Check 2: Connects multiple domains? (+25%)
  const domains = new Set([receipt.type, ...parentReceipts.map(p => p.type)]);
  if (domains.size >= 2) {
    score += 0.25;
    checks.push({
      name: 'Multi-Domain',
      passed: true,
      message: `✓ Connects ${domains.size} domains`
    });
  } else {
    checks.push({
      name: 'Multi-Domain',
      passed: false,
      message: '✗ Single domain only - add cross-domain links'
    });
  }

  // Check 3: Has child receipts? (+25%)
  if (childReceipts.length > 0) {
    score += 0.25;
    checks.push({
      name: 'Fulfillment',
      passed: true,
      message: `✓ Has ${childReceipts.length} child receipt(s)`
    });
  } else {
    checks.push({
      name: 'Fulfillment',
      passed: false,
      message: '✗ No child receipts - workflow may be incomplete'
    });
  }

  // Check 4: Not orphaned? (+25%)
  if (receipt.graph_depth && receipt.graph_depth > 0) {
    score += 0.25;
    checks.push({
      name: 'Graph Connection',
      passed: true,
      message: `✓ Part of larger graph (depth: ${receipt.graph_depth})`
    });
  } else {
    checks.push({
      name: 'Graph Connection',
      passed: false,
      message: '✗ Orphaned receipt - not connected to graph'
    });
  }

  return {
    score,
    checks,
    recommendation: score >= 0.75
      ? 'Graph is well-connected and complete'
      : 'Add missing receipts to improve completeness'
  };
}

/**
 * Verify cross-product consistency
 */
export function verifyCrossProduct(
  receipt1: Receipt,
  receipt2: Receipt,
  paths: ReceiptPath[]
): CrossProductVerification {
  const checks: Array<{ name: string; passed: boolean; message: string }> = [];

  // Check 1: Receipts are connected in graph
  const connected = paths.length > 0;
  checks.push({
    name: 'Graph Connection',
    passed: connected,
    message: connected
      ? `✓ Connected via ${paths.length} path(s)`
      : '✗ Receipts are not connected in graph'
  });

  // Check 2: Hash consistency
  // (Assuming transaction has contentHash in metadata)
  const receipt1HasHash = receipt1.data?.contentHash;
  const receipt2Hash = receipt2.sha256_hash;
  const hashesMatch = receipt1HasHash === receipt2Hash;

  if (receipt1HasHash) {
    checks.push({
      name: 'Hash Consistency',
      passed: hashesMatch,
      message: hashesMatch
        ? '✓ Content hash matches'
        : '✗ Content hash mismatch - possible tampering'
    });
  }

  // Check 3: Timestamp alignment
  const time1 = new Date(receipt1.timestamp);
  const time2 = new Date(receipt2.timestamp);
  const timeDiff = Math.abs(time1.getTime() - time2.getTime());
  const timeAligns = timeDiff < 24 * 60 * 60 * 1000; // Within 24 hours

  checks.push({
    name: 'Timestamp Alignment',
    passed: timeAligns,
    message: timeAligns
      ? '✓ Timestamps are coherent'
      : '✗ Timestamps are too far apart (>24h)'
  });

  // Check 4: Same merchant/enterprise
  const sameEnterprise = receipt1.data?.merchantId === receipt2.data?.merchantId;
  if (receipt1.data?.merchantId && receipt2.data?.merchantId) {
    checks.push({
      name: 'Enterprise Match',
      passed: sameEnterprise,
      message: sameEnterprise
        ? '✓ Both receipts belong to same enterprise'
        : '✗ Receipts belong to different enterprises'
    });
  }

  const allPassed = checks.every(c => c.passed);

  return {
    valid: allPassed,
    checks,
    trustScore: allPassed ? 0.95 : 0.60,
    recommendation: allPassed
      ? 'Cross-product verification passed - receipts are consistent'
      : 'Manual review recommended - inconsistencies detected'
  };
}

/**
 * Detect fraud patterns in the graph
 */
export const FRAUD_PATTERNS: GraphPattern[] = [
  {
    name: 'Refund Abuse',
    description: 'Repeated transaction-refund cycles between same parties',
    pattern: 'Transaction -> Transaction -> Transaction',
    riskLevel: 'high',
    action: 'Flag for manual review - possible refund abuse'
  },
  {
    name: 'AI Content High-Value Transaction',
    description: 'High-value transaction with AI-generated content lacking human review',
    pattern: 'Transaction (>$10K) -> Content (AI) -> !Operations (human_review)',
    riskLevel: 'high',
    action: 'Require human review before processing payment'
  },
  {
    name: 'Missing Delivery Confirmation',
    description: 'Transaction completed but no delivery confirmation',
    pattern: 'Transaction -> Content (product) -> !Operations (delivery)',
    riskLevel: 'medium',
    action: 'Request delivery confirmation'
  },
  {
    name: 'Incident Without Resolution',
    description: 'Security incident detected but no resolution receipt',
    pattern: 'Operations (incident) -> !Operations (resolution)',
    riskLevel: 'high',
    action: 'Escalate to security team - incident not resolved'
  },
  {
    name: 'Orphaned High-Value Transaction',
    description: 'High-value transaction with no supporting documentation',
    pattern: 'Transaction (>$5K) with graph_depth = 0',
    riskLevel: 'medium',
    action: 'Request supporting documentation (invoice, delivery, etc.)'
  }
];

/**
 * Detect if a pattern matches a set of receipts
 */
export function detectPattern(
  receipts: Receipt[],
  relationships: ReceiptRelationship[],
  pattern: GraphPattern
): PatternMatch[] {
  const matches: PatternMatch[] = [];

  // Simple pattern detection - can be enhanced with full query language
  if (pattern.name === 'Orphaned High-Value Transaction') {
    for (const receipt of receipts) {
      if (
        receipt.type === 'transaction' &&
        receipt.data?.amount > 5000 &&
        receipt.graph_depth === 0
      ) {
        matches.push({
          pattern: pattern.name,
          description: pattern.description,
          receipts: [receipt],
          riskLevel: pattern.riskLevel,
          recommendation: pattern.action,
          detectedAt: new Date().toISOString(),
          riskScore: 0.75
        });
      }
    }
  }

  if (pattern.name === 'Missing Delivery Confirmation') {
    for (const receipt of receipts) {
      if (receipt.type === 'transaction') {
        // Check if there's a content receipt but no operations receipt
        const hasContent = relationships.some(
          rel => rel.parent_receipt_id === receipt.id &&
                 receipts.find(r => r.id === rel.child_receipt_id)?.type === 'content'
        );

        const hasDelivery = relationships.some(
          rel => rel.parent_receipt_id === receipt.id &&
                 receipts.find(r => r.id === rel.child_receipt_id)?.type === 'operations' &&
                 receipts.find(r => r.id === rel.child_receipt_id)?.data?.operationType === 'delivery'
        );

        if (hasContent && !hasDelivery) {
          matches.push({
            pattern: pattern.name,
            description: pattern.description,
            receipts: [receipt],
            riskLevel: pattern.riskLevel,
            recommendation: pattern.action,
            detectedAt: new Date().toISOString(),
            riskScore: 0.65
          });
        }
      }
    }
  }

  return matches;
}

/**
 * Format receipt for visualization
 */
export function formatReceiptForVisualization(receipt: Receipt) {
  return {
    id: receipt.id,
    label: `${receipt.type}\n${receipt.id.substring(0, 8)}...`,
    type: receipt.type,
    trustLevel: receipt.trust_level || 'BASIC',
    depth: receipt.graph_depth || 0,
    color: getColorForType(receipt.type),
    size: getS izeForTrustLevel(receipt.trust_level || 'BASIC')
  };
}

function getColorForType(type: string): string {
  const colors = {
    transaction: '#48bb78', // Green
    content: '#667eea',     // Purple
    operations: '#ed8936'   // Orange
  };
  return colors[type as keyof typeof colors] || '#718096';
}

function getSizeForTrustLevel(level: TrustLevel): number {
  const sizes = {
    PLATINUM: 40,
    VERIFIED: 30,
    BASIC: 20
  };
  return sizes[level];
}

/**
 * Helper to build visualization edges
 */
export function formatEdgesForVisualization(relationships: ReceiptRelationship[]) {
  return relationships.map(rel => ({
    from: rel.parent_receipt_id,
    to: rel.child_receipt_id,
    label: rel.relation_type,
    type: rel.relation_type,
    color: getColorForRelation(rel.relation_type)
  }));
}

function getColorForRelation(relationType: RelationType): string {
  const colors: Record<RelationType, string> = {
    causes: '#f56565',      // Red
    evidences: '#4299e1',   // Blue
    fulfills: '#48bb78',    // Green
    invalidates: '#ed8936', // Orange
    amends: '#9f7aea',      // Purple
    references: '#718096'   // Gray
  };
  return colors[relationType];
}

/**
 * Validate receipt graph structure (no cycles)
 */
export function validateDAG(
  receipts: Receipt[],
  relationships: ReceiptRelationship[]
): { valid: boolean; cycles: string[][] } {
  const graph = new Map<string, string[]>();

  // Build adjacency list
  for (const rel of relationships) {
    if (!graph.has(rel.parent_receipt_id)) {
      graph.set(rel.parent_receipt_id, []);
    }
    graph.get(rel.parent_receipt_id)!.push(rel.child_receipt_id);
  }

  // Detect cycles using DFS
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const cycles: string[][] = [];

  function hasCycleDFS(node: string, path: string[]): boolean {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycleDFS(neighbor, [...path])) {
          return true;
        }
      } else if (recStack.has(neighbor)) {
        // Cycle detected
        const cycleStart = path.indexOf(neighbor);
        cycles.push(path.slice(cycleStart));
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }

  // Check all nodes
  for (const receipt of receipts) {
    if (!visited.has(receipt.id)) {
      hasCycleDFS(receipt.id, []);
    }
  }

  return {
    valid: cycles.length === 0,
    cycles
  };
}

/**
 * Calculate shortest path length between two receipts
 */
export function calculatePathDistance(path: ReceiptPath): number {
  // Simple: just the number of hops
  return path.length - 1;
}

/**
 * Score path trustworthiness based on receipts in path
 */
export function scorePathTrust(path: ReceiptPath, receipts: Receipt[]): number {
  const pathReceipts = receipts.filter(r => path.receipts.includes(r.id));
  const avgTrustScore = pathReceipts.reduce((sum, r) => sum + (r.trust_score || 0.6), 0) / pathReceipts.length;
  return avgTrustScore;
}
