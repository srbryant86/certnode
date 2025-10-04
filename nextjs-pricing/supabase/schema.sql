-- CertNode Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/obasoslqkymvjyjbmlfv/sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- USERS TABLE (extends Clerk auth)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('creator', 'platform', 'enterprise', 'admin')) DEFAULT 'creator',
  tier TEXT NOT NULL CHECK (tier IN ('free', 'starter', 'growth', 'scale', 'platform', 'enterprise')) DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =============================================================================
-- CONTENT TABLE (uploaded photos/videos)
-- =============================================================================
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- File metadata
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL, -- image/jpeg, video/mp4, etc.
  file_size BIGINT NOT NULL, -- bytes
  storage_path TEXT NOT NULL, -- Supabase storage path

  -- Content hashing
  sha256_hash TEXT NOT NULL UNIQUE, -- SHA-256 of file content

  -- C2PA metadata (if available)
  c2pa_manifest JSONB, -- C2PA manifest data
  device_info JSONB, -- Camera/device metadata
  capture_time TIMESTAMPTZ, -- When content was captured

  -- Status
  status TEXT NOT NULL CHECK (status IN ('uploading', 'processing', 'certified', 'failed')) DEFAULT 'uploading',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_user_id ON content(user_id);
CREATE INDEX idx_content_sha256 ON content(sha256_hash);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_created_at ON content(created_at DESC);

-- =============================================================================
-- RECEIPTS TABLE (cryptographic receipts)
-- =============================================================================
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY, -- rcpt_xxxxx format
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Receipt type and data
  type TEXT NOT NULL CHECK (type IN ('transaction', 'content', 'operation', 'shipment', 'payment', 'delivery')),
  data JSONB NOT NULL, -- Receipt payload

  -- Cryptographic fields
  hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of receipt
  signature TEXT NOT NULL, -- ES256 signature
  public_key TEXT NOT NULL, -- Public key for verification

  -- Graph structure (DAG)
  parent_ids TEXT[] DEFAULT '{}', -- Array of parent receipt IDs
  depth INTEGER NOT NULL DEFAULT 0, -- Depth in the graph (root = 0)
  relation_type TEXT, -- fulfillment, verification, etc.

  -- Blockchain anchoring
  blockchain_tx_hash TEXT, -- Ethereum transaction hash
  blockchain_block_number BIGINT, -- Ethereum block number
  anchored_at TIMESTAMPTZ, -- When anchored to blockchain

  -- Content association (for content-type receipts)
  content_id UUID REFERENCES content(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_type ON receipts(type);
CREATE INDEX idx_receipts_hash ON receipts(hash);
CREATE INDEX idx_receipts_content_id ON receipts(content_id);
CREATE INDEX idx_receipts_parent_ids ON receipts USING GIN(parent_ids);
CREATE INDEX idx_receipts_created_at ON receipts(created_at DESC);
CREATE INDEX idx_receipts_blockchain_tx ON receipts(blockchain_tx_hash) WHERE blockchain_tx_hash IS NOT NULL;

-- =============================================================================
-- API KEYS TABLE (for platform authentication)
-- =============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- API key details
  name TEXT NOT NULL, -- User-friendly name
  key_prefix TEXT NOT NULL, -- First 8 chars (for display)
  key_hash TEXT NOT NULL UNIQUE, -- bcrypt hash of full key

  -- Permissions
  scopes TEXT[] NOT NULL DEFAULT ARRAY['verify:read'], -- Array of scopes

  -- Rate limiting
  rate_limit_per_hour INTEGER DEFAULT 1000,

  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  usage_count BIGINT DEFAULT 0,

  -- Status
  active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ, -- NULL = no expiration

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(active);

-- =============================================================================
-- WEBHOOKS TABLE (webhook configurations)
-- =============================================================================
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Webhook details
  url TEXT NOT NULL, -- Webhook endpoint URL
  events TEXT[] NOT NULL, -- Array of event types to subscribe to
  secret TEXT NOT NULL, -- HMAC secret for signing

  -- Status
  active BOOLEAN NOT NULL DEFAULT TRUE,
  failed_deliveries_count INTEGER DEFAULT 0, -- Auto-disable after X failures

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX idx_webhooks_active ON webhooks(active);

-- =============================================================================
-- WEBHOOK DELIVERIES TABLE (webhook delivery logs)
-- =============================================================================
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,

  -- Delivery details
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,

  -- Response
  status_code INTEGER,
  response_body TEXT,
  error TEXT,

  -- Retry tracking
  attempt INTEGER NOT NULL DEFAULT 1,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMPTZ,

  -- Status
  delivered BOOLEAN NOT NULL DEFAULT FALSE,
  delivered_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at DESC);
CREATE INDEX idx_webhook_deliveries_delivered ON webhook_deliveries(delivered);
CREATE INDEX idx_webhook_deliveries_next_retry ON webhook_deliveries(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- =============================================================================
-- RECEIPT GRAPH VIEWS (for easy querying)
-- =============================================================================

-- View to get receipt with all parent receipts (recursive)
CREATE OR REPLACE VIEW receipt_chain AS
WITH RECURSIVE chain AS (
  -- Base case: all receipts
  SELECT
    id,
    user_id,
    type,
    hash,
    parent_ids,
    depth,
    ARRAY[id] AS path
  FROM receipts

  UNION ALL

  -- Recursive case: add parents
  SELECT
    r.id,
    r.user_id,
    r.type,
    r.hash,
    r.parent_ids,
    r.depth,
    c.path || r.id
  FROM receipts r
  INNER JOIN chain c ON r.id = ANY(c.parent_ids)
  WHERE NOT r.id = ANY(c.path) -- Prevent cycles
)
SELECT * FROM chain;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid()::TEXT = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid()::TEXT = id);

-- Content table policies
CREATE POLICY "Users can view their own content"
  ON content FOR SELECT
  USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can insert their own content"
  ON content FOR INSERT
  WITH CHECK (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can update their own content"
  ON content FOR UPDATE
  USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can delete their own content"
  ON content FOR DELETE
  USING (user_id = auth.uid()::TEXT);

-- Receipts table policies
CREATE POLICY "Users can view their own receipts"
  ON receipts FOR SELECT
  USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can insert their own receipts"
  ON receipts FOR INSERT
  WITH CHECK (user_id = auth.uid()::TEXT);

-- Receipts are immutable after creation (no UPDATE/DELETE)

-- API Keys table policies
CREATE POLICY "Users can view their own API keys"
  ON api_keys FOR SELECT
  USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can create their own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can update their own API keys"
  ON api_keys FOR UPDATE
  USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can delete their own API keys"
  ON api_keys FOR DELETE
  USING (user_id = auth.uid()::TEXT);

-- Webhooks table policies
CREATE POLICY "Users can view their own webhooks"
  ON webhooks FOR SELECT
  USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can create their own webhooks"
  ON webhooks FOR INSERT
  WITH CHECK (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can update their own webhooks"
  ON webhooks FOR UPDATE
  USING (user_id = auth.uid()::TEXT);

CREATE POLICY "Users can delete their own webhooks"
  ON webhooks FOR DELETE
  USING (user_id = auth.uid()::TEXT);

-- Webhook deliveries policies
CREATE POLICY "Users can view their webhook deliveries"
  ON webhook_deliveries FOR SELECT
  USING (webhook_id IN (SELECT id FROM webhooks WHERE user_id = auth.uid()::TEXT));

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at BEFORE UPDATE ON receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STORAGE BUCKETS (run this separately in Storage section)
-- =============================================================================

-- Create storage bucket for content uploads
-- Go to Storage > Create bucket > Name: "content-uploads"
-- Make it private (RLS will handle access)

-- Storage RLS policy (add via Storage > Policies)
--
-- Policy name: Users can upload their own content
-- Allowed operations: INSERT
-- Policy definition:
-- bucket_id = 'content-uploads' AND (storage.foldername(name))[1] = auth.uid()::TEXT
--
-- Policy name: Users can view their own content
-- Allowed operations: SELECT
-- Policy definition:
-- bucket_id = 'content-uploads' AND (storage.foldername(name))[1] = auth.uid()::TEXT
--
-- Policy name: Users can delete their own content
-- Allowed operations: DELETE
-- Policy definition:
-- bucket_id = 'content-uploads' AND (storage.foldername(name))[1] = auth.uid()::TEXT
