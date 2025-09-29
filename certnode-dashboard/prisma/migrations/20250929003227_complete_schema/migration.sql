-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterprise_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "transaction_data" JSONB NOT NULL,
    "cryptographic_proof" JSONB NOT NULL,
    "verification_status" TEXT NOT NULL DEFAULT 'verified',
    "type" TEXT NOT NULL DEFAULT 'transaction',
    "content_hash" TEXT,
    "content_type" TEXT,
    "content_metadata" JSONB,
    "content_provenance" JSONB,
    "content_ai_scores" JSONB,
    "subtype" TEXT,
    "subject" TEXT,
    "claims" JSONB,
    "version" TEXT DEFAULT '1.0',
    "currency" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "api_key_id" TEXT,
    CONSTRAINT "receipts_enterprise_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "receipts_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "enterprises" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "billing_tier" TEXT NOT NULL DEFAULT 'free',
    "settings" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "key_preview" TEXT NOT NULL,
    "enterprise_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "rate_limit" INTEGER NOT NULL DEFAULT 1000,
    "rate_limit_window" TEXT NOT NULL DEFAULT '1h',
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "ip_restrictions" TEXT NOT NULL DEFAULT '[]',
    "last_used" DATETIME,
    "expires_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "api_keys_enterprise_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "api_keys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "enterprise_id" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_enterprise_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterprise_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "details" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_enterprise_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "receipts_enterprise_id_type_idx" ON "receipts"("enterprise_id", "type");

-- CreateIndex
CREATE INDEX "receipts_content_hash_idx" ON "receipts"("content_hash");

-- CreateIndex
CREATE INDEX "receipts_type_subtype_idx" ON "receipts"("type", "subtype");

-- CreateIndex
CREATE INDEX "receipts_api_key_id_idx" ON "receipts"("api_key_id");

-- CreateIndex
CREATE INDEX "api_keys_enterprise_id_idx" ON "api_keys"("enterprise_id");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_enterprise_id_idx" ON "users"("enterprise_id");

-- CreateIndex
CREATE INDEX "audit_logs_enterprise_id_idx" ON "audit_logs"("enterprise_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");
