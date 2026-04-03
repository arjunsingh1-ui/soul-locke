'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTrackerStore } from '@/lib/store/tracker-store';
import { AlertTriangle } from 'lucide-react';

export function TeamManagement() {
  const { encounters, pokemon } = useTrackerStore();

  // Get active team (only 'active' status encounters)
  const activeEncounters = encounters.filter((e) => e.status === 'active');

  // Extract all 12 active Pokemon with their types
  const activePokemon = activeEncounters.flatMap((enc) => {
    const p1 = pokemon.find((p) => p.id === enc.player1PokemonId);
    const p2 = pokemon.find((p) => p.id === enc.player2PokemonId);
    return [p1, p2].filter(Boolean);
  });

  // Type validation
  const typeCount: Record<string, number> = {};
  const typeDuplicates: string[] = [];

  activePokemon.forEach((p) => {
    if (p) {
      typeCount[p.primaryType] = (typeCount[p.primaryType] || 0) + 1;
      if (typeCount[p.primaryType] > 1 && !typeDuplicates.includes(p.primaryType)) {
        typeDuplicates.push(p.primaryType);
      }
    }
  });

  const hasTypeConflict = typeDuplicates.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Active Team ({activePokemon.length}/12)</h2>

        {hasTypeConflict && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Type Conflict Detected!</strong> The following types have duplicates: {typeDuplicates.join(', ')}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeEncounters.map((enc) => {
            const p1 = pokemon.find((p) => p.id === enc.player1PokemonId);
            const p2 = pokemon.find((p) => p.id === enc.player2PokemonId);

            return (
              <Card key={enc.id} className="p-4">
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Route {enc.routeNumber} - {enc.routeName}
                  </p>
                </div>

                <div className="space-y-3">
                  {p1 && (
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="font-bold text-sm">{p1.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">{p1.species}</p>
                      <div className="flex gap-2 items-center">
                        <Badge
                          className={
                            typeDuplicates.includes(p1.primaryType)
                              ? 'bg-red-200 text-red-900'
                              : 'bg-blue-200 text-blue-900'
                          }
                        >
                          {p1.primaryType}
                        </Badge>
                        {typeDuplicates.includes(p1.primaryType) && (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  )}

                  {p2 && (
                    <div className="bg-red-50 p-3 rounded">
                      <p className="font-bold text-sm">{p2.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">{p2.species}</p>
                      <div className="flex gap-2 items-center">
                        <Badge
                          className={
                            typeDuplicates.includes(p2.primaryType)
                              ? 'bg-red-200 text-red-900'
                              : 'bg-red-200 text-red-900'
                          }
                        >
                          {p2.primaryType}
                        </Badge>
                        {typeDuplicates.includes(p2.primaryType) && (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {activeEncounters.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground">
            No active Pokémon yet. Complete encounters to build your team!
          </Card>
        )}
      </div>

      {activePokemon.length > 0 && (
        <Card className="p-4 bg-secondary">
          <h3 className="font-bold mb-3">Type Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(typeCount).map(([type, count]) => (
              <div
                key={type}
                className={`p-2 rounded text-sm ${
                  count > 1 ? 'bg-red-100 text-red-900' : 'bg-blue-100 text-blue-900'
                }`}
              >
                {type}: {count}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
