// Check what happened when user tried to save money
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
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

async function checkSavingsData() {
    console.log('🔍 Checking Savings Data After Save Attempt\n');
    console.log('='.repeat(60));

    // Check savings_transactions
    console.log('\n📋 Checking savings_transactions table:');
    const { data: transactions, error: transError } = await supabase
        .from('savings_transactions')
        .select('*')
        .order('created_at', { ascending: false });

    if (transError) {
        console.error('❌ Error:', transError.message);
    } else {
        console.log(`✅ Found ${transactions?.length || 0} transactions`);
        if (transactions && transactions.length > 0) {
            console.log('\nTransactions:');
            transactions.forEach((t, i) => {
                console.log(`  ${i + 1}. ${t.action_type}: ZMW ${t.amount}`);
                console.log(`     Before: ${t.balance_before}, After: ${t.balance_after}`);
                console.log(`     Date: ${t.created_at}`);
            });
        } else {
            console.log('  ⚠️  No transactions found - the deposit might have failed');
        }
    }

    // Check savings_balance table
    console.log('\n💰 Checking savings_balance table:');
    const { data: balance, error: balanceError } = await supabase
        .from('savings_balance')
        .select('*');

    if (balanceError) {
        console.error('❌ Error:', balanceError.message);
    } else {
        console.log(`✅ Found ${balance?.length || 0} records`);
        if (balance && balance.length > 0) {
            balance.forEach((b, i) => {
                console.log(`  ${i + 1}. Balance: ZMW ${b.current_balance}`);
                console.log(`     Last Updated: ${b.last_updated}`);
                console.log(`     Updated By: ${b.updated_by}`);
            });
        } else {
            console.log('  ⚠️  No balance record found');
        }
    }

    // Check main transactions for savings-related entries
    console.log('\n📊 Checking main transactions for savings transfers:');
    const { data: mainTrans, error: mainError } = await supabase
        .from('transactions')
        .select('*')
        .or('category_name.eq.Savings Transfer,details.ilike.%Savings%')
        .order('created_at', { ascending: false })
        .limit(5);

    if (mainError) {
        console.error('❌ Error:', mainError.message);
    } else {
        console.log(`✅ Found ${mainTrans?.length || 0} savings-related transactions`);
        if (mainTrans && mainTrans.length > 0) {
            mainTrans.forEach((t, i) => {
                console.log(`  ${i + 1}. ${t.type}: ZMW ${t.amount}`);
                console.log(`     Details: ${t.details}`);
                console.log(`     Date: ${t.created_at}`);
            });
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n🔍 DIAGNOSIS:');

    if (!transactions || transactions.length === 0) {
        console.log('❌ No savings transactions were created');
        console.log('   This means the deposit_to_savings() function likely failed');
        console.log('   OR the migration was not applied to create the function');
    }

    console.log('\n⚠️  CRITICAL: The get_current_savings_balance() function');
    console.log('   does NOT exist in your database!');
    console.log('\n📝 ACTION REQUIRED:');
    console.log('   1. Open Supabase SQL Editor');
    console.log('   2. Run the migration SQL');
    console.log('   3. Try saving money again');
    console.log('\n');
}

checkSavingsData().catch(console.error);
