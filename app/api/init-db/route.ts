import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Try to create tables using the PostgreSQL REST API
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
    `;

    // Test connection by trying to fetch runs table
    const { data, error } = await supabase
      .from('runs')
      .select('id')
      .limit(1);

    if (error && error.code === 'PGRST102') {
      // Table doesn't exist, try to create it
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rpc/exec_sql`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sql }),
        }
      );

      if (!response.ok) {
        // Tables might already exist or user lacks permissions
        console.log('Could not create tables via RPC, they may already exist');
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database initialization error:', error);
    // Don't fail - tables might already exist
    return NextResponse.json({ success: true });
  }
}
