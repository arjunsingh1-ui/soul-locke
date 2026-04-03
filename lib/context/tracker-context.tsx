'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

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

interface TrackerContextType {
  runCode: string | null;
  encounters: Encounter[];
  bossBattles: BossBattle[];
  bossDraft: BossDraft[];
  loading: boolean;
  initializeRun: (code: string) => Promise<void>;
  addEncounter: (routeNumber: number, routeName: string) => Promise<void>;
  addPokemonToEncounter: (encounterId: string, playerNumber: 1 | 2, pokemon: Omit<Pokemon, 'id' | 'playerNumber'>) => Promise<void>;
  updateEncounterStatus: (encounterId: string, status: 'active' | 'boxed' | 'fainted') => Promise<void>;
  addBossBattle: (bossName: string) => Promise<void>;
  toggleBossDefeated: (bossBattleId: string) => Promise<void>;
  addBossDraft: (player1Id: string | null, player2Id: string | null, notes?: string) => Promise<void>;
  removeBossDraft: (draftId: string) => Promise<void>;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [runCode, setRunCode] = useState<string | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [bossBattles, setBossBattles] = useState<BossBattle[]>([]);
  const [bossDraft, setBossDraft] = useState<BossDraft[]>([]);
  const [loading, setLoading] = useState(false);

  const initializeRun = useCallback(async (code: string) => {
    setLoading(true);
    try {
      setRunCode(code);
      setEncounters([]);
      setBossBattles([]);
      setBossDraft([]);
    } catch (error) {
      console.error('Error initializing run:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addEncounter = useCallback(async (routeNumber: number, routeName: string) => {
    const newEncounter: Encounter = {
      id: `encounter-${Date.now()}`,
      routeNumber,
      routeName,
      player1Pokemon: null,
      player2Pokemon: null,
      status: 'active',
    };
    setEncounters(prev => [...prev, newEncounter]);
  }, []);

  const addPokemonToEncounter = useCallback(async (encounterId: string, playerNumber: 1 | 2, pokemon: Omit<Pokemon, 'id' | 'playerNumber'>) => {
    setEncounters(prev =>
      prev.map(encounter =>
        encounter.id === encounterId
          ? {
              ...encounter,
              [playerNumber === 1 ? 'player1Pokemon' : 'player2Pokemon']: {
                id: `pokemon-${Date.now()}`,
                ...pokemon,
                playerNumber,
              },
            }
          : encounter
      )
    );
  }, []);

  const updateEncounterStatus = useCallback(async (encounterId: string, status: 'active' | 'boxed' | 'fainted') => {
    setEncounters(prev =>
      prev.map(encounter =>
        encounter.id === encounterId ? { ...encounter, status } : encounter
      )
    );
  }, []);

  const addBossBattle = useCallback(async (bossName: string) => {
    const newBattle: BossBattle = {
      id: `boss-${Date.now()}`,
      bossName,
      defeated: false,
    };
    setBossBattles(prev => [...prev, newBattle]);
  }, []);

  const toggleBossDefeated = useCallback(async (bossBattleId: string) => {
    setBossBattles(prev =>
      prev.map(battle =>
        battle.id === bossBattleId ? { ...battle, defeated: !battle.defeated } : battle
      )
    );
  }, []);

  const addBossDraft = useCallback(async (player1Id: string | null, player2Id: string | null, notes?: string) => {
    const newDraft: BossDraft = {
      id: `draft-${Date.now()}`,
      player1Pokemon: encounters.find(e => e.player1Pokemon?.id === player1Id)?.player1Pokemon || null,
      player2Pokemon: encounters.find(e => e.player2Pokemon?.id === player2Id)?.player2Pokemon || null,
      notes,
    };
    setBossDraft(prev => [...prev, newDraft]);
  }, [encounters]);

  const removeBossDraft = useCallback(async (draftId: string) => {
    setBossDraft(prev => prev.filter(draft => draft.id !== draftId));
  }, []);

  return (
    <TrackerContext.Provider
      value={{
        runCode,
        encounters,
        bossBattles,
        bossDraft,
        loading,
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
