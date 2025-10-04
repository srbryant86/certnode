-- Fix: Allow multiple users to upload same file (same hash)
-- But prevent same user from uploading same file twice

-- Drop the old unique constraint on sha256_hash
ALTER TABLE content DROP CONSTRAINT IF EXISTS content_sha256_hash_key;

-- Add composite unique constraint on (user_id, sha256_hash)
ALTER TABLE content ADD CONSTRAINT content_user_sha256_unique UNIQUE (user_id, sha256_hash);

-- This allows:
-- ✅ User A uploads photo.jpg (hash: abc123)
-- ✅ User B uploads same photo.jpg (hash: abc123) - Different user, allowed
-- ❌ User A tries to upload photo.jpg again - Same user + same hash, blocked
