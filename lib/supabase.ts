import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── DB row types (snake_case, as Supabase returns them) ─────────────────────

export interface RunRow {
  id: string;
  run_code: string;
  created_at: string;
  updated_at: string;
}

export interface PokemonRow {
  id: string;
  run_id: string;
  player_number: 1 | 2;
  name: string;
  species: string;
  primary_type: string;
  created_at: string;
}

export interface EncounterRow {
  id: string;
  run_id: string;
  route_number: number;
  route_name: string;
  player1_pokemon_id: string | null;
  player2_pokemon_id: string | null;
  status: 'active' | 'boxed' | 'fainted';
  created_at: string;
  updated_at: string;
}

export interface BossBattleRow {
  id: string;
  run_id: string;
  boss_name: string;
  defeated: boolean;
  created_at: string;
  updated_at: string;
}

export interface BossDraftRow {
  id: string;
  run_id: string;
  player1_pokemon_id: string | null;
  player2_pokemon_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
