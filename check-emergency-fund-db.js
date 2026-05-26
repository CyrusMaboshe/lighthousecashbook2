
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

    async function check() {
        console.log('--- EMERGENCY FUND CHECK ---');

        // Check tables
        const { data: balance, error: balanceError } = await supabase
            .from('emergency_fund_balance')
            .select('*');

        if (balanceError) {
            console.error('❌ Error fetching balance:', balanceError.message);
            if (balanceError.code === 'PGRST204') {
                console.error('Table "emergency_fund_balance" does not exist!');
            }
        } else {
            console.log('✅ Balance table exists.');
            console.log('Balance records:', balance);
        }

        const { data: trans, error: transError } = await supabase
            .from('emergency_fund_transactions')
            .select('*');

        if (transError) {
            console.error('❌ Error fetching transactions:', transError.message);
        } else {
            console.log('✅ Transactions table exists.');
            console.log('Transaction count:', trans.length);
            console.log('Transactions:', trans);
        }

        console.log('----------------------------');
    }

    check();

} catch (e) {
    console.error('Error:', e);
}
