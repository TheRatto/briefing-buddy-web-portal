-- Migration: Create briefings and NOTAMs tables
-- Feature: F-010 Briefing history & storage

-- Briefings table
-- Stores briefing metadata for authenticated users
CREATE TABLE IF NOT EXISTS briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  pdf_file_id TEXT, -- UUID-based filename for PDF storage (if applicable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- NOTAMs table
-- Stores parsed NOTAM data associated with briefings
CREATE TABLE IF NOT EXISTS notams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID NOT NULL REFERENCES briefings("id") ON DELETE CASCADE,
  notam_id TEXT NOT NULL, -- Original NOTAM identifier from text
  q_code TEXT,
  field_a TEXT,
  field_b TEXT,
  field_c TEXT,
  field_d TEXT,
  field_e TEXT,
  field_f TEXT,
  field_g TEXT,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  is_permanent BOOLEAN NOT NULL DEFAULT FALSE,
  raw_text TEXT NOT NULL,
  group_name TEXT NOT NULL, -- NotamGroup enum value
  warnings TEXT[], -- Array of warning messages
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS briefings_user_id_idx ON briefings(user_id);
CREATE INDEX IF NOT EXISTS briefings_created_at_idx ON briefings(created_at);
CREATE INDEX IF NOT EXISTS notams_briefing_id_idx ON notams(briefing_id);
CREATE INDEX IF NOT EXISTS notams_valid_from_idx ON notams(valid_from);
CREATE INDEX IF NOT EXISTS notams_valid_to_idx ON notams(valid_to);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on briefings
CREATE TRIGGER update_briefings_updated_at BEFORE UPDATE ON briefings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

