// Test script to verify savings balance implementation
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let value = match[2].trim();
        // Remove quotes if present
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

async function testSavingsBalance() {
    console.log('🔍 Testing Savings Balance Implementation\n');
    console.log('='.repeat(60));

    // Test 1: Check if get_current_savings_balance function exists and works
    console.log('\n📊 Test 1: Calling get_current_savings_balance()');
    const { data: balanceData, error: balanceError } = await supabase.rpc('get_current_savings_balance');

    if (balanceError) {
        console.error('❌ Error calling get_current_savings_balance():', balanceError);
        console.log('\n⚠️  This likely means the migration has not been applied.');
        console.log('   Please run the migration: 20251130000002-add-calculate-savings-balance-function.sql');
    } else {
        console.log('✅ Function exists and returned data:');
        console.log(JSON.stringify(balanceData, null, 2));
    }

    // Test 2: Check savings_transactions table
    console.log('\n📋 Test 2: Fetching savings_transactions');
    const { data: transactions, error: transError } = await supabase
        .from('savings_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (transError) {
        console.error('❌ Error fetching savings_transactions:', transError);
    } else {
        console.log(`✅ Found ${transactions?.length || 0} transactions`);
        if (transactions && transactions.length > 0) {
            console.log('\nRecent transactions:');
            transactions.forEach((t, i) => {
                console.log(`  ${i + 1}. ${t.action_type.toUpperCase()}: ZMW ${t.amount} (Balance: ${t.balance_after})`);
            });
        }
    }

    // Test 3: Manual calculation verification
    console.log('\n🧮 Test 3: Manual Balance Calculation');
    if (transactions) {
        const deposits = transactions
            .filter(t => t.action_type === 'deposit')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const withdrawals = transactions
            .filter(t => t.action_type === 'withdrawal')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const calculatedBalance = deposits - withdrawals;

        console.log(`  Total Deposits: ZMW ${deposits.toFixed(2)}`);
        console.log(`  Total Withdrawals: ZMW ${withdrawals.toFixed(2)}`);
        console.log(`  Calculated Balance: ZMW ${calculatedBalance.toFixed(2)}`);

        if (balanceData) {
            const functionBalance = balanceData.current_balance;
            console.log(`  Function Balance: ZMW ${functionBalance}`);

            if (Math.abs(calculatedBalance - functionBalance) < 0.01) {
                console.log('  ✅ Balances match!');
            } else {
                console.log('  ⚠️  Balance mismatch detected!');
            }
        }
    }

    // Test 4: Check savings_balance table (old approach)
    console.log('\n🗄️  Test 4: Checking savings_balance table (legacy)');
    const { data: storedBalance, error: storedError } = await supabase
        .from('savings_balance')
        .select('*')
        .limit(1)
        .single();

    if (storedError) {
        console.error('❌ Error fetching savings_balance:', storedError);
    } else if (storedBalance) {
        console.log('✅ Stored balance record found:');
        console.log(`  Current Balance: ZMW ${storedBalance.current_balance}`);
        console.log(`  Last Updated: ${storedBalance.last_updated}`);
        console.log(`  Updated By: ${storedBalance.updated_by}`);

        if (balanceData) {
            const diff = Math.abs(storedBalance.current_balance - balanceData.current_balance);
            if (diff > 0.01) {
                console.log(`  ⚠️  Mismatch: Stored (${storedBalance.current_balance}) vs Calculated (${balanceData.current_balance})`);
            }
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test Complete\n');
}

testSavingsBalance().catch(console.error);
