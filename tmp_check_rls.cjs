
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fbsceogmrqmfapjwztqy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZic2Nlb2dtcnFtZmFwand6dHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTcwNDAsImV4cCI6MjA2NTQzMzA0MH0.40v9bSnIIl7n5-n3uCbzT5G51V0CtUKowgYvcaVdIDI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
    console.log('Fetching policies via RPC/Execute...');

    // Try to query the information_schema via a raw query if possible, 
    // but Supabase client doesn't support raw SQL unless we have a specific function.
    // However, we can try to see which tables have RLS enabled.

    const tables = ['rebuild_profiles', 'rebuilt_profiles'];

    for (const table of tables) {
        console.log(`\n--- ${table} ---`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`Error querying ${table}: ${error.message}`);
        } else {
            console.log(`Success querying ${table}. Data:`, data);
        }
    }
}

checkPolicies();
