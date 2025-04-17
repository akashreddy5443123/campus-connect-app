import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function clearData() {
  try {
    console.log('Starting data deletion...');
    
    // Delete from dependent tables first
    const queries = [
      'TRUNCATE club_memberships CASCADE',
      'TRUNCATE events CASCADE',
      'TRUNCATE announcements CASCADE',
      'TRUNCATE clubs CASCADE'
    ];

    for (const query of queries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.error(`Error executing query "${query}":`, error);
        throw error;
      }
      console.log(`Successfully executed: ${query}`);
    }
    
    console.log('All data cleared successfully');
  } catch (err) {
    console.error('Error clearing data:', err);
    process.exit(1);
  }
}

clearData(); 