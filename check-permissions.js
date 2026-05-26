
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
try {
    const envContent = readFileSync('.env', 'utf-8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            let value = match[2].trim();
            value = value.replace(/^["']|["']$/g, '');
            envVars[match[1].trim()] = value;
        }
    });

    const supabaseUrl = envVars.VITE_SUPABASE_URL;
    const supabaseKey = envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    async function checkPermissions() {
        console.log('--- PERMISSIONS CHECK ---');

        // Check if we can see the tables via RPC (bypassing RLS)
        // We'll create a temporary RPC if we could, but we can't.

        // Instead, let's check if the tables are in the public schema
        const { data: tables, error: tablesError } = await supabase
            .from('emergency_fund_balance')
            .select('count', { count: 'exact', head: true });

        if (tablesError) {
            console.log('Balance table access error:', tablesError.message);
        } else {
            console.log('Balance table accessible (count):', tables);
        }

        const { data: trans, error: transError } = await supabase
            .from('emergency_fund_transactions')
            .select('count', { count: 'exact', head: true });

        if (transError) {
            console.log('Transactions table access error:', transError.message);
        } else {
            console.log('Transactions table accessible (count):', trans);
        }

        // Try to fetch one row from balance
        const { data: balance, error: balanceFetchError } = await supabase
            .from('emergency_fund_balance')
            .select('*')
            .limit(1);

        console.log('Balance fetch result:', balance, balanceFetchError?.message);

        console.log('----------------------------');
    }

    checkPermissions();

} catch (e) {
    console.error('Error:', e);
}
