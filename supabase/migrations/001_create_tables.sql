-- Create runs table
create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  run_code varchar(8) unique not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create pokemon table
create table if not exists public.pokemon (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  player_number int not null check (player_number in (1, 2)),
  name varchar(255) not null,
  species varchar(255) not null,
  primary_type varchar(50) not null,
  created_at timestamp with time zone default now(),
  unique(run_id, player_number, name, species)
);

-- Create encounters table
create table if not exists public.encounters (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  route_number int not null,
  route_name varchar(255) not null,
  player1_pokemon_id uuid references public.pokemon(id) on delete set null,
  player2_pokemon_id uuid references public.pokemon(id) on delete set null,
  status varchar(50) not null default 'active' check (status in ('active', 'boxed', 'fainted')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(run_id, route_number)
);

-- Create boss_battles table
create table if not exists public.boss_battles (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  boss_name varchar(255) not null,
  defeated boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create boss_team_draft table
create table if not exists public.boss_team_draft (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  player1_pokemon_id uuid references public.pokemon(id) on delete cascade,
  player2_pokemon_id uuid references public.pokemon(id) on delete cascade,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_encounters_run_id on public.encounters(run_id);
create index if not exists idx_encounters_route_number on public.encounters(run_id, route_number);
create index if not exists idx_pokemon_run_id on public.pokemon(run_id);
create index if not exists idx_boss_battles_run_id on public.boss_battles(run_id);
create index if not exists idx_boss_team_draft_run_id on public.boss_team_draft(run_id);
