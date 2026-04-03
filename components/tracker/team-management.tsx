'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTracker, Pokemon } from '@/lib/context/tracker-context';
import { AlertTriangle } from 'lucide-react';

export function TeamManagement() {
  const { encounters } = useTracker();

  // Only 'active' encounters contribute to the team
  const activeEncounters = encounters.filter((e) => e.status === 'active');

  const activePokemon: Pokemon[] = activeEncounters.flatMap((enc) =>
    [enc.player1Pokemon, enc.player2Pokemon].filter(
      (p): p is Pokemon => p !== null
    )
  );

  // Type duplicate detection
  const typeCount: Record<string, number> = {};
  activePokemon.forEach((p) => {
    typeCount[p.primaryType] = (typeCount[p.primaryType] ?? 0) + 1;
  });
  const duplicateTypes = new Set(
    Object.entries(typeCount)
      .filter(([, count]) => count > 1)
      .map(([type]) => type)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">
          Active Team ({activePokemon.length}/12)
        </h2>

        {duplicateTypes.size > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Type Conflict Detected!</strong> Duplicate types:{' '}
              {[...duplicateTypes].join(', ')}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeEncounters.map((enc) => {
            const p1 = enc.player1Pokemon;
            const p2 = enc.player2Pokemon;

            return (
              <Card key={enc.id} className="p-4">
                <p className="text-xs text-muted-foreground mb-3">
                  Route {enc.routeNumber} — {enc.routeName}
                </p>

                <div className="space-y-3">
                  {p1 && (
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="font-bold text-sm">{p1.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {p1.species}
                      </p>
                      <div className="flex gap-2 items-center">
                        <Badge
                          className={
                            duplicateTypes.has(p1.primaryType)
                              ? 'bg-red-200 text-red-900'
                              : 'bg-blue-200 text-blue-900'
                          }
                        >
                          {p1.primaryType}
                        </Badge>
                        {duplicateTypes.has(p1.primaryType) && (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  )}

                  {p2 && (
                    <div className="bg-red-50 p-3 rounded">
                      <p className="font-bold text-sm">{p2.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {p2.species}
                      </p>
                      <div className="flex gap-2 items-center">
                        {/* Fixed: p2 non-conflict badge was always red — now correctly blue when no conflict */}
                        <Badge
                          className={
                            duplicateTypes.has(p2.primaryType)
                              ? 'bg-red-200 text-red-900'
                              : 'bg-blue-200 text-blue-900'
                          }
                        >
                          {p2.primaryType}
                        </Badge>
                        {duplicateTypes.has(p2.primaryType) && (
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

      {/* Type summary */}
      {activePokemon.length > 0 && (
        <Card className="p-4 bg-secondary">
          <h3 className="font-bold mb-3">Type Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(typeCount).map(([type, count]) => (
              <div
                key={type}
                className={`p-2 rounded text-sm ${
                  count > 1
                    ? 'bg-red-100 text-red-900'
                    : 'bg-blue-100 text-blue-900'
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
