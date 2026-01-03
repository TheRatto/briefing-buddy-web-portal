-- Migration: Create share_links table
-- Feature: F-012 Export & sharing

-- Share links table
-- Stores private, expiring share links for briefings
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID NOT NULL REFERENCES briefings("id") ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE, -- Cryptographically secure, non-guessable token (base64url encoded)
  expires_at TIMESTAMPTZ NOT NULL, -- Expiration timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS share_links_token_idx ON share_links(token);
CREATE INDEX IF NOT EXISTS share_links_briefing_id_idx ON share_links(briefing_id);
CREATE INDEX IF NOT EXISTS share_links_expires_at_idx ON share_links(expires_at);

-- Function to automatically delete expired share links
-- This can be called by cleanup jobs or run periodically
CREATE OR REPLACE FUNCTION delete_expired_share_links()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM share_links
  WHERE expires_at < CURRENT_TIMESTAMP
  RETURNING id INTO deleted_count;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

