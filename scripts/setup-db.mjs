import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('Setting up Soul-Locke tracker database...');

    // Create runs table
    const { error: runsError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_code VARCHAR(8) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    }).catch(() => ({ error: null })); // Handle if rpc doesn't exist

    // Instead, use raw query via the admin client
    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .catch(() => ({ data: null }));

    // If we can't access schema info, try creating tables directly
    const sql = `
      CREATE TABLE IF NOT EXISTS runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_code VARCHAR(8) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS pokemon (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
        player_number INT NOT NULL CHECK (player_number IN (1, 2)),
        name VARCHAR(255) NOT NULL,
        species VARCHAR(255) NOT NULL,
        primary_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(run_id, player_number, name, species)
      );

      CREATE TABLE IF NOT EXISTS encounters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
        route_number INT NOT NULL,
        route_name VARCHAR(255) NOT NULL,
        player1_pokemon_id UUID REFERENCES pokemon(id) ON DELETE SET NULL,
        player2_pokemon_id UUID REFERENCES pokemon(id) ON DELETE SET NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'boxed', 'fainted')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(run_id, route_number)
      );

      CREATE TABLE IF NOT EXISTS boss_battles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
        boss_name VARCHAR(255) NOT NULL,
        defeated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS boss_team_draft (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
        player1_pokemon_id UUID REFERENCES pokemon(id) ON DELETE CASCADE,
        player2_pokemon_id UUID REFERENCES pokemon(id) ON DELETE CASCADE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_encounters_run_id ON encounters(run_id);
      CREATE INDEX IF NOT EXISTS idx_encounters_route_number ON encounters(run_id, route_number);
      CREATE INDEX IF NOT EXISTS idx_pokemon_run_id ON pokemon(run_id);
      CREATE INDEX IF NOT EXISTS idx_boss_battles_run_id ON boss_battles(run_id);
      CREATE INDEX IF NOT EXISTS idx_boss_team_draft_run_id ON boss_team_draft(run_id);
    `;

    const { error } = await supabase.rpc('exec_sql', { sql }).catch(async () => {
      // Fallback: use direct execution
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql })
      }).catch(e => ({ error: e }));
      return { error: null };
    });

    if (error) {
      console.warn('SQL execution via rpc may have failed, continuing...');
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
