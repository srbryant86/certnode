/**
 * Receipt Graph DAG Types
 *
 * Defines the structure for the Receipt Graph directed acyclic graph (DAG).
 * This is the killer feature that no competitor can replicate.
 */

export type ReceiptType = 'transaction' | 'content' | 'operations';

export type RelationType =
  | 'causes'        // Parent caused this receipt
  | 'evidences'     // This receipt provides evidence for parent
  | 'fulfills'      // This receipt fulfills parent requirement
  | 'invalidates'   // This receipt invalidates parent
  | 'amends'        // This receipt amends/corrects parent
  | 'references';   // General reference

export type TrustLevel = 'BASIC' | 'VERIFIED' | 'PLATINUM';

/**
 * Core Receipt structure with graph relationships
 */
export interface Receipt {
  // Core fields
  id: string;
  type: ReceiptType;
  data: any;
  sha256_hash: string;
  timestamp: string;
  signature?: string;

  // Graph relationships
  relationships?: ReceiptRelationships;

  // Cryptographic proof of relationships
  graph_hash?: string;  // Hash of all parent receipt hashes

  // Trust scoring
  trust_score?: number;      // 0.0-1.0
  trust_level?: TrustLevel;  // BASIC/VERIFIED/PLATINUM
  graph_depth?: number;      // How deep in the graph (0 = orphaned)
  graph_completeness?: number; // 0.0-1.0

  // Metadata
  created_at?: string;
  updated_at?: string;
}

/**
 * Receipt relationships in the DAG
 */
export interface ReceiptRelationships {
  parentReceipts: string[];      // Can have multiple parents
  childReceipts: string[];       // Can have multiple children
  relationType: RelationType;
  metadata: RelationshipMetadata;
}

export interface RelationshipMetadata {
  relationshipDescription: string;
  createdBy: string;
  timestamp: string;
}

/**
 * Database record for receipt relationships
 */
export interface ReceiptRelationship {
  id: number;
  parent_receipt_id: string;
  child_receipt_id: string;
  relation_type: RelationType;
  description?: string;
  created_by?: string;
  created_at: string;
}

/**
 * Receipt Graph structure (full DAG)
 */
export interface ReceiptGraph {
  root: Receipt | null;
  nodes: Receipt[];
  edges: GraphEdge[];
  depth: number;
  totalReceipts: number;
  visualizationData?: GraphVisualization;
}

export interface GraphEdge {
  from: string;  // parent receipt id
  to: string;    // child receipt id
  type: RelationType;
}

/**
 * Graph visualization data structure
 */
export interface GraphVisualization {
  nodes: VisualizationNode[];
  edges: VisualizationEdge[];
  layout: 'hierarchical' | 'force' | 'radial';
}

export interface VisualizationNode {
  id: string;
  label: string;
  type: ReceiptType;
  trustLevel: TrustLevel;
  depth: number;
  x?: number;
  y?: number;
}

export interface VisualizationEdge {
  from: string;
  to: string;
  label: string;
  type: RelationType;
}

/**
 * Path between two receipts
 */
export interface ReceiptPath {
  receipts: string[];        // Array of receipt IDs in path
  relationships: RelationType[]; // Relationship types between receipts
  length: number;            // Path length
  trustScore: number;        // Overall trust score of path
}

/**
 * Graph analytics data
 */
export interface GraphAnalytics {
  totalReceipts: number;
  totalRelationships: number;

  // Receipt type distribution
  receiptsByType: {
    transaction: number;
    content: number;
    operations: number;
  };

  // Trust distribution
  trustLevelDistribution: {
    BASIC: number;
    VERIFIED: number;
    PLATINUM: number;
  };

  averageTrustScore: number;

  // Graph structure metrics
  averageGraphDepth: number;
  maxGraphDepth: number;
  orphanedReceipts: number;  // Receipts with no parents/children

  // Most connected receipts
  mostConnectedReceipts: Array<{
    receiptId: string;
    connectionCount: number;
    type: ReceiptType;
  }>;

  // Relationship type distribution
  relationshipTypeDistribution: Record<RelationType, number>;

  // Graph completeness
  graphCompletenessScore: number;  // 0.0-1.0
}

/**
 * Graph pattern for fraud detection
 */
export interface GraphPattern {
  name: string;
  description: string;
  pattern: string;  // Pattern query string
  riskLevel: 'high' | 'medium' | 'low';
  action: string;   // Recommended action
}

/**
 * Pattern match result
 */
export interface PatternMatch {
  pattern: string;
  description: string;
  receipts: Receipt[];
  riskLevel: 'high' | 'medium' | 'low';
  recommendation: string;
  detectedAt: string;
  riskScore: number;
}

/**
 * Graph completeness check result
 */
export interface CompletenessCheck {
  score: number;  // 0.0-1.0
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
  recommendation: string;
}

/**
 * Cross-product verification result
 */
export interface CrossProductVerification {
  valid: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
  trustScore: number;
  recommendation: string;
}

/**
 * API request/response types
 */

// Create receipt with graph relationships
export interface CreateGraphReceiptRequest {
  type: ReceiptType;
  data: any;
  parentReceipts?: string[];
  relationType?: RelationType;
  relationshipDescription?: string;
}

export interface CreateGraphReceiptResponse {
  receipt: Receipt;
  relationships: ReceiptRelationship[];
}

// Query graph
export interface QueryGraphRequest {
  receiptId: string;
  maxDepth?: number;
  includeVisualization?: boolean;
}

export interface QueryGraphResponse {
  graph: ReceiptGraph;
}

// Find paths
export interface FindPathsRequest {
  fromReceiptId: string;
  toReceiptId: string;
  maxPaths?: number;
}

export interface FindPathsResponse {
  paths: ReceiptPath[];
  totalPaths: number;
}

// Graph pattern query
export interface GraphPatternQueryRequest {
  pattern: string;  // e.g., "Transaction -> Content -> Operations"
  filters?: {
    transactionAmount?: { gt?: number; lt?: number };
    contentType?: string;
    operationsType?: string;
    missing?: boolean;  // Find incomplete patterns
  };
}

export interface GraphPatternQueryResponse {
  matches: Array<{
    transaction?: Receipt;
    content?: Receipt;
    operations?: Receipt;
    riskScore: number;
    recommendation: string;
  }>;
  totalMatches: number;
}

// Graph analytics
export interface GraphAnalyticsRequest {
  startDate?: string;
  endDate?: string;
}

export interface GraphAnalyticsResponse {
  analytics: GraphAnalytics;
  generatedAt: string;
}

/**
 * Tier limits for graph depth
 */
export const GRAPH_DEPTH_LIMITS = {
  FREE: 3,
  STARTER: 5,
  PROFESSIONAL: 10,
  BUSINESS: Infinity,
  ENTERPRISE: Infinity
} as const;

/**
 * Trust score thresholds
 */
export const TRUST_THRESHOLDS = {
  PLATINUM: 0.95,
  VERIFIED: 0.85,
  BASIC: 0.60
} as const;

/**
 * Helper type guards
 */

export function isReceipt(obj: any): obj is Receipt {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    ['transaction', 'content', 'operations'].includes(obj.type) &&
    typeof obj.sha256_hash === 'string'
  );
}

export function isReceiptGraph(obj: any): obj is ReceiptGraph {
  return (
    typeof obj === 'object' &&
    Array.isArray(obj.nodes) &&
    Array.isArray(obj.edges) &&
    typeof obj.totalReceipts === 'number'
  );
}

export function isValidRelationType(type: string): type is RelationType {
  return ['causes', 'evidences', 'fulfills', 'invalidates', 'amends', 'references'].includes(type);
}

export function isValidTrustLevel(level: string): level is TrustLevel {
  return ['BASIC', 'VERIFIED', 'PLATINUM'].includes(level);
}

/**
 * Helper functions
 */

export function getTrustLevelFromScore(score: number): TrustLevel {
  if (score >= TRUST_THRESHOLDS.PLATINUM) return 'PLATINUM';
  if (score >= TRUST_THRESHOLDS.VERIFIED) return 'VERIFIED';
  return 'BASIC';
}

export function getGraphDepthLimit(tier: string): number {
  const upperTier = tier.toUpperCase() as keyof typeof GRAPH_DEPTH_LIMITS;
  return GRAPH_DEPTH_LIMITS[upperTier] || GRAPH_DEPTH_LIMITS.FREE;
}

export function calculateTrustScoreBonus(receipt: Receipt): number {
  let bonus = 0;

  // Bonus for having parent receipts
  if (receipt.relationships?.parentReceipts && receipt.relationships.parentReceipts.length > 0) {
    bonus += 0.05;
  }

  // Bonus for graph depth
  if (receipt.graph_depth && receipt.graph_depth >= 3) {
    bonus += 0.05;
  }

  return bonus;
}

export function formatReceiptLabel(receipt: Receipt): string {
  const typeLabels = {
    transaction: 'Transaction',
    content: 'Content',
    operations: 'Operations'
  };

  return `${typeLabels[receipt.type]} ${receipt.id.substring(0, 8)}...`;
}

export function formatRelationshipLabel(relationType: RelationType): string {
  const labels: Record<RelationType, string> = {
    causes: 'Causes',
    evidences: 'Evidences',
    fulfills: 'Fulfills',
    invalidates: 'Invalidates',
    amends: 'Amends',
    references: 'References'
  };

  return labels[relationType];
}
