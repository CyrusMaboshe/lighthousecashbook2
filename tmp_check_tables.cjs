
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fbsceogmrqmfapjwztqy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZic2Nlb2dtcnFtZmFwand6dHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTcwNDAsImV4cCI6MjA2NTQzMzA0MH0.40v9bSnIIl7n5-n3uCbzT5G51V0CtUKowgYvcaVdIDI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    const tables = [
        'companies',
        'company_admins',
        'company_users',
        'mt_companies',
        'mt_company_admins',
        'mt_company_users',
        'rebuilt_profiles',
        'rebuild_profiles'
    ];

    console.log('Checking tables existence...');
    for (const table of tables) {
        const { data, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            if (error.code === '42P01') {
                console.log(`❌ ${table}: DOES NOT EXIST`);
            } else {
                console.log(`⚠️ ${table}: ERROR ${error.code} - ${error.message}`);
            }
        } else {
            console.log(`✅ ${table}: EXISTS`);
        }
    }
}

checkTables();
