import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

console.log('🔍 Checking Savings Transactions Status...\n');

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
        console.error('❌ Missing Supabase credentials in .env file');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    async function checkStatus() {
        console.log('📊 Database Status Check\n');
        console.log('='.repeat(60));

        // Check savings_transactions table
        console.log('\n1️⃣  Checking savings_transactions table...');
        const { data: transactions, error: transError, count } = await supabase
            .from('savings_transactions')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .limit(5);

        if (transError) {
            console.log('   ❌ ERROR accessing savings_transactions:');
            console.log('   ', transError.message);
            console.log('\n   🔧 This is likely an RLS (Row Level Security) policy issue.');
            console.log('   📋 Solution: Run the SQL in FIX_SAVINGS_TRANSACTIONS.sql');
        } else {
            console.log(`   ✅ Successfully accessed savings_transactions`);
            console.log(`   📈 Total transactions: ${count || 0}`);
            if (transactions && transactions.length > 0) {
                console.log(`   📝 Latest ${transactions.length} transactions:`);
                transactions.forEach((t, i) => {
                    console.log(`      ${i + 1}. ${t.action_type.toUpperCase()} - ZMW ${t.amount} (${t.date})`);
                });
            } else {
                console.log('   ℹ️  No transactions found (table is empty)');
            }
        }

        // Check savings_balance table
        console.log('\n2️⃣  Checking savings_balance table...');
        const { data: balance, error: balanceError } = await supabase
            .from('savings_balance')
            .select('*')
            .limit(1)
            .single();

        if (balanceError) {
            if (balanceError.code === 'PGRST116') {
                console.log('   ⚠️  No balance record found (table is empty)');
            } else {
                console.log('   ❌ ERROR accessing savings_balance:');
                console.log('   ', balanceError.message);
                console.log('\n   🔧 This is likely an RLS (Row Level Security) policy issue.');
                console.log('   📋 Solution: Run the SQL in FIX_SAVINGS_TRANSACTIONS.sql');
            }
        } else {
            console.log('   ✅ Successfully accessed savings_balance');
            console.log(`   💰 Current Balance: ZMW ${balance.current_balance}`);
            console.log(`   🕐 Last Updated: ${balance.last_updated}`);
        }

        // Check RPC function
        console.log('\n3️⃣  Checking get_current_savings_balance function...');
        const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_current_savings_balance');

        if (rpcError) {
            console.log('   ❌ ERROR calling get_current_savings_balance:');
            console.log('   ', rpcError.message);
        } else {
            console.log('   ✅ Successfully called get_current_savings_balance');
            console.log('   📊 Result:', JSON.stringify(rpcData, null, 2));
        }

        console.log('\n' + '='.repeat(60));
        console.log('\n📋 SUMMARY\n');

        if (transError || (balanceError && balanceError.code !== 'PGRST116')) {
            console.log('❌ ISSUE DETECTED: RLS policies are blocking access');
            console.log('\n🔧 TO FIX:');
            console.log('   1. Open Supabase Dashboard → SQL Editor');
            console.log('   2. Copy contents of: FIX_SAVINGS_TRANSACTIONS.sql');
            console.log('   3. Paste and run the SQL');
            console.log('   4. Refresh your app');
            console.log('\n📖 See INSTRUCTIONS_FIX_SAVINGS.md for detailed steps');
        } else if (!transactions || transactions.length === 0) {
            console.log('✅ Database access is working correctly');
            console.log('ℹ️  No transactions found - this is normal if you haven\'t made any deposits/withdrawals yet');
            console.log('\n💡 TIP: Try making a deposit in the Savings tab to create your first transaction');
        } else {
            console.log('✅ Everything is working correctly!');
            console.log(`✅ Found ${count} transaction(s) in the database`);
            console.log('\n💡 If transactions still don\'t show in the UI:');
            console.log('   - Hard refresh the browser (Ctrl+Shift+R)');
            console.log('   - Check browser console for errors (F12)');
            console.log('   - Ensure you\'re logged in');
        }

        console.log('\n');
    }

    checkStatus();

} catch (e) {
    console.error('❌ Error:', e.message);
    console.log('\n📋 Make sure:');
    console.log('   - .env file exists and has VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY');
    console.log('   - You have internet connection');
    console.log('   - Supabase project is accessible');
}
