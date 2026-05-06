ALTER TABLE bets
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ALTER COLUMN status TYPE TEXT;

-- allow 'rejected' as a valid status value (no enum constraint to update)
