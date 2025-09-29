-- CreateTable
CREATE TABLE "validation_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "request_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "enterprise_id" TEXT,
    "results" JSONB NOT NULL,
    "processing_time" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "critical_failures" INTEGER NOT NULL,
    "high_failures" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "validation_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_by" TEXT,
    "acknowledged_at" DATETIME,
    "resolved_at" DATETIME
);

-- CreateIndex
CREATE INDEX "validation_records_timestamp_idx" ON "validation_records"("timestamp");

-- CreateIndex
CREATE INDEX "validation_records_enterprise_id_idx" ON "validation_records"("enterprise_id");

-- CreateIndex
CREATE INDEX "validation_records_endpoint_idx" ON "validation_records"("endpoint");

-- CreateIndex
CREATE INDEX "validation_records_success_idx" ON "validation_records"("success");

-- CreateIndex
CREATE INDEX "validation_alerts_timestamp_idx" ON "validation_alerts"("timestamp");

-- CreateIndex
CREATE INDEX "validation_alerts_acknowledged_idx" ON "validation_alerts"("acknowledged");

-- CreateIndex
CREATE INDEX "validation_alerts_type_idx" ON "validation_alerts"("type");

-- CreateIndex
CREATE INDEX "validation_alerts_severity_idx" ON "validation_alerts"("severity");
