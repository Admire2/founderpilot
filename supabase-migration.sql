-- Create KaraVerse Players table
CREATE TABLE IF NOT EXISTS karaverse_players (
  id TEXT PRIMARY KEY,
  x FLOAT DEFAULT 0,
  y FLOAT DEFAULT 0.5,
  z FLOAT DEFAULT 0,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#00ff00',
  email TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE karaverse_players;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_karaverse_players_last_seen 
ON karaverse_players(last_seen);

-- Auto-update last_seen
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER karaverse_players_last_seen
BEFORE UPDATE ON karaverse_players
FOR EACH ROW
EXECUTE FUNCTION update_last_seen();
