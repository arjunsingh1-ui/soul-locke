'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { searchPokedex } from '@/lib/pokedex';
import { Search } from 'lucide-react';

interface PokemonSearchProps {
  onSelect: (name: string, species: string, primaryType: string) => void;
}

export function PokemonSearch({ onSelect }: PokemonSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [customName, setCustomName] = useState('');
  const [customSpecies, setCustomSpecies] = useState('');
  const [customType, setCustomType] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      setResults(searchPokedex(query));
    } else {
      setResults([]);
    }
  };

  const handleSelectPokemon = (name: string, species: string, primaryType: string) => {
    onSelect(name, species, primaryType);
    setSearchQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleUseCustom = () => {
    if (customName && customSpecies && customType) {
      onSelect(customName, customSpecies, customType);
      setCustomName('');
      setCustomSpecies('');
      setCustomType('');
      setUseCustom(false);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <Search className="w-4 h-4" />
          Add Pokémon
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          {!useCustom ? (
            <>
              <div className="space-y-2">
                <p className="text-sm font-semibold">Search Pokedex</p>
                <Input
                  placeholder="Search by name or species..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  autoFocus
                />
              </div>

              {results.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {results.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        handleSelectPokemon(result.name, result.species, result.primaryType)
                      }
                      className="w-full text-left p-2 hover:bg-secondary rounded text-sm"
                    >
                      <p className="font-semibold">{result.name}</p>
                      <p className="text-xs text-muted-foreground">{result.primaryType}</p>
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t pt-2">
                <button
                  onClick={() => setUseCustom(true)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Or enter custom Pokémon
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold">Custom Pokémon</p>
              <Input
                placeholder="Nickname (e.g., Sparky)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
              <Input
                placeholder="Species (e.g., Pikachu)"
                value={customSpecies}
                onChange={(e) => setCustomSpecies(e.target.value)}
              />
              <Input
                placeholder="Primary Type (e.g., Electric)"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUseCustom} disabled={!customName || !customSpecies || !customType}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setUseCustom(false);
                    setCustomName('');
                    setCustomSpecies('');
                    setCustomType('');
                  }}
                >
                  Back
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
