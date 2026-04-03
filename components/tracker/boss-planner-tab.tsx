'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTracker, Pokemon } from '@/lib/context/tracker-context';
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

// Returns types that appear more than once across the given pokemon list
function findDuplicateTypes(pokemonList: Array<Pokemon | null>): string[] {
  const typeCount: Record<string, number> = {};
  pokemonList.forEach((p) => {
    if (p) typeCount[p.primaryType] = (typeCount[p.primaryType] ?? 0) + 1;
  });
  return Object.entries(typeCount)
    .filter(([, count]) => count > 1)
    .map(([type]) => type);
}

export function BossPlannerTab() {
  const {
    bossBattles,
    encounters,
    addBossBattle,
    toggleBossDefeated,
    addBossDraft,
    removeBossDraft,
    bossDraft,
  } = useTracker();

  const [openNewBoss, setOpenNewBoss] = useState(false);
  const [newBossName, setNewBossName] = useState('');
  const [openDraftDialog, setOpenDraftDialog] = useState(false);

  const handleAddBoss = (bossName: string) => {
    if (!bossName.trim()) return;
    addBossBattle(bossName);
    setNewBossName('');
    setOpenNewBoss(false);
  };

  const handleAddDraft = async (
    player1Id: string | null,
    player2Id: string | null,
    notes: string
  ) => {
    await addBossDraft(player1Id, player2Id, notes || undefined);
    setOpenDraftDialog(false);
  };

  // Flat list of all active pokemon, preserving which player they belong to
  const activePokemon: Pokemon[] = encounters
    .filter((e) => e.status === 'active')
    .flatMap((enc) =>
      [enc.player1Pokemon, enc.player2Pokemon].filter(
        (p): p is Pokemon => p !== null
      )
    );

  // All pokemon currently committed to the draft (for conflict checking)
  const draftPokemon: Array<Pokemon | null> = bossDraft.flatMap((d) => [
    d.player1Pokemon,
    d.player2Pokemon,
  ]);

  return (
    <div className="space-y-6">
      {/* ── Boss battles ──────────────────────────────────────── */}
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
                <p className="text-sm text-muted-foreground">
                  Select from standard Platinum bosses:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PLATINUM_BOSSES.map((boss) => (
                    <Button
                      key={boss}
                      variant="outline"
                      onClick={() => handleAddBoss(boss)}
                      className="text-left"
                    >
                      {boss}
                    </Button>
                  ))}
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm font-semibold mb-2">
                    Or enter custom boss:
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Boss name..."
                      value={newBossName}
                      onChange={(e) => setNewBossName(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === 'Enter' && handleAddBoss(newBossName)
                      }
                    />
                    <Button
                      onClick={() => handleAddBoss(newBossName)}
                      disabled={!newBossName.trim()}
                    >
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
                  {/* Fixed: use onCheckedChange, not onChange */}
                  <Checkbox
                    checked={boss.defeated}
                    onCheckedChange={() => toggleBossDefeated(boss.id)}
                  />
                  <p
                    className={`font-semibold ${
                      boss.defeated ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {boss.bossName}
                  </p>
                </div>
                <Badge variant={boss.defeated ? 'secondary' : 'default'}>
                  {boss.defeated ? 'Defeated' : 'Upcoming'}
                </Badge>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* ── Flight plan / draft ───────────────────────────────── */}
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
              {/* Pass activePokemon and the existing draft pokemon for conflict checking */}
              <DraftTeamSelector
                activePokemon={activePokemon}
                existingDraftPokemon={draftPokemon}
                onConfirm={handleAddDraft}
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
              const p1 = draft.player1Pokemon;
              const p2 = draft.player2Pokemon;
              // Check conflicts within this specific draft entry only
              const entryConflicts = findDuplicateTypes([p1, p2]);

              return (
                <Card key={draft.id} className="p-4">
                  {entryConflicts.length > 0 && (
                    <Alert className="mb-3 border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 text-sm">
                        Type conflict within pair: {entryConflicts.join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-4 mb-3">
                    {p1 && (
                      <div className="flex-1 bg-blue-50 p-3 rounded">
                        <p className="font-bold text-sm">{p1.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p1.species}
                        </p>
                        <Badge className="mt-2 bg-blue-200 text-blue-900">
                          {p1.primaryType}
                        </Badge>
                      </div>
                    )}
                    {p2 && (
                      <div className="flex-1 bg-red-50 p-3 rounded">
                        <p className="font-bold text-sm">{p2.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p2.species}
                        </p>
                        <Badge className="mt-2 bg-red-200 text-red-900">
                          {p2.primaryType}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {draft.notes && (
                    <p className="text-sm text-muted-foreground mb-3 italic">
                      Note: {draft.notes}
                    </p>
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

// ─── DraftTeamSelector ────────────────────────────────────────────────────────

interface DraftTeamSelectorProps {
  activePokemon: Pokemon[];
  existingDraftPokemon: Array<Pokemon | null>;
  onConfirm: (
    p1Id: string | null,
    p2Id: string | null,
    notes: string
  ) => void;
}

function DraftTeamSelector({
  activePokemon,
  existingDraftPokemon,
  onConfirm,
}: DraftTeamSelectorProps) {
  const [selectedP1, setSelectedP1] = useState<string | null>(null);
  const [selectedP2, setSelectedP2] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const selectedP1Pokemon =
    activePokemon.find((p) => p.id === selectedP1) ?? null;
  const selectedP2Pokemon =
    activePokemon.find((p) => p.id === selectedP2) ?? null;

  // Conflict = the two selected pokemon share a type, OR either conflicts with existing draft
  const allToCheck: Array<Pokemon | null> = [
    ...existingDraftPokemon,
    selectedP1Pokemon,
    selectedP2Pokemon,
  ];
  const conflicts = findDuplicateTypes(allToCheck);

  const player1Pokemon = activePokemon.filter((p) => p.playerNumber === 1);
  const player2Pokemon = activePokemon.filter((p) => p.playerNumber === 2);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold mb-2">Player 1 Pokémon</p>
        <PokemonSearchForBoss
          activePokemon={player1Pokemon}
          onSelect={setSelectedP1}
          selectedId={selectedP1}
          player={1}
        />
      </div>

      <div>
        <p className="text-sm font-semibold mb-2">Player 2 Pokémon</p>
        <PokemonSearchForBoss
          activePokemon={player2Pokemon}
          onSelect={setSelectedP2}
          selectedId={selectedP2}
          player={2}
        />
      </div>

      <div>
        <p className="text-sm font-semibold mb-1">Notes (optional)</p>
        <Input
          placeholder="e.g. Use for Candice"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {conflicts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 text-sm">
            Type overlap detected: {conflicts.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={() => onConfirm(selectedP1, selectedP2, notes)}
        disabled={!selectedP1 && !selectedP2}
        className="w-full"
      >
        Add to Draft
      </Button>
    </div>
  );
}
