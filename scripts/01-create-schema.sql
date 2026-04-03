-- Create runs table
CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_code VARCHAR(8) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pokemon table
CREATE TABLE IF NOT EXISTS pokemon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  player_number INT NOT NULL CHECK (player_number IN (1, 2)),
  name VARCHAR(255) NOT NULL,
  species VARCHAR(255) NOT NULL,
  primary_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(run_id, player_number, name, species)
);

-- Create encounters table
CREATE TABLE IF NOT EXISTS encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  route_number INT NOT NULL,
  route_name VARCHAR(255) NOT NULL,
  player1_pokemon_id UUID REFERENCES pokemon(id) ON DELETE SET NULL,
  player2_pokemon_id UUID REFERENCES pokemon(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'boxed', 'fainted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(run_id, route_number)
);

-- Create boss_battles table
CREATE TABLE IF NOT EXISTS boss_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  boss_name VARCHAR(255) NOT NULL,
  defeated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create boss_team_draft table
CREATE TABLE IF NOT EXISTS boss_team_draft (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  player1_pokemon_id UUID REFERENCES pokemon(id) ON DELETE CASCADE,
  player2_pokemon_id UUID REFERENCES pokemon(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_encounters_run_id ON encounters(run_id);
CREATE INDEX IF NOT EXISTS idx_encounters_route_number ON encounters(run_id, route_number);
CREATE INDEX IF NOT EXISTS idx_pokemon_run_id ON pokemon(run_id);
CREATE INDEX IF NOT EXISTS idx_boss_battles_run_id ON boss_battles(run_id);
CREATE INDEX IF NOT EXISTS idx_boss_team_draft_run_id ON boss_team_draft(run_id);
