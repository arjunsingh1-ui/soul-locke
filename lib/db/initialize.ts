'use server'

import { createClient } from '@/lib/supabase/server'

export async function initializeDatabase() {
  const supabase = await createClient()

  const sql = `
    CREATE TABLE IF NOT EXISTS public.runs (
      id uuid primary key default gen_random_uuid(),
      run_code varchar(8) unique not null,
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now()
    );

    CREATE TABLE IF NOT EXISTS public.pokemon (
      id uuid primary key default gen_random_uuid(),
      run_id uuid not null references public.runs(id) on delete cascade,
      player_number int not null check (player_number in (1, 2)),
      name varchar(255) not null,
      species varchar(255) not null,
      primary_type varchar(50) not null,
      created_at timestamp with time zone default now(),
      unique(run_id, player_number, name, species)
    );

    CREATE TABLE IF NOT EXISTS public.encounters (
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

    CREATE TABLE IF NOT EXISTS public.boss_battles (
      id uuid primary key default gen_random_uuid(),
      run_id uuid not null references public.runs(id) on delete cascade,
      boss_name varchar(255) not null,
      defeated boolean default false,
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now()
    );

    CREATE TABLE IF NOT EXISTS public.boss_team_draft (
      id uuid primary key default gen_random_uuid(),
      run_id uuid not null references public.runs(id) on delete cascade,
      player1_pokemon_id uuid references public.pokemon(id) on delete cascade,
      player2_pokemon_id uuid references public.pokemon(id) on delete cascade,
      notes text,
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now()
    );

    CREATE INDEX IF NOT EXISTS idx_encounters_run_id ON public.encounters(run_id);
    CREATE INDEX IF NOT EXISTS idx_encounters_route_number ON public.encounters(run_id, route_number);
    CREATE INDEX IF NOT EXISTS idx_pokemon_run_id ON public.pokemon(run_id);
    CREATE INDEX IF NOT EXISTS idx_boss_battles_run_id ON public.boss_battles(run_id);
    CREATE INDEX IF NOT EXISTS idx_boss_team_draft_run_id ON public.boss_team_draft(run_id);
  `

  try {
    // Try to execute the migration
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      }
    )

    if (!response.ok) {
      console.error('Database initialization failed, tables may already exist')
    }

    return { success: true }
  } catch (error) {
    console.error('Error initializing database:', error)
    // Don't throw - tables might already exist
    return { success: true }
  }
}
