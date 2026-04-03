'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTrackerStore } from '@/lib/store/tracker-store';
import { PokemonSearch } from './pokemon-search';
import { Plus } from 'lucide-react';

export function EncountersDashboard() {
  const { encounters, pokemon, addEncounter, addPokemonToEncounter, updateEncounterStatus } =
    useTrackerStore();
  const [newRoute, setNewRoute] = useState('');
  const [newRouteName, setNewRouteName] = useState('');
  const [openNewEncounter, setOpenNewEncounter] = useState(false);

  const handleAddEncounter = () => {
    if (newRoute && newRouteName) {
      addEncounter(parseInt(newRoute), newRouteName);
      setNewRoute('');
      setNewRouteName('');
      setOpenNewEncounter(false);
    }
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    boxed: 'bg-yellow-100 text-yellow-800',
    fainted: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Encounters</h2>
        <Dialog open={openNewEncounter} onOpenChange={setOpenNewEncounter}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Route
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Route</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Route number (e.g., 201)"
                value={newRoute}
                onChange={(e) => setNewRoute(e.target.value)}
                type="number"
              />
              <Input
                placeholder="Route name (e.g., Route 201 - Starting Road)"
                value={newRouteName}
                onChange={(e) => setNewRouteName(e.target.value)}
              />
              <Button onClick={handleAddEncounter} disabled={!newRoute || !newRouteName}>
                Add Route
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {encounters.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            No routes added yet. Create your first encounter!
          </Card>
        ) : (
          encounters.map((encounter) => {
            const player1Pokemon = pokemon.find((p) => p.id === encounter.player1PokemonId);
            const player2Pokemon = pokemon.find((p) => p.id === encounter.player2PokemonId);

            return (
              <Card key={encounter.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg">
                      Route {encounter.routeNumber} - {encounter.routeName}
                    </h3>
                    <p className="text-sm text-muted-foreground">{new Date(encounter.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={statusColors[encounter.status]}>
                      {encounter.status.charAt(0).toUpperCase() + encounter.status.slice(1)}
                    </Badge>
                    <Select value={encounter.status} onValueChange={(val: any) => updateEncounterStatus(encounter.id, val)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="boxed">Boxed</SelectItem>
                        <SelectItem value="fainted">Fainted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border-r pr-4">
                    <p className="text-sm font-semibold mb-2">Player 1</p>
                    {player1Pokemon ? (
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="font-bold">{player1Pokemon.name}</p>
                        <p className="text-sm text-muted-foreground">{player1Pokemon.species}</p>
                        <Badge className="mt-2">{player1Pokemon.primaryType}</Badge>
                      </div>
                    ) : (
                      <PokemonSearch
                        onSelect={(name, species, primaryType) =>
                          addPokemonToEncounter(encounter.id, 1, {
                            playerNumber: 1,
                            name,
                            species,
                            primaryType,
                          })
                        }
                      />
                    )}
                  </div>

                  <div className="pl-4">
                    <p className="text-sm font-semibold mb-2">Player 2</p>
                    {player2Pokemon ? (
                      <div className="bg-red-50 p-3 rounded">
                        <p className="font-bold">{player2Pokemon.name}</p>
                        <p className="text-sm text-muted-foreground">{player2Pokemon.species}</p>
                        <Badge className="mt-2">{player2Pokemon.primaryType}</Badge>
                      </div>
                    ) : (
                      <PokemonSearch
                        onSelect={(name, species, primaryType) =>
                          addPokemonToEncounter(encounter.id, 2, {
                            playerNumber: 2,
                            name,
                            species,
                            primaryType,
                          })
                        }
                      />
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
