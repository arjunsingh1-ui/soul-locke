'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTrackerStore } from '@/lib/store/tracker-store';
import { PokemonSearchForBoss } from './pokemon-search-for-boss';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

// Standard Platinum bosses
const PLATINUM_BOSSES = [
  'Roark (Oreburgh)',
  'Fantina (Hearthome)',
  'Maylene (Veilstone)',
  'Cynthia (Celestic)',
  'Byron (Canalave)',
  'Candice (Snowpoint)',
  'Volkner (Sunyshore)',
  'Cynthia (Champion)',
];

export function BossPlannerTab() {
  const { bossBattles, pokemon, encounters, addBossBattle, toggleBossDefeated, addBossDraft, removeBossDraft, bossDraft } =
    useTrackerStore();
  const [openNewBoss, setOpenNewBoss] = useState(false);
  const [newBossName, setNewBossName] = useState('');
  const [openDraftDialog, setOpenDraftDialog] = useState(false);
  const [draftNotes, setDraftNotes] = useState('');

  const handleAddBoss = (bossName: string) => {
    if (bossName) {
      addBossBattle(bossName);
      setNewBossName('');
      if (bossName !== 'Custom') {
        setOpenNewBoss(false);
      }
    }
  };

  const handleAddDraft = (player1Id: string | null, player2Id: string | null) => {
    addBossDraft(player1Id, player2Id, draftNotes);
    setDraftNotes('');
    setOpenDraftDialog(false);
  };

  // Get active team for draft
  const activeEncounters = encounters.filter((e) => e.status === 'active');
  const activePokemon = activeEncounters.flatMap((enc) => {
    const p1 = pokemon.find((p) => p.id === enc.player1PokemonId);
    const p2 = pokemon.find((p) => p.id === enc.player2PokemonId);
    return [{ pokemon: p1, encId: enc.id, player: 1 }, { pokemon: p2, encId: enc.id, player: 2 }]
      .filter((item) => item.pokemon)
      .map((item) => ({ ...item.pokemon, encId: item.encId, player: item.player }));
  });

  // Check for type conflicts in draft
  const checkDraftConflicts = (p1Id: string | null, p2Id: string | null) => {
    const draftPokemon = bossDraft
      .filter((d) => d.player1PokemonId || d.player2PokemonId)
      .flatMap((d) => {
        const p1 = pokemon.find((p) => p.id === d.player1PokemonId);
        const p2 = pokemon.find((p) => p.id === d.player2PokemonId);
        return [p1, p2].filter(Boolean);
      });

    const p1 = p1Id ? pokemon.find((p) => p.id === p1Id) : null;
    const p2 = p2Id ? pokemon.find((p) => p.id === p2Id) : null;

    const allTypes = [...draftPokemon, p1, p2]
      .filter(Boolean)
      .map((p) => p!.primaryType);

    const typeCount: Record<string, number> = {};
    allTypes.forEach((t) => {
      typeCount[t] = (typeCount[t] || 0) + 1;
    });

    return Object.entries(typeCount)
      .filter(([_, count]) => count > 1)
      .map(([type]) => type);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Boss Battles</h2>
          <Dialog open={openNewBoss} onOpenChange={setOpenNewBoss}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Boss
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Boss Battle</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Select from standard Platinum bosses:</p>
                <div className="grid grid-cols-2 gap-2">
                  {PLATINUM_BOSSES.map((boss) => (
                    <Button
                      key={boss}
                      variant="outline"
                      onClick={() => {
                        handleAddBoss(boss);
                        setOpenNewBoss(false);
                      }}
                      className="text-left"
                    >
                      {boss}
                    </Button>
                  ))}
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm font-semibold mb-2">Or enter custom boss:</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Boss name..."
                      value={newBossName}
                      onChange={(e) => setNewBossName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddBoss(newBossName)}
                    />
                    <Button onClick={() => handleAddBoss(newBossName)} disabled={!newBossName}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {bossBattles.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No boss battles added. Start planning your strategy!
            </Card>
          ) : (
            bossBattles.map((boss) => (
              <Card key={boss.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={boss.defeated}
                    onChange={() => toggleBossDefeated(boss.id)}
                  />
                  <div>
                    <p className={`font-semibold ${boss.defeated ? 'line-through text-muted-foreground' : ''}`}>
                      {boss.bossName}
                    </p>
                  </div>
                </div>
                <Badge variant={boss.defeated ? 'secondary' : 'default'}>
                  {boss.defeated ? 'Defeated' : 'Upcoming'}
                </Badge>
              </Card>
            ))
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Flight Plan</h2>
          <Dialog open={openDraftDialog} onOpenChange={setOpenDraftDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Team
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Plan Boss Team</DialogTitle>
              </DialogHeader>
              <DraftTeamSelector
                activePokemon={activePokemon}
                pokemon={pokemon}
                onConfirm={handleAddDraft}
                checkConflicts={checkDraftConflicts}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {bossDraft.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No flight plans yet. Add teams to plan for upcoming bosses!
            </Card>
          ) : (
            bossDraft.map((draft) => {
              const p1 = pokemon.find((p) => p.id === draft.player1PokemonId);
              const p2 = pokemon.find((p) => p.id === draft.player2PokemonId);
              const conflicts = checkDraftConflicts(draft.player1PokemonId, draft.player2PokemonId);

              return (
                <Card key={draft.id} className="p-4">
                  {conflicts.length > 0 && (
                    <Alert className="mb-3 border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 text-sm">
                        Type conflict: {conflicts.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-4 mb-3">
                    {p1 && (
                      <div className="flex-1 bg-blue-50 p-3 rounded">
                        <p className="font-bold text-sm">{p1.name}</p>
                        <p className="text-xs text-muted-foreground">{p1.species}</p>
                        <Badge className="mt-2 bg-blue-200 text-blue-900">{p1.primaryType}</Badge>
                      </div>
                    )}
                    {p2 && (
                      <div className="flex-1 bg-red-50 p-3 rounded">
                        <p className="font-bold text-sm">{p2.name}</p>
                        <p className="text-xs text-muted-foreground">{p2.species}</p>
                        <Badge className="mt-2 bg-red-200 text-red-900">{p2.primaryType}</Badge>
                      </div>
                    )}
                  </div>

                  {draft.notes && (
                    <p className="text-sm text-muted-foreground mb-3 italic">Note: {draft.notes}</p>
                  )}

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeBossDraft(draft.id)}
                    className="gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </Button>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

interface DraftTeamSelectorProps {
  activePokemon: any[];
  pokemon: any[];
  onConfirm: (p1Id: string | null, p2Id: string | null) => void;
  checkConflicts: (p1Id: string | null, p2Id: string | null) => string[];
}

function DraftTeamSelector({
  activePokemon,
  pokemon,
  onConfirm,
  checkConflicts,
}: DraftTeamSelectorProps) {
  const [selectedP1, setSelectedP1] = useState<string | null>(null);
  const [selectedP2, setSelectedP2] = useState<string | null>(null);

  const conflicts = checkConflicts(selectedP1, selectedP2);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold mb-2">Player 1 Pokémon</p>
        <PokemonSearchForBoss
          activePokemon={activePokemon}
          onSelect={setSelectedP1}
          selectedId={selectedP1}
          player={1}
        />
      </div>

      <div>
        <p className="text-sm font-semibold mb-2">Player 2 Pokémon</p>
        <PokemonSearchForBoss
          activePokemon={activePokemon}
          onSelect={setSelectedP2}
          selectedId={selectedP2}
          player={2}
        />
      </div>

      {conflicts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 text-sm">
            Type overlap with existing draft team: {conflicts.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <Button onClick={() => onConfirm(selectedP1, selectedP2)} disabled={!selectedP1 && !selectedP2} className="w-full">
        Add to Draft
      </Button>
    </div>
  );
}
