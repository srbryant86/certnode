import { KeyStatus, PlanTier, VerificationStatus } from "@prisma/client";

export type ActivityType =
  | "receipt_generated"
  | "api_key_created"
  | "user_invited";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface DashboardMetrics {
  receiptsThisMonth: number;
  remainingQuota: number;
  quotaUtilization: number;
  uptimePercentage: number;
  avgResponseTime: number;
  errorRate: number;
  currentCosts: number;
  projectedCosts: number;
  savings: number;
  totalReceipts: number;
  recentActivity: ActivityItem[];
}

export interface DashboardApiKey {
  id: string;
  name: string;
  keyPreview: string;
  permissions: Permission[];
  rateLimit: number;
  rateLimitWindow: RateLimitWindow;
  lastUsed: Date | null;
  usageCount: number;
  created: Date;
  expiresAt: Date | null;
  status: Extract<KeyStatus, "active" | "revoked" | "expired">;
  ipRestrictions: string[];
}

export type RateLimitWindow = "1h" | "1d" | "1m";

export interface Permission {
  resource: "receipts" | "analytics" | "team";
  actions: Array<"read" | "write" | "delete">;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AmountRange {
  min?: number;
  max?: number;
}

export interface ReceiptQuery {
  dateRange: DateRange;
  amountRange: AmountRange;
  status: VerificationStatus[];
  transactionTypes: string[];
  searchTerm: string;
  sortBy: "created_at" | "amount" | "verification_status";
  sortOrder: "asc" | "desc";
  limit: number;
  offset: number;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface CryptographicProof {
  merkleRoot: string;
  signature: string;
  algorithm: string;
  issuedAt: Date;
  evidence: Record<string, unknown>;
}

export type TransactionMetadata = Record<string, unknown>;

export interface ReceiptDetail {
  id: string;
  transactionId: string;
  amount: Money;
  currency: string;
  status: VerificationStatus;
  cryptographicProof: CryptographicProof;
  metadata: TransactionMetadata;
  createdAt: Date;
  apiKey: {
    id: string;
    name: string;
  };
}

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface CategoryMetric {
  label: string;
  value: number;
  percentage: number;
}

export interface GeoMetric {
  region: string;
  receipts: number;
  percentage: number;
}

export interface UsageMetric {
  keyId: string;
  keyName: string;
  totalReceipts: number;
  lastUsed: Date | null;
}

export interface UptimeData {
  last24Hours: number;
  last7Days: number;
  last30Days: number;
}

export interface ForecastData {
  projectedReceipts: TimeSeriesPoint[];
  confidenceInterval: [number, number];
}

export interface PlanRecommendation {
  recommendedTier: PlanTier;
  justification: string;
  projectedSavings: number;
}

export interface AnalyticsData {
  receiptsOverTime: TimeSeriesPoint[];
  costsOverTime: TimeSeriesPoint[];
  errorRatesOverTime: TimeSeriesPoint[];
  topTransactionTypes: CategoryMetric[];
  geographicDistribution: GeoMetric[];
  apiKeyUsage: UsageMetric[];
  uptimeMetrics: UptimeData;
  verificationSuccessRate: number;
  averageProcessingTime: number;
  projectedUsage: ForecastData;
  recommendedPlan: PlanRecommendation;
}

export interface SubscriptionData {
  currentPlan: {
    tier: PlanTier;
    receiptsIncluded: number;
    overageRate: number;
    billingCycle: "monthly" | "yearly";
  };
  currentUsage: {
    receiptsUsed: number;
    overageReceipts: number;
    currentCosts: number;
    projectedCosts: number;
  };
  invoices: Invoice[];
  paymentMethods: PaymentMethod[];
  availableUpgrades: PlanOption[];
  downgradeLimitations: string[];
}

export interface Invoice {
  id: string;
  status: "draft" | "open" | "paid" | "void";
  amountDue: number;
  dueDate: Date;
  invoicePdfUrl: string;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expiresAt: string;
  isDefault: boolean;
}

export interface PlanOption {
  tier: PlanTier;
  receiptsIncluded: number;
  overageRate: number;
  monthlyPrice: number;
  yearlyPrice: number;
}

export type TeamRole =
  | "owner"
  | "admin"
  | "developer"
  | "viewer"
  | "billing";

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: TeamRole;
  permissions: Permission[];
  lastActive: Date;
  mfaEnabled: boolean;
  ssoEnabled: boolean;
  status: "active" | "pending" | "suspended";
  invitedBy: string;
  joinedAt: Date;
}

export interface TeamSettings {
  requireMFA: boolean;
  allowedDomains: string[];
  ssoEnabled: boolean;
  sessionTimeout: number;
  ipAllowlist: string[];
}

export interface SecurityMetrics {
  failedLogins: number;
  suspiciousActivity: SecurityEvent[];
  mfaAdoptionRate: number;
  apiAbuseAttempts: number;
  rateLimitViolations: RateLimitEvent[];
  unauthorizedAccess: UnauthorizedEvent[];
  auditReadiness: ComplianceScore;
  dataRetentionCompliance: boolean;
  encryptionStatus: EncryptionMetrics;
}

export interface SecurityEvent {
  id: string;
  type: "failed_login" | "api_abuse" | "unusual_activity";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  resolved: boolean;
}

export interface RateLimitEvent {
  id: string;
  keyId: string;
  window: RateLimitWindow;
  occurredAt: Date;
  count: number;
}

export interface UnauthorizedEvent {
  id: string;
  resource: string;
  attemptedBy: string;
  occurredAt: Date;
  outcome: "blocked" | "flagged";
}

export interface ComplianceScore {
  status: "pass" | "warning" | "fail";
  details: string;
  lastUpdated: Date;
}

export interface EncryptionMetrics {
  keysRotatedWithinSLA: boolean;
  staticEncryption: "aes256" | "fips" | "custom";
  inTransitEncryption: "tls1_2" | "tls1_3";
}

export interface DeveloperTools {
  apiDocs: OpenAPISpec;
  sdks: SDKDownload[];
  codeExamples: CodeExample[];
  apiPlayground: PlaygroundConfig;
  webhookTester: WebhookConfig;
  receiptValidator: ValidatorTool;
  platforms: IntegrationGuide[];
  tutorials: Tutorial[];
  bestPractices: BestPractice[];
}

export interface OpenAPISpec {
  version: string;
  url: string;
  lastUpdated: Date;
}

export interface SDKDownload {
  language: string;
  version: string;
  downloadUrl: string;
  installSnippet: string;
}

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  language: string;
  snippet: string;
}

export interface PlaygroundConfig {
  baseUrl: string;
  exampleRequests: CodeExample[];
}

export interface WebhookConfig {
  testEndpoints: string[];
  secret: string;
  verificationSteps: string[];
}

export interface ValidatorTool {
  supportedFormats: string[];
  samplePayload: Record<string, unknown>;
  validationRules: string[];
}

export interface IntegrationGuide {
  platform: string;
  description: string;
  steps: string[];
}

export interface Tutorial {
  id: string;
  title: string;
  estimatedDurationMinutes: number;
  prerequisites: string[];
  steps: string[];
}

export interface BestPractice {
  id: string;
  title: string;
  summary: string;
  recommendations: string[];
}
