# CertNode Customer Dashboard Architecture

## Executive Summary

This document outlines the comprehensive architecture for CertNode's enterprise-grade customer dashboard - a 10/10 quality B2B SaaS platform that will serve as the primary interface for customers to manage their cryptographic receipt infrastructure.

## Technical Foundation

### Core Technology Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for complete type safety
- **Styling**: Tailwind CSS with custom design system
- **Rendering**: Server-side rendering for optimal performance
- **Deployment**: Edge deployment via Vercel
- **Database**: PostgreSQL with read replicas

### Authentication & Security Architecture

#### Multi-Provider Authentication
```typescript
// NextAuth.js configuration
providers: [
  EmailProvider,           // Email/password with Argon2id hashing
  GoogleProvider,          // Google SSO
  AzureADProvider,         // Microsoft SSO (enterprise)
  SAMLProvider,            // SAML for large enterprises
]
```

#### Security Features
- **Multi-Factor Authentication**: TOTP and WebAuthn support
- **Session Management**: Secure JWT with rotation
- **Role-Based Access Control**: Granular permissions system
- **Audit Logging**: Complete action tracking
- **IP Allowlisting**: Enterprise security controls

### Database Schema

```sql
-- Core entity tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  enterprise_id UUID REFERENCES enterprises(id),
  password_hash VARCHAR(255),
  mfa_secret VARCHAR(255),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE enterprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  billing_tier plan_tier NOT NULL,
  subscription_id VARCHAR(255),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  enterprise_id UUID REFERENCES enterprises(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_preview VARCHAR(50) NOT NULL,
  permissions TEXT[] DEFAULT ARRAY['receipts:read', 'receipts:write'],
  rate_limit INTEGER DEFAULT 1000,
  last_used TIMESTAMP,
  expires_at TIMESTAMP,
  status key_status DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id),
  enterprise_id UUID REFERENCES enterprises(id),
  transaction_id VARCHAR(255) NOT NULL,
  transaction_data JSONB NOT NULL,
  cryptographic_proof JSONB NOT NULL,
  verification_status verification_status DEFAULT 'pending',
  amount_cents BIGINT,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT NOW(),

  -- Indexes for performance
  INDEX idx_receipts_enterprise_created (enterprise_id, created_at DESC),
  INDEX idx_receipts_api_key (api_key_id),
  INDEX idx_receipts_transaction_id (transaction_id)
);

CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID REFERENCES enterprises(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  receipts_generated INTEGER DEFAULT 0,
  overage_receipts INTEGER DEFAULT 0,
  overage_charges_cents BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(enterprise_id, period_start, period_end)
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  enterprise_id UUID REFERENCES enterprises(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_audit_logs_enterprise_created (enterprise_id, created_at DESC),
  INDEX idx_audit_logs_user_created (user_id, created_at DESC)
);

-- Enums
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'developer', 'viewer');
CREATE TYPE plan_tier AS ENUM ('starter', 'growth', 'business', 'enterprise');
CREATE TYPE key_status AS ENUM ('active', 'revoked', 'expired');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'failed');
```

## Dashboard Module Specifications

### 1. Overview Dashboard

**Purpose**: Executive summary and key metrics at a glance

**Key Components**:
```typescript
interface DashboardMetrics {
  // Usage metrics
  receiptsThisMonth: number;
  remainingQuota: number;
  quotaUtilization: number;

  // Performance metrics
  uptimePercentage: number;
  avgResponseTime: number;
  errorRate: number;

  // Financial metrics
  currentCosts: number;
  projectedCosts: number;
  savings: number;

  // Activity metrics
  totalReceipts: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'receipt_generated' | 'api_key_created' | 'user_invited';
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

**Visual Elements**:
- Real-time usage gauge with quota visualization
- Performance metrics cards with trend indicators
- Interactive cost breakdown chart
- Live activity feed with filtering
- Quick action buttons (Generate Test Receipt, View Documentation)

### 2. API Management Module

**Purpose**: Complete API key lifecycle management

**Core Interface**:
```typescript
interface APIKey {
  id: string;
  name: string;
  keyPreview: string;          // "ck_live_abc123..."
  permissions: Permission[];
  rateLimit: number;
  rateLimitWindow: string;     // "1h", "1d", "1m"
  lastUsed: Date | null;
  usageCount: number;
  created: Date;
  expiresAt: Date | null;
  status: 'active' | 'revoked' | 'expired';
  ipRestrictions: string[];
}

interface Permission {
  resource: 'receipts' | 'analytics' | 'team';
  actions: ('read' | 'write' | 'delete')[];
}
```

**Features**:
- Create API keys with custom permissions and rate limits
- Rotate keys with zero-downtime transition
- Usage analytics per key with detailed metrics
- Security controls (IP restrictions, expiration)
- Integration testing interface

### 3. Receipt Explorer

**Purpose**: Advanced receipt management and analysis

**Query Interface**:
```typescript
interface ReceiptQuery {
  dateRange: DateRange;
  amountRange: AmountRange;
  status: VerificationStatus[];
  transactionTypes: string[];
  searchTerm: string;
  sortBy: 'created_at' | 'amount' | 'verification_status';
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}

interface ReceiptDetail {
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
```

**Advanced Features**:
- Full-text search across receipt metadata
- Bulk operations (export, re-verify, archive)
- Cryptographic proof validation
- Receipt comparison and diff tools
- Export formats (CSV, JSON, PDF reports)

### 4. Analytics & Reporting

**Purpose**: Business intelligence and compliance reporting

**Analytics Engine**:
```typescript
interface AnalyticsData {
  // Time series data
  receiptsOverTime: TimeSeriesPoint[];
  costsOverTime: TimeSeriesPoint[];
  errorRatesOverTime: TimeSeriesPoint[];

  // Categorical analysis
  topTransactionTypes: CategoryMetric[];
  geographicDistribution: GeoMetric[];
  apiKeyUsage: UsageMetric[];

  // Compliance metrics
  uptimeMetrics: UptimeData;
  verificationSuccessRate: number;
  averageProcessingTime: number;

  // Forecasting
  projectedUsage: ForecastData;
  recommendedPlan: PlanRecommendation;
}

interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}
```

**Report Types**:
- SOX compliance reports
- SOC 2 audit trails
- Cost analysis and optimization
- Usage forecasting and capacity planning
- Custom report builder with scheduling

### 5. Billing & Subscription Management

**Purpose**: Complete subscription lifecycle management

**Billing Interface**:
```typescript
interface SubscriptionData {
  // Current plan
  currentPlan: {
    tier: PlanTier;
    receiptsIncluded: number;
    overageRate: number;
    billingCycle: 'monthly' | 'yearly';
  };

  // Usage tracking
  currentUsage: {
    receiptsUsed: number;
    overageReceipts: number;
    currentCosts: number;
    projectedCosts: number;
  };

  // Billing history
  invoices: Invoice[];
  paymentMethods: PaymentMethod[];

  // Plan management
  availableUpgrades: PlanOption[];
  downgradeLimitations: string[];
}
```

**Features**:
- Real-time usage monitoring with overage alerts
- Self-service plan upgrades/downgrades
- Invoice management with PDF downloads
- Payment method updates via Stripe
- Enterprise contract management
- Usage-based billing reconciliation

### 6. Team Management

**Purpose**: Multi-user collaboration and access control

**Team Structure**:
```typescript
interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: TeamRole;
  permissions: Permission[];
  lastActive: Date;
  mfaEnabled: boolean;
  ssoEnabled: boolean;
  status: 'active' | 'pending' | 'suspended';
  invitedBy: string;
  joinedAt: Date;
}

type TeamRole = 'owner' | 'admin' | 'developer' | 'viewer' | 'billing';

interface TeamSettings {
  requireMFA: boolean;
  allowedDomains: string[];
  ssoEnabled: boolean;
  sessionTimeout: number;
  ipAllowlist: string[];
}
```

**Advanced Features**:
- Role-based access control with custom permissions
- SSO integration (SAML, OIDC)
- Bulk user management and CSV import
- Team activity monitoring
- Automated onboarding workflows

### 7. Security & Compliance

**Purpose**: Enterprise security and audit capabilities

**Security Dashboard**:
```typescript
interface SecurityMetrics {
  // Authentication metrics
  failedLogins: number;
  suspiciousActivity: SecurityEvent[];
  mfaAdoptionRate: number;

  // API security
  apiAbuseAttempts: number;
  rateLimitViolations: RateLimitEvent[];
  unauthorizedAccess: UnauthorizedEvent[];

  // Compliance status
  auditReadiness: ComplianceScore;
  dataRetentionCompliance: boolean;
  encryptionStatus: EncryptionMetrics;
}

interface SecurityEvent {
  id: string;
  type: 'failed_login' | 'api_abuse' | 'unusual_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  resolved: boolean;
}
```

**Compliance Features**:
- Real-time security monitoring
- Automated threat detection
- Audit log analysis and reporting
- Data retention policy management
- Incident response workflows

### 8. Developer Tools

**Purpose**: Developer experience and integration support

**Developer Portal**:
```typescript
interface DeveloperTools {
  // Documentation
  apiDocs: OpenAPISpec;
  sdks: SDKDownload[];
  codeExamples: CodeExample[];

  // Testing tools
  apiPlayground: PlaygroundConfig;
  webhookTester: WebhookConfig;
  receiptValidator: ValidatorTool;

  // Integration guides
  platforms: IntegrationGuide[];
  tutorials: Tutorial[];
  bestPractices: BestPractice[];
}
```

**Interactive Features**:
- Live API documentation with try-it functionality
- Code generation for multiple languages
- Webhook testing and debugging
- Integration status monitoring
- Performance optimization recommendations

## Advanced Features

### Real-time Updates Architecture

**WebSocket Implementation**:
```typescript
// Real-time event types
type RealtimeEvent =
  | { type: 'receipt_generated'; data: Receipt }
  | { type: 'usage_updated'; data: UsageMetrics }
  | { type: 'security_alert'; data: SecurityEvent }
  | { type: 'team_activity'; data: TeamActivity };

// WebSocket connection management
class RealtimeManager {
  private connections = new Map<string, WebSocket>();

  subscribe(userId: string, events: string[]): void;
  unsubscribe(userId: string): void;
  broadcast(enterpriseId: string, event: RealtimeEvent): void;
}
```

### Progressive Web App (PWA)

**Mobile-First Features**:
- Offline data access for viewing receipts
- Push notifications for critical alerts
- App-like experience on mobile devices
- Touch-optimized interface design
- Background sync for data updates

### Enterprise Customization

**White-Label Options**:
```typescript
interface BrandingConfig {
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain: string;
  favicon: string;
  customCSS?: string;
}

interface EnterpriseFeatures {
  customBranding: BrandingConfig;
  ssoConfig: SSOConfiguration;
  dataResidency: 'us' | 'eu' | 'asia';
  dedicatedSupport: boolean;
  customSLA: SLATerms;
}
```

## Performance & Scalability

### Caching Strategy

**Multi-Layer Caching**:
```typescript
// Cache hierarchy
interface CacheStrategy {
  // Level 1: Browser cache (static assets)
  staticAssets: CDNCache;

  // Level 2: Redis cache (API responses)
  apiCache: RedisCache;

  // Level 3: Database query cache
  queryCache: PostgreSQLCache;

  // Level 4: Computed metrics cache
  analyticsCache: ComputedCache;
}
```

### Database Optimization

**Performance Features**:
- Read replicas for analytics queries
- Partitioning for large tables (receipts, audit_logs)
- Optimized indexes for common query patterns
- Automated query performance monitoring
- Data archiving for compliance retention

### Monitoring & Observability

**Comprehensive Monitoring**:
```typescript
interface MonitoringStack {
  // Application performance
  apm: NewRelicConfig | DatadogConfig;

  // Error tracking
  errorTracking: SentryConfig;

  // Uptime monitoring
  uptimeMonitoring: PingdomConfig;

  // User analytics
  userAnalytics: MixpanelConfig;

  // Infrastructure monitoring
  infrastructure: PrometheusConfig;
}
```

## Implementation Roadmap

### Phase 1: MVP Foundation (2-3 weeks)
**Core Features**:
- [ ] Basic authentication (email/password)
- [ ] Simple dashboard with usage metrics
- [ ] API key creation and management
- [ ] Receipt listing with basic filtering
- [ ] Stripe billing integration

**Technical Setup**:
- [ ] Next.js 14 project initialization
- [ ] Database schema implementation
- [ ] Basic UI component library
- [ ] Authentication system setup
- [ ] Deployment pipeline configuration

### Phase 2: Core Platform (4-6 weeks)
**Enhanced Features**:
- [ ] Advanced analytics dashboard
- [ ] Team management system
- [ ] Security and audit logging
- [ ] Real-time updates via WebSocket
- [ ] Mobile-responsive design

**Enterprise Readiness**:
- [ ] SSO integration (Google, Microsoft)
- [ ] Role-based access control
- [ ] API rate limiting and monitoring
- [ ] Comprehensive error handling
- [ ] Performance optimization

### Phase 3: Enterprise Features (6-8 weeks)
**Advanced Capabilities**:
- [ ] SAML SSO integration
- [ ] Custom branding and white-labeling
- [ ] Advanced compliance reporting
- [ ] Multi-region deployment
- [ ] Dedicated support portal

**Developer Experience**:
- [ ] Interactive API documentation
- [ ] SDK development and distribution
- [ ] Webhook management system
- [ ] Integration marketplace
- [ ] Developer community features

## Quality Assurance Standards

### Code Quality
- **TypeScript**: 100% type coverage
- **Testing**: Unit tests (>90% coverage), Integration tests, E2E tests
- **Linting**: ESLint with strict rules, Prettier formatting
- **Security**: OWASP compliance, Regular security audits

### Performance Standards
- **Load Time**: <2s initial page load
- **API Response**: <200ms average response time
- **Uptime**: 99.9% SLA with monitoring
- **Scalability**: Support for 100k+ users per instance

### Security Standards
- **Authentication**: Multi-factor required for admin roles
- **Encryption**: End-to-end encryption for sensitive data
- **Compliance**: SOC 2 Type II, SOX readiness
- **Monitoring**: Real-time threat detection and response

## Success Metrics

### User Experience Metrics
- **Time to First Value**: <5 minutes from signup to first receipt
- **Feature Adoption**: >80% usage of core features within 30 days
- **Support Tickets**: <5% of users requiring support per month
- **User Satisfaction**: >4.5/5 NPS score

### Business Metrics
- **Conversion Rate**: >15% trial to paid conversion
- **Churn Rate**: <5% monthly churn rate
- **Expansion Revenue**: >30% of revenue from plan upgrades
- **API Usage Growth**: >20% month-over-month growth

### Technical Metrics
- **Uptime**: 99.9% availability
- **Performance**: <200ms API response times
- **Security**: Zero critical security incidents
- **Scalability**: Support 10x user growth without architecture changes

---

## Conclusion

This architecture represents a best-in-class B2B SaaS platform that delivers exceptional user experience while maintaining enterprise-grade security and compliance standards. The modular design allows for rapid development and iteration while ensuring long-term scalability and maintainability.

The implementation roadmap provides a clear path from MVP to enterprise-ready platform, with each phase delivering immediate value to customers while building toward the complete vision.

---

*Last Updated: September 27, 2025*
*Version: 1.0*
*Author: CertNode Development Team*