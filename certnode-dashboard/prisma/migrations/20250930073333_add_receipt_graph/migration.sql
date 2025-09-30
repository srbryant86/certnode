-- CreateTable
CREATE TABLE "receipt_relationships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parent_receipt_id" TEXT NOT NULL,
    "child_receipt_id" TEXT NOT NULL,
    "relation_type" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "receipt_relationships_parent_receipt_id_fkey" FOREIGN KEY ("parent_receipt_id") REFERENCES "receipts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "receipt_relationships_child_receipt_id_fkey" FOREIGN KEY ("child_receipt_id") REFERENCES "receipts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_receipts" (
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
    "graph_depth" INTEGER NOT NULL DEFAULT 0,
    "graph_hash" TEXT,
    "api_key_id" TEXT,
    CONSTRAINT "receipts_enterprise_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "receipts_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_receipts" ("api_key_id", "claims", "content_ai_scores", "content_hash", "content_metadata", "content_provenance", "content_type", "created_at", "cryptographic_proof", "currency", "enterprise_id", "id", "subject", "subtype", "transaction_data", "transaction_id", "type", "verification_status", "version") SELECT "api_key_id", "claims", "content_ai_scores", "content_hash", "content_metadata", "content_provenance", "content_type", "created_at", "cryptographic_proof", "currency", "enterprise_id", "id", "subject", "subtype", "transaction_data", "transaction_id", "type", "verification_status", "version" FROM "receipts";
DROP TABLE "receipts";
ALTER TABLE "new_receipts" RENAME TO "receipts";
CREATE INDEX "receipts_enterprise_id_type_idx" ON "receipts"("enterprise_id", "type");
CREATE INDEX "receipts_content_hash_idx" ON "receipts"("content_hash");
CREATE INDEX "receipts_type_subtype_idx" ON "receipts"("type", "subtype");
CREATE INDEX "receipts_api_key_id_idx" ON "receipts"("api_key_id");
CREATE INDEX "receipts_graph_depth_idx" ON "receipts"("graph_depth");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "receipt_relationships_parent_receipt_id_idx" ON "receipt_relationships"("parent_receipt_id");

-- CreateIndex
CREATE INDEX "receipt_relationships_child_receipt_id_idx" ON "receipt_relationships"("child_receipt_id");

-- CreateIndex
CREATE INDEX "receipt_relationships_relation_type_idx" ON "receipt_relationships"("relation_type");

-- CreateIndex
CREATE UNIQUE INDEX "receipt_relationships_parent_receipt_id_child_receipt_id_key" ON "receipt_relationships"("parent_receipt_id", "child_receipt_id");
