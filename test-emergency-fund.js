
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

    async function testEmergencyFund() {
        console.log('--- EMERGENCY FUND TEST ---');

        // 1. Fetch current balance
        const { data: balanceData, error: balanceError } = await supabase
            .from('emergency_fund_balance')
            .select('*')
            .single();

        console.log('Current Balance from DB:', balanceData);
        if (balanceError) console.error('Balance Error:', balanceError.message);

        // 2. Try to deposit
        console.log('Attempting deposit of 10.00...');
        const { data: rpcResult, error: rpcError } = await supabase.rpc('deposit_to_emergency_fund', {
            amount_param: 10.00,
            note_param: 'Test Deposit from Script',
            transaction_date: new Date().toISOString().split('T')[0],
            user_username: 'TestUser'
        });

        if (rpcError) {
            console.error('❌ RPC Error:', rpcError);
        } else {
            console.log('✅ RPC Result:', rpcResult);
        }

        // 3. Fetch balance again
        const { data: balanceAfter, error: balanceAfterError } = await supabase
            .from('emergency_fund_balance')
            .select('*')
            .single();

        console.log('Balance After Deposit:', balanceAfter);

        // 4. Fetch transactions
        const { data: trans, error: transError } = await supabase
            .from('emergency_fund_transactions')
            .select('*')
            .order('created_at', { ascending: false });

        console.log('Transactions Count:', trans?.length || 0);
        console.log('Latest Transactions:', trans?.slice(0, 5));

        console.log('----------------------------');
    }

    testEmergencyFund();

} catch (e) {
    console.error('Error:', e);
}
