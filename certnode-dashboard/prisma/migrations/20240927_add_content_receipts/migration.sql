-- Add content receipt support
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'receipt_type') THEN
    CREATE TYPE "public"."receipt_type" AS ENUM ('transaction', 'content');
  END IF;
END $$;

ALTER TABLE "public"."receipts"
  ADD COLUMN IF NOT EXISTS "type" "public"."receipt_type" NOT NULL DEFAULT 'transaction',
  ADD COLUMN IF NOT EXISTS "content_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "content_type" TEXT,
  ADD COLUMN IF NOT EXISTS "content_metadata" JSONB,
  ADD COLUMN IF NOT EXISTS "content_provenance" JSONB,
  ADD COLUMN IF NOT EXISTS "content_ai_scores" JSONB;

CREATE INDEX IF NOT EXISTS "idx_receipts_type" ON "public"."receipts"("type");
CREATE INDEX IF NOT EXISTS "idx_receipts_content_hash" ON "public"."receipts"("content_hash");
