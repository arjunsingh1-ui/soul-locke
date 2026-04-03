'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useTracker } from '@/lib/context/tracker-context';
import { PokemonSearch } from './pokemon-search';
import { Plus, Sparkles, Gift } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  boxed: 'bg-yellow-100 text-yellow-800',
  fainted: 'bg-red-100 text-red-800',
};

// All Pokémon Platinum routes / locations grouped by area
const PLATINUM_ROUTES: { group: string; routes: { number: number; name: string }[] }[] = [
  {
    group: 'Twinleaf → Oreburgh',
    routes: [
      { number: 201, name: 'Route 201' },
      { number: 202, name: 'Route 202' },
      { number: 203, name: 'Route 203' },
      { number: 204, name: 'Route 204' },
      { number: 207, name: 'Route 207' },
    ],
  },
  {
    group: 'Oreburgh → Eterna',
    routes: [
      { number: 205, name: 'Route 205' },
      { number: 206, name: 'Route 206' },
      { number: 208, name: 'Route 208' },
      { number: 209, name: 'Route 209' },
      { number: 210, name: 'Route 210' },
      { number: 211, name: 'Route 211' },
      { number: 212, name: 'Route 212' },
      { number: 213, name: 'Route 213' },
    ],
  },
  {
    group: 'Eterna → Hearthome',
    routes: [
      { number: 214, name: 'Route 214' },
      { number: 215, name: 'Route 215' },
      { number: 216, name: 'Route 216' },
      { number: 217, name: 'Route 217' },
    ],
  },
  {
    group: 'Later Routes',
    routes: [
      { number: 218, name: 'Route 218' },
      { number: 219, name: 'Route 219' },
      { number: 220, name: 'Route 220' },
      { number: 221, name: 'Route 221' },
      { number: 222, name: 'Route 222' },
      { number: 223, name: 'Route 223' },
      { number: 224, name: 'Route 224' },
      { number: 225, name: 'Route 225' },
      { number: 226, name: 'Route 226' },
      { number: 227, name: 'Route 227' },
      { number: 228, name: 'Route 228' },
      { number: 229, name: 'Route 229' },
      { number: 230, name: 'Route 230' },
    ],
  },
  {
    group: 'Cities & Special Areas',
    routes: [
      { number: 300, name: 'Eterna Forest' },
      { number: 301, name: 'Mt. Coronet' },
      { number: 302, name: 'Great Marsh' },
      { number: 303, name: 'Solaceon Ruins' },
      { number: 304, name: 'Victory Road' },
      { number: 305, name: 'Snowpoint Temple' },
      { number: 306, name: 'Turnback Cave' },
      { number: 307, name: 'Wayward Cave' },
      { number: 308, name: 'Iron Island' },
      { number: 309, name: 'Lake Verity' },
      { number: 310, name: 'Lake Valor' },
      { number: 311, name: 'Lake Acuity' },
      { number: 312, name: 'Ravaged Path' },
      { number: 313, name: 'Oreburgh Gate' },
      { number: 314, name: 'Old Chateau' },
      { number: 315, name: 'Trophy Garden' },
      { number: 316, name: 'Sendoff Spring' },
    ],
  },
];

// Flat list for looking up a route by number
const ALL_ROUTES = PLATINUM_ROUTES.flatMap((g) => g.routes);

// Special encounter types get high fake route numbers
const SPECIAL_TYPES = [
  { number: 900, name: 'Shiny Encounter ✨', icon: 'shiny' },
  { number: 901, name: 'Gift Pokémon 🎁', icon: 'gift' },
  { number: 902, name: 'In-Game Trade', icon: 'gift' },
  { number: 903, name: 'Fossil Revival', icon: 'gift' },
];

const CUSTOM_VALUE = '__custom__';

export function EncountersDashboard() {
  const { encounters, addEncounter, addPokemonToEncounter, updateEncounterStatus } =
    useTracker();

  const [openNewEncounter, setOpenNewEncounter] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [customNumber, setCustomNumber] = useState('');
  const [customName, setCustomName] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const handleRouteSelect = (value: string) => {
    if (value === CUSTOM_VALUE) {
      setIsCustom(true);
      setSelectedRoute('');
    } else {
      setIsCustom(false);
      setSelectedRoute(value);
      setCustomNumber('');
      setCustomName('');
    }
  };

  const handleAddEncounter = () => {
    if (isCustom) {
      if (!customNumber || !customName) return;
      addEncounter(parseInt(customNumber, 10), customName);
    } else {
      if (!selectedRoute) return;
      const routeNum = parseInt(selectedRoute, 10);
      const special = SPECIAL_TYPES.find((s) => s.number === routeNum);
      const regular = ALL_ROUTES.find((r) => r.number === routeNum);
      const name = special?.name ?? regular?.name ?? `Route ${routeNum}`;
      addEncounter(routeNum, name);
    }
    // Reset
    setSelectedRoute('');
    setCustomNumber('');
    setCustomName('');
    setIsCustom(false);
    setOpenNewEncounter(false);
  };

  const canAdd = isCustom
    ? Boolean(customNumber && customName)
    : Boolean(selectedRoute);

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
              <DialogTitle>Add New Encounter</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Select location</p>
                <Select onValueChange={handleRouteSelect} value={isCustom ? CUSTOM_VALUE : selectedRoute}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a route or location…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {PLATINUM_ROUTES.map((group) => (
                      <SelectGroup key={group.group}>
                        <SelectLabel>{group.group}</SelectLabel>
                        {group.routes.map((route) => (
                          <SelectItem key={route.number} value={String(route.number)}>
                            {route.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                    <SelectGroup>
                      <SelectLabel>Special Encounters</SelectLabel>
                      {SPECIAL_TYPES.map((s) => (
                        <SelectItem key={s.number} value={String(s.number)}>
                          {s.name}
                        </SelectItem>
                      ))}
                      <SelectItem value={CUSTOM_VALUE}>✏️ Custom…</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {isCustom && (
                <div className="space-y-2 border rounded-md p-3 bg-muted/30">
                  <p className="text-sm font-medium text-muted-foreground">Custom encounter</p>
                  <Input
                    placeholder="Route / location number (e.g. 999)"
                    value={customNumber}
                    onChange={(e) => setCustomNumber(e.target.value)}
                    type="number"
                  />
                  <Input
                    placeholder="Name (e.g. Shiny Bidoof on Route 201)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddEncounter()}
                  />
                </div>
              )}

              <Button onClick={handleAddEncounter} disabled={!canAdd} className="w-full">
                Add Encounter
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
            const p1 = encounter.player1Pokemon;
            const p2 = encounter.player2Pokemon;
            const isSpecial = encounter.routeNumber >= 900;
            const isShiny = encounter.routeNumber === 900;
            const isGift = encounter.routeNumber >= 901 && encounter.routeNumber <= 903;

            return (
              <Card key={encounter.id} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {isShiny && <Sparkles className="w-4 h-4 text-yellow-500" />}
                    {isGift && <Gift className="w-4 h-4 text-purple-500" />}
                    <h3 className="font-bold text-lg">
                      {isSpecial ? encounter.routeName : `Route ${encounter.routeNumber} — ${encounter.routeName}`}
                    </h3>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge className={STATUS_COLORS[encounter.status]}>
                      {encounter.status.charAt(0).toUpperCase() + encounter.status.slice(1)}
                    </Badge>
                    <Select
                      value={encounter.status}
                      onValueChange={(val) =>
                        updateEncounterStatus(
                          encounter.id,
                          val as 'active' | 'boxed' | 'fainted'
                        )
                      }
                    >
                      <SelectTrigger className="w-28">
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
                  {/* Player 1 */}
                  <div className="border-r pr-4">
                    <p className="text-sm font-semibold mb-2">Player 1</p>
                    {p1 ? (
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="font-bold">{p1.name}</p>
                        <p className="text-sm text-muted-foreground">{p1.species}</p>
                        <Badge className="mt-2">{p1.primaryType}</Badge>
                      </div>
                    ) : (
                      <PokemonSearch
                        onSelect={(name, species, primaryType) =>
                          addPokemonToEncounter(encounter.id, 1, { name, species, primaryType })
                        }
                      />
                    )}
                  </div>

                  {/* Player 2 */}
                  <div className="pl-4">
                    <p className="text-sm font-semibold mb-2">Player 2</p>
                    {p2 ? (
                      <div className="bg-red-50 p-3 rounded">
                        <p className="font-bold">{p2.name}</p>
                        <p className="text-sm text-muted-foreground">{p2.species}</p>
                        <Badge className="mt-2">{p2.primaryType}</Badge>
                      </div>
                    ) : (
                      <PokemonSearch
                        onSelect={(name, species, primaryType) =>
                          addPokemonToEncounter(encounter.id, 2, { name, species, primaryType })
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
