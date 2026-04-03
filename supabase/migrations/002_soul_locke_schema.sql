-- Soul-Locke Tracker: full schema
-- Run this in the Supabase SQL editor (or as a migration).
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE.

-- ── runs ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.runs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_code   VARCHAR(8) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── pokemon ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pokemon (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id       UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  player_number INT NOT NULL CHECK (player_number IN (1, 2)),
  name         VARCHAR(255) NOT NULL,
  species      VARCHAR(255) NOT NULL,
  primary_type VARCHAR(50)  NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── encounters ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.encounters (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id              UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  route_number        INT  NOT NULL,
  route_name          VARCHAR(255) NOT NULL,
  player1_pokemon_id  UUID REFERENCES public.pokemon(id) ON DELETE SET NULL,
  player2_pokemon_id  UUID REFERENCES public.pokemon(id) ON DELETE SET NULL,
  status              VARCHAR(50) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'boxed', 'fainted')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (run_id, route_number)
);

-- ── boss_battles ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.boss_battles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id     UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  boss_name  VARCHAR(255) NOT NULL,
  defeated   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── boss_team_draft ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.boss_team_draft (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id              UUID NOT NULL REFERENCES public.runs(id) ON DELETE CASCADE,
  player1_pokemon_id  UUID REFERENCES public.pokemon(id) ON DELETE CASCADE,
  player2_pokemon_id  UUID REFERENCES public.pokemon(id) ON DELETE CASCADE,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pokemon_run_id
  ON public.pokemon (run_id);

CREATE INDEX IF NOT EXISTS idx_encounters_run_id
  ON public.encounters (run_id);

CREATE INDEX IF NOT EXISTS idx_encounters_run_route
  ON public.encounters (run_id, route_number);

CREATE INDEX IF NOT EXISTS idx_boss_battles_run_id
  ON public.boss_battles (run_id);

CREATE INDEX IF NOT EXISTS idx_boss_team_draft_run_id
  ON public.boss_team_draft (run_id);

-- ── Row-Level Security (recommended for shared runs) ──────────────────────────
-- Enable RLS but allow all operations via anon key for now.
-- Tighten these policies if you add auth later.

ALTER TABLE public.runs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pokemon         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounters      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boss_battles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boss_team_draft ENABLE ROW LEVEL SECURITY;

-- Drop first so this script is safe to re-run
DROP POLICY IF EXISTS allow_all_anon ON public.runs;
DROP POLICY IF EXISTS allow_all_anon ON public.pokemon;
DROP POLICY IF EXISTS allow_all_anon ON public.encounters;
DROP POLICY IF EXISTS allow_all_anon ON public.boss_battles;
DROP POLICY IF EXISTS allow_all_anon ON public.boss_team_draft;

-- Allow the anon role full access (shared run-code model, no auth yet)
CREATE POLICY allow_all_anon ON public.runs
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY allow_all_anon ON public.pokemon
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY allow_all_anon ON public.encounters
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY allow_all_anon ON public.boss_battles
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY allow_all_anon ON public.boss_team_draft
  FOR ALL TO anon USING (true) WITH CHECK (true);
