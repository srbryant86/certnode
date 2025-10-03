-- CreateTable
CREATE TABLE "integration_event_ledger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterprise_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_event" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "receipt_refs" JSONB,
    "error" TEXT,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "integration_event_ledger_enterprise_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "integration_event_index" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enterprise_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "receipt_id" TEXT NOT NULL,
    "last_event_id" TEXT NOT NULL,
    "last_seen_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "integration_event_index_enterprise_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "integration_event_index_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "integration_event_ledger_enterprise_id_provider_idx" ON "integration_event_ledger"("enterprise_id", "provider");

-- CreateIndex
CREATE INDEX "integration_event_ledger_provider_external_id_idx" ON "integration_event_ledger"("provider", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "integration_event_ledger_enterprise_id_provider_external_id_checksum_key" ON "integration_event_ledger"("enterprise_id", "provider", "external_id", "checksum");

-- CreateIndex
CREATE UNIQUE INDEX "integration_event_index_enterprise_id_provider_external_id_key" ON "integration_event_index"("enterprise_id", "provider", "external_id");

-- CreateIndex
CREATE INDEX "integration_event_index_receipt_id_idx" ON "integration_event_index"("receipt_id");
