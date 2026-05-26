
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

    const supabase = createClient(supabaseUrl, supabaseKey);

    async function checkRLS() {
        console.log('--- RLS STATUS CHECK ---');

        // We'll use a trick to check if RLS is on by trying to fetch a record
        // and seeing if it works.

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .limit(1);

        if (error) {
            console.log('Transactions table access error:', error.message);
        } else {
            console.log('Transactions row data (successfully fetched as anon):', data);
        }

        const { data: ef, error: efError } = await supabase
            .from('emergency_fund_balance')
            .select('*')
            .limit(1);

        if (efError) {
            console.log('Emergency fund balance access error:', efError.message);
        } else {
            console.log('Emergency fund balance row data:', ef);
        }

        console.log('----------------------------');
    }

    checkRLS();

} catch (e) {
    console.error('Error:', e);
}
