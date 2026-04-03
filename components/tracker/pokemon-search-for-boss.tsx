'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pokemon } from '@/lib/context/tracker-context';

interface PokemonSearchForBossProps {
  activePokemon: Pokemon[];
  onSelect: (id: string | null) => void;
  selectedId: string | null;
  player: 1 | 2;
}

export function PokemonSearchForBoss({
  activePokemon,
  onSelect,
  selectedId,
  player,
}: PokemonSearchForBossProps) {
  const selected = activePokemon.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="space-y-2">
      {selected && (
        <div className="bg-gray-100 p-2 rounded flex justify-between items-center mb-2">
          <div>
            <p className="font-semibold text-sm">{selected.name}</p>
            <p className="text-xs text-muted-foreground">{selected.species}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
            ✕
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
        {activePokemon.map((poke) => (
          <button
            key={poke.id}
            onClick={() => onSelect(poke.id === selectedId ? null : poke.id)}
            className={`p-2 rounded border-2 text-left transition-colors ${
              selectedId === poke.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <p className="font-semibold text-sm">{poke.name}</p>
            <p className="text-xs text-muted-foreground">{poke.species}</p>
            <Badge className="mt-1 text-xs">{poke.primaryType}</Badge>
          </button>
        ))}
      </div>

      {activePokemon.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          No active Pokémon for Player {player}
        </p>
      )}
    </div>
  );
}
