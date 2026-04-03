'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { supabase } from '@/lib/supabase';

// ─── Domain types (camelCase, used throughout the app) ───────────────────────

export interface Pokemon {
  id: string;
  name: string;
  species: string;
  primaryType: string;
  playerNumber: 1 | 2;
}

export interface Encounter {
  id: string;
  routeNumber: number;
  routeName: string;
  player1Pokemon: Pokemon | null;
  player2Pokemon: Pokemon | null;
  status: 'active' | 'boxed' | 'fainted';
}

export interface BossBattle {
  id: string;
  bossName: string;
  defeated: boolean;
}

export interface BossDraft {
  id: string;
  player1Pokemon: Pokemon | null;
  player2Pokemon: Pokemon | null;
  notes?: string;
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface TrackerContextType {
  runCode: string | null;
  encounters: Encounter[];
  bossBattles: BossBattle[];
  bossDraft: BossDraft[];
  loading: boolean;
  error: string | null;
  initializeRun: (code: string) => Promise<void>;
  addEncounter: (routeNumber: number, routeName: string) => Promise<void>;
  addPokemonToEncounter: (
    encounterId: string,
    playerNumber: 1 | 2,
    pokemon: Omit<Pokemon, 'id' | 'playerNumber'>
  ) => Promise<void>;
  updateEncounterStatus: (
    encounterId: string,
    status: 'active' | 'boxed' | 'fainted'
  ) => Promise<void>;
  addBossBattle: (bossName: string) => Promise<void>;
  toggleBossDefeated: (bossBattleId: string) => Promise<void>;
  addBossDraft: (
    player1Id: string | null,
    player2Id: string | null,
    notes?: string
  ) => Promise<void>;
  removeBossDraft: (draftId: string) => Promise<void>;
}

// ─── Helpers to map DB rows → domain types ───────────────────────────────────

function pokemonFromRow(row: {
  id: string;
  name: string;
  species: string;
  primary_type: string;
  player_number: 1 | 2;
}): Pokemon {
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    primaryType: row.primary_type,
    playerNumber: row.player_number,
  };
}

// ─── Context & Provider ───────────────────────────────────────────────────────

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [runId, setRunId] = useState<string | null>(null);
  const [runCode, setRunCode] = useState<string | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [bossBattles, setBossBattles] = useState<BossBattle[]>([]);
  const [bossDraft, setBossDraft] = useState<BossDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load all data for a run ─────────────────────────────────────────────────
  const loadRunData = useCallback(async (currentRunId: string) => {
    // Load all pokemon for this run first (needed to build encounters & drafts)
    const { data: pokemonRows, error: pokeErr } = await supabase
      .from('pokemon')
      .select('*')
      .eq('run_id', currentRunId);

    if (pokeErr) throw pokeErr;

    const pokemonMap = new Map<string, Pokemon>();
    (pokemonRows ?? []).forEach((row) => {
      pokemonMap.set(row.id, pokemonFromRow(row));
    });

    // Load encounters
    const { data: encounterRows, error: encErr } = await supabase
      .from('encounters')
      .select('*')
      .eq('run_id', currentRunId)
      .order('created_at', { ascending: true });

    if (encErr) throw encErr;

    const mappedEncounters: Encounter[] = (encounterRows ?? []).map((row) => ({
      id: row.id,
      routeNumber: row.route_number,
      routeName: row.route_name,
      status: row.status,
      player1Pokemon: row.player1_pokemon_id
        ? (pokemonMap.get(row.player1_pokemon_id) ?? null)
        : null,
      player2Pokemon: row.player2_pokemon_id
        ? (pokemonMap.get(row.player2_pokemon_id) ?? null)
        : null,
    }));

    setEncounters(mappedEncounters);

    // Load boss battles
    const { data: bossRows, error: bossErr } = await supabase
      .from('boss_battles')
      .select('*')
      .eq('run_id', currentRunId)
      .order('created_at', { ascending: true });

    if (bossErr) throw bossErr;

    setBossBattles(
      (bossRows ?? []).map((row) => ({
        id: row.id,
        bossName: row.boss_name,
        defeated: row.defeated,
      }))
    );

    // Load boss drafts
    const { data: draftRows, error: draftErr } = await supabase
      .from('boss_team_draft')
      .select('*')
      .eq('run_id', currentRunId)
      .order('created_at', { ascending: true });

    if (draftErr) throw draftErr;

    setBossDraft(
      (draftRows ?? []).map((row) => ({
        id: row.id,
        notes: row.notes ?? undefined,
        player1Pokemon: row.player1_pokemon_id
          ? (pokemonMap.get(row.player1_pokemon_id) ?? null)
          : null,
        player2Pokemon: row.player2_pokemon_id
          ? (pokemonMap.get(row.player2_pokemon_id) ?? null)
          : null,
      }))
    );
  }, []);

  // ── initializeRun ───────────────────────────────────────────────────────────
  const initializeRun = useCallback(
    async (code: string) => {
      setLoading(true);
      setError(null);
      try {
        // Try to find existing run
        const { data: existing, error: findErr } = await supabase
          .from('runs')
          .select('*')
          .eq('run_code', code)
          .maybeSingle();

        if (findErr) throw findErr;

        let id: string;

        if (existing) {
          id = existing.id;
        } else {
          // Create a new run
          const { data: created, error: createErr } = await supabase
            .from('runs')
            .insert({ run_code: code })
            .select()
            .single();

          if (createErr) throw createErr;
          id = created.id;
        }

        setRunId(id);
        setRunCode(code);
        await loadRunData(id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to initialize run';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadRunData]
  );

  // ── addEncounter ────────────────────────────────────────────────────────────
  const addEncounter = useCallback(
    async (routeNumber: number, routeName: string) => {
      if (!runId) return;
      const { data, error: err } = await supabase
        .from('encounters')
        .insert({
          run_id: runId,
          route_number: routeNumber,
          route_name: routeName,
          status: 'active',
        })
        .select()
        .single();

      if (err) throw err;

      setEncounters((prev) => [
        ...prev,
        {
          id: data.id,
          routeNumber: data.route_number,
          routeName: data.route_name,
          status: data.status,
          player1Pokemon: null,
          player2Pokemon: null,
        },
      ]);
    },
    [runId]
  );

  // ── addPokemonToEncounter ───────────────────────────────────────────────────
  const addPokemonToEncounter = useCallback(
    async (
      encounterId: string,
      playerNumber: 1 | 2,
      pokemon: Omit<Pokemon, 'id' | 'playerNumber'>
    ) => {
      if (!runId) return;

      // Insert pokemon row
      const { data: pokeData, error: pokeErr } = await supabase
        .from('pokemon')
        .insert({
          run_id: runId,
          player_number: playerNumber,
          name: pokemon.name,
          species: pokemon.species,
          primary_type: pokemon.primaryType,
        })
        .select()
        .single();

      if (pokeErr) throw pokeErr;

      const newPokemon = pokemonFromRow(pokeData);
      const col =
        playerNumber === 1 ? 'player1_pokemon_id' : 'player2_pokemon_id';

      // Update encounter row
      const { error: encErr } = await supabase
        .from('encounters')
        .update({ [col]: pokeData.id })
        .eq('id', encounterId);

      if (encErr) throw encErr;

      setEncounters((prev) =>
        prev.map((enc) =>
          enc.id === encounterId
            ? {
                ...enc,
                [playerNumber === 1 ? 'player1Pokemon' : 'player2Pokemon']:
                  newPokemon,
              }
            : enc
        )
      );
    },
    [runId]
  );

  // ── updateEncounterStatus ───────────────────────────────────────────────────
  const updateEncounterStatus = useCallback(
    async (encounterId: string, status: 'active' | 'boxed' | 'fainted') => {
      const { error: err } = await supabase
        .from('encounters')
        .update({ status })
        .eq('id', encounterId);

      if (err) throw err;

      setEncounters((prev) =>
        prev.map((enc) =>
          enc.id === encounterId ? { ...enc, status } : enc
        )
      );
    },
    []
  );

  // ── addBossBattle ───────────────────────────────────────────────────────────
  const addBossBattle = useCallback(
    async (bossName: string) => {
      if (!runId) return;

      const { data, error: err } = await supabase
        .from('boss_battles')
        .insert({ run_id: runId, boss_name: bossName, defeated: false })
        .select()
        .single();

      if (err) throw err;

      setBossBattles((prev) => [
        ...prev,
        { id: data.id, bossName: data.boss_name, defeated: data.defeated },
      ]);
    },
    [runId]
  );

  // ── toggleBossDefeated ──────────────────────────────────────────────────────
  const toggleBossDefeated = useCallback(
    async (bossBattleId: string) => {
      const current = bossBattles.find((b) => b.id === bossBattleId);
      if (!current) return;

      const { error: err } = await supabase
        .from('boss_battles')
        .update({ defeated: !current.defeated })
        .eq('id', bossBattleId);

      if (err) throw err;

      setBossBattles((prev) =>
        prev.map((b) =>
          b.id === bossBattleId ? { ...b, defeated: !b.defeated } : b
        )
      );
    },
    [bossBattles]
  );

  // ── addBossDraft ────────────────────────────────────────────────────────────
  const addBossDraft = useCallback(
    async (
      player1Id: string | null,
      player2Id: string | null,
      notes?: string
    ) => {
      if (!runId) return;

      const { data, error: err } = await supabase
        .from('boss_team_draft')
        .insert({
          run_id: runId,
          player1_pokemon_id: player1Id,
          player2_pokemon_id: player2Id,
          notes: notes ?? null,
        })
        .select()
        .single();

      if (err) throw err;

      // Look up the pokemon objects from current encounters state
      const allPokemon = encounters.flatMap((enc) =>
        [enc.player1Pokemon, enc.player2Pokemon].filter(
          (p): p is Pokemon => p !== null
        )
      );

      setBossDraft((prev) => [
        ...prev,
        {
          id: data.id,
          notes: data.notes ?? undefined,
          player1Pokemon: player1Id
            ? (allPokemon.find((p) => p.id === player1Id) ?? null)
            : null,
          player2Pokemon: player2Id
            ? (allPokemon.find((p) => p.id === player2Id) ?? null)
            : null,
        },
      ]);
    },
    [runId, encounters]
  );

  // ── removeBossDraft ─────────────────────────────────────────────────────────
  const removeBossDraft = useCallback(async (draftId: string) => {
    const { error: err } = await supabase
      .from('boss_team_draft')
      .delete()
      .eq('id', draftId);

    if (err) throw err;

    setBossDraft((prev) => prev.filter((d) => d.id !== draftId));
  }, []);

  return (
    <TrackerContext.Provider
      value={{
        runCode,
        encounters,
        bossBattles,
        bossDraft,
        loading,
        error,
        initializeRun,
        addEncounter,
        addPokemonToEncounter,
        updateEncounterStatus,
        addBossBattle,
        toggleBossDefeated,
        addBossDraft,
        removeBossDraft,
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
};

export const useTracker = () => {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error('useTracker must be used within TrackerProvider');
  }
  return context;
};
