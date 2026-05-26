
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

    async function checkMainTransactions() {
        console.log('--- MAIN TRANSACTIONS CHECK ---');

        const { count, error } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Error:', error.message);
        } else {
            console.log('✅ Main Transactions Count:', count);
        }

        console.log('----------------------------');
    }

    checkMainTransactions();

} catch (e) {
    console.error('Error:', e);
}
