import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export interface Pokemon {
  id: string;
  runId: string;
  playerNumber: 1 | 2;
  name: string;
  species: string;
  primaryType: string;
  createdAt: string;
}

export interface Encounter {
  id: string;
  runId: string;
  routeNumber: number;
  routeName: string;
  player1PokemonId: string | null;
  player2PokemonId: string | null;
  status: 'active' | 'boxed' | 'fainted';
  createdAt: string;
  updatedAt: string;
}

export interface BossBattle {
  id: string;
  runId: string;
  bossName: string;
  defeated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BossTeamDraft {
  id: string;
  runId: string;
  player1PokemonId: string | null;
  player2PokemonId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TrackerState {
  runCode: string | null;
  runId: string | null;
  pokemon: Pokemon[];
  encounters: Encounter[];
  bossBattles: BossBattle[];
  bossDraft: BossTeamDraft[];
  loading: boolean;
  
  // Actions
  initializeRun: (code: string) => Promise<void>;
  addEncounter: (routeNumber: number, routeName: string) => Promise<void>;
  addPokemonToEncounter: (encounterId: string, playerNumber: 1 | 2, pokemon: Omit<Pokemon, 'id' | 'runId' | 'createdAt'>) => Promise<void>;
  updateEncounterStatus: (encounterId: string, status: 'active' | 'boxed' | 'fainted') => Promise<void>;
  addBossBattle: (bossName: string) => Promise<void>;
  toggleBossDefeated: (bossBattleId: string) => Promise<void>;
  addBossDraft: (player1Id: string | null, player2Id: string | null, notes?: string) => Promise<void>;
  removeBossDraft: (draftId: string) => Promise<void>;
  fetchRunData: (code: string) => Promise<void>;
}

export const useTrackerStore = create<TrackerState>((set, get) => ({
  runCode: null,
  runId: null,
  pokemon: [],
  encounters: [],
  bossBattles: [],
  bossDraft: [],
  loading: false,

  initializeRun: async (code: string) => {
    set({ loading: true });
    try {
      const supabase = createClient();
      // Check if run exists
      const { data: existingRun } = await supabase
        .from('runs')
        .select('id')
        .eq('run_code', code)
        .single()
        .catch(() => ({ data: null }));

      let runId: string;

      if (existingRun) {
        runId = existingRun.id;
      } else {
        // Create new run
        const { data: newRun, error } = await supabase
          .from('runs')
          .insert({ run_code: code })
          .select('id')
          .single();

        if (error) throw error;
        runId = newRun.id;
      }

      set({ runCode: code, runId });
      await get().fetchRunData(code);
    } catch (error) {
      console.error('Error initializing run:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchRunData: async (code: string) => {
    try {
      const supabase = createClient();
      const { data: run } = await supabase
        .from('runs')
        .select('id')
        .eq('run_code', code)
        .single();

      if (!run) return;

      const runId = run.id;

      const [{ data: pokemon }, { data: encounters }, { data: bossBattles }, { data: bossDraft }] = await Promise.all([
        supabase.from('pokemon').select('*').eq('run_id', runId),
        supabase.from('encounters').select('*').eq('run_id', runId).order('route_number'),
        supabase.from('boss_battles').select('*').eq('run_id', runId),
        supabase.from('boss_team_draft').select('*').eq('run_id', runId),
      ]);

      set({
        runId,
        pokemon: pokemon?.map((p: any) => ({
          id: p.id,
          runId: p.run_id,
          playerNumber: p.player_number,
          name: p.name,
          species: p.species,
          primaryType: p.primary_type,
          createdAt: p.created_at,
        })) || [],
        encounters: encounters?.map((e: any) => ({
          id: e.id,
          runId: e.run_id,
          routeNumber: e.route_number,
          routeName: e.route_name,
          player1PokemonId: e.player1_pokemon_id,
          player2PokemonId: e.player2_pokemon_id,
          status: e.status,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        })) || [],
        bossBattles: bossBattles?.map((b: any) => ({
          id: b.id,
          runId: b.run_id,
          bossName: b.boss_name,
          defeated: b.defeated,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        })) || [],
        bossDraft: bossDraft?.map((d: any) => ({
          id: d.id,
          runId: d.run_id,
          player1PokemonId: d.player1_pokemon_id,
          player2PokemonId: d.player2_pokemon_id,
          notes: d.notes,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })) || [],
      });
    } catch (error) {
      console.error('Error fetching run data:', error);
    }
  },

  addEncounter: async (routeNumber: number, routeName: string) => {
    const { runId } = get();
    if (!runId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('encounters').insert({
        run_id: runId,
        route_number: routeNumber,
        route_name: routeName,
        status: 'active',
      });

      if (error) throw error;
      await get().fetchRunData(get().runCode!);
    } catch (error) {
      console.error('Error adding encounter:', error);
    }
  },

  addPokemonToEncounter: async (encounterId: string, playerNumber: 1 | 2, pokemon: Omit<Pokemon, 'id' | 'runId' | 'createdAt'>) => {
    const { runId } = get();
    if (!runId) return;

    try {
      const supabase = createClient();
      // Insert pokemon
      const { data: newPokemon, error: pokemonError } = await supabase
        .from('pokemon')
        .insert({
          run_id: runId,
          player_number: playerNumber,
          name: pokemon.name,
          species: pokemon.species,
          primary_type: pokemon.primaryType,
        })
        .select('id')
        .single();

      if (pokemonError) throw pokemonError;

      // Update encounter with pokemon ID
      const updateField = playerNumber === 1 ? 'player1_pokemon_id' : 'player2_pokemon_id';
      const { error: updateError } = await supabase
        .from('encounters')
        .update({ [updateField]: newPokemon.id })
        .eq('id', encounterId);

      if (updateError) throw updateError;
      await get().fetchRunData(get().runCode!);
    } catch (error) {
      console.error('Error adding pokemon to encounter:', error);
    }
  },

  updateEncounterStatus: async (encounterId: string, status: 'active' | 'boxed' | 'fainted') => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('encounters')
        .update({ status })
        .eq('id', encounterId);

      if (error) throw error;
      await get().fetchRunData(get().runCode!);
    } catch (error) {
      console.error('Error updating encounter status:', error);
    }
  },

  addBossBattle: async (bossName: string) => {
    const { runId } = get();
    if (!runId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('boss_battles').insert({
        run_id: runId,
        boss_name: bossName,
      });

      if (error) throw error;
      await get().fetchRunData(get().runCode!);
    } catch (error) {
      console.error('Error adding boss battle:', error);
    }
  },

  toggleBossDefeated: async (bossBattleId: string) => {
    const { bossBattles } = get();
    const boss = bossBattles.find((b) => b.id === bossBattleId);
    if (!boss) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('boss_battles')
        .update({ defeated: !boss.defeated })
        .eq('id', bossBattleId);

      if (error) throw error;
      await get().fetchRunData(get().runCode!);
    } catch (error) {
      console.error('Error toggling boss defeated:', error);
    }
  },

  addBossDraft: async (player1Id: string | null, player2Id: string | null, notes?: string) => {
    const { runId } = get();
    if (!runId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('boss_team_draft').insert({
        run_id: runId,
        player1_pokemon_id: player1Id,
        player2_pokemon_id: player2Id,
        notes: notes || null,
      });

      if (error) throw error;
      await get().fetchRunData(get().runCode!);
    } catch (error) {
      console.error('Error adding boss draft:', error);
    }
  },

  removeBossDraft: async (draftId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.from('boss_team_draft').delete().eq('id', draftId);

      if (error) throw error;
      await get().fetchRunData(get().runCode!);
    } catch (error) {
      console.error('Error removing boss draft:', error);
    }
  },
}));
