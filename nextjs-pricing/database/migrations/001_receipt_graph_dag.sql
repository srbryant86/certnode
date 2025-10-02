-- Migration: Receipt Graph DAG Implementation
-- Description: Adds graph relationships, trust scoring, and analytics to receipts
-- Cost: $0 (uses existing PostgreSQL database)

-- 1. Update receipts table with graph fields
ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS graph_hash TEXT,
  ADD COLUMN IF NOT EXISTS graph_depth INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trust_score DECIMAL(3,2),
  ADD COLUMN IF NOT EXISTS trust_level TEXT CHECK (trust_level IN ('BASIC', 'VERIFIED', 'PLATINUM'));

-- 2. Create receipt_relationships table for DAG structure
CREATE TABLE IF NOT EXISTS receipt_relationships (
  id SERIAL PRIMARY KEY,
  parent_receipt_id TEXT NOT NULL,
  child_receipt_id TEXT NOT NULL,
  relation_type TEXT NOT NULL CHECK (
    relation_type IN ('causes', 'evidences', 'fulfills', 'invalidates', 'amends', 'references')
  ),
  description TEXT,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT fk_parent_receipt
    FOREIGN KEY (parent_receipt_id)
    REFERENCES receipts(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_child_receipt
    FOREIGN KEY (child_receipt_id)
    REFERENCES receipts(id)
    ON DELETE CASCADE,

  -- Prevent duplicate relationships
  UNIQUE(parent_receipt_id, child_receipt_id, relation_type)
);

-- 3. Create indexes for graph queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_relationships_parent
  ON receipt_relationships(parent_receipt_id);

CREATE INDEX IF NOT EXISTS idx_relationships_child
  ON receipt_relationships(child_receipt_id);

CREATE INDEX IF NOT EXISTS idx_relationships_type
  ON receipt_relationships(relation_type);

CREATE INDEX IF NOT EXISTS idx_relationships_created_at
  ON receipt_relationships(created_at);

CREATE INDEX IF NOT EXISTS idx_receipts_trust_level
  ON receipts(trust_level);

CREATE INDEX IF NOT EXISTS idx_receipts_graph_depth
  ON receipts(graph_depth);

CREATE INDEX IF NOT EXISTS idx_receipts_type
  ON receipts(type);

-- 4. Create graph analytics materialized view (for fast dashboard queries)
CREATE MATERIALIZED VIEW IF NOT EXISTS receipt_graph_analytics AS
SELECT
  COUNT(*) as total_receipts,
  COUNT(DISTINCT CASE WHEN type = 'transaction' THEN id END) as transaction_count,
  COUNT(DISTINCT CASE WHEN type = 'content' THEN id END) as content_count,
  COUNT(DISTINCT CASE WHEN type = 'operations' THEN id END) as operations_count,

  AVG(graph_depth) as avg_graph_depth,
  MAX(graph_depth) as max_graph_depth,

  AVG(trust_score) as avg_trust_score,
  COUNT(CASE WHEN trust_level = 'BASIC' THEN 1 END) as basic_trust_count,
  COUNT(CASE WHEN trust_level = 'VERIFIED' THEN 1 END) as verified_trust_count,
  COUNT(CASE WHEN trust_level = 'PLATINUM' THEN 1 END) as platinum_trust_count,

  COUNT(CASE WHEN graph_depth = 0 THEN 1 END) as orphaned_receipts,

  (SELECT COUNT(*) FROM receipt_relationships) as total_relationships,
  (SELECT COUNT(DISTINCT parent_receipt_id) FROM receipt_relationships) as receipts_with_children,
  (SELECT COUNT(DISTINCT child_receipt_id) FROM receipt_relationships) as receipts_with_parents
FROM receipts;

-- 5. Create function to refresh analytics (call after bulk operations)
CREATE OR REPLACE FUNCTION refresh_graph_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW receipt_graph_analytics;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to update graph_depth when relationships change
CREATE OR REPLACE FUNCTION update_graph_depth()
RETURNS TRIGGER AS $$
DECLARE
  max_parent_depth INTEGER;
BEGIN
  -- Calculate max depth of parent receipts
  SELECT COALESCE(MAX(r.graph_depth), -1) INTO max_parent_depth
  FROM receipt_relationships rel
  JOIN receipts r ON r.id = rel.parent_receipt_id
  WHERE rel.child_receipt_id = NEW.child_receipt_id;

  -- Update child receipt's graph_depth
  UPDATE receipts
  SET graph_depth = max_parent_depth + 1
  WHERE id = NEW.child_receipt_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_graph_depth
  AFTER INSERT ON receipt_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_graph_depth();

-- 7. Create function to calculate trust score
CREATE OR REPLACE FUNCTION calculate_trust_score(receipt_id TEXT)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  base_score DECIMAL(3,2) := 0.60;
  receipt_type TEXT;
  linked_domains TEXT[];
  receipt_graph_depth INTEGER;
  parent_count INTEGER;
BEGIN
  -- Get receipt info
  SELECT type, graph_depth INTO receipt_type, receipt_graph_depth
  FROM receipts
  WHERE id = receipt_id;

  -- Get linked domains from parent receipts
  SELECT ARRAY_AGG(DISTINCT r.type) INTO linked_domains
  FROM receipt_relationships rel
  JOIN receipts r ON r.id = rel.parent_receipt_id
  WHERE rel.child_receipt_id = receipt_id;

  -- Add points for domain coverage
  IF 'content' = ANY(linked_domains) THEN
    base_score := base_score + 0.20;
  END IF;

  IF 'operations' = ANY(linked_domains) THEN
    base_score := base_score + 0.15;
  END IF;

  -- Bonus for graph depth
  IF receipt_graph_depth >= 3 THEN
    base_score := base_score + 0.05;
  END IF;

  -- Bonus for having provenance
  SELECT COUNT(*) INTO parent_count
  FROM receipt_relationships
  WHERE child_receipt_id = receipt_id;

  IF parent_count > 0 THEN
    base_score := base_score + 0.05;
  END IF;

  -- Cap at 1.0
  RETURN LEAST(base_score, 1.0);
END;
$$ LANGUAGE plpgsql;

-- 8. Create function to get trust level from score
CREATE OR REPLACE FUNCTION get_trust_level(score DECIMAL(3,2))
RETURNS TEXT AS $$
BEGIN
  IF score >= 0.95 THEN
    RETURN 'PLATINUM';
  ELSIF score >= 0.85 THEN
    RETURN 'VERIFIED';
  ELSE
    RETURN 'BASIC';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Add comments for documentation
COMMENT ON TABLE receipt_relationships IS 'DAG structure connecting receipts across domains';
COMMENT ON COLUMN receipt_relationships.relation_type IS 'Semantic relationship: causes, evidences, fulfills, invalidates, amends, references';
COMMENT ON COLUMN receipts.graph_hash IS 'Hash of all parent receipt hashes (tamper-evident)';
COMMENT ON COLUMN receipts.graph_depth IS 'How deep in the graph (0 = orphaned, 1+ = connected)';
COMMENT ON COLUMN receipts.trust_score IS 'Calculated trust score 0.0-1.0 based on graph coverage';
COMMENT ON COLUMN receipts.trust_level IS 'BASIC (60%), VERIFIED (85%), PLATINUM (95%)';
