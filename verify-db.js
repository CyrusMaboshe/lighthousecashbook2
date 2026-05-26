
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

    async function verify() {
        console.log('--- VERIFICATION SUMMARY ---');

        const { count: transCount, error: transError } = await supabase
            .from('savings_transactions')
            .select('*', { count: 'exact', head: true });

        console.log(`Savings Transactions Count: ${transError ? 'Error' : transCount}`);
        if (transError) console.error(transError.message);

        const { data: balance, error: balanceError } = await supabase
            .from('savings_balance')
            .select('*');

        console.log(`Savings Balance Records: ${balanceError ? 'Error' : balance?.length}`);
        if (balance && balance.length > 0) console.log('Current Balance:', balance[0].current_balance);

        const { data: rpcData, error: rpcError } = await supabase.rpc('get_current_savings_balance');
        console.log(`RPC get_current_savings_balance: ${rpcError ? 'Failed' : 'Success'}`);
        if (rpcData) console.log('RPC Data:', JSON.stringify(rpcData));
        if (rpcError) console.error(rpcError.message);

        console.log('----------------------------');
    }

    verify();

} catch (e) {
    console.error('Error reading .env or running script:', e);
}
