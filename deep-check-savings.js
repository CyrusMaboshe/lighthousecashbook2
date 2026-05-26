import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

console.log('🔍 Deep Dive: Savings Transactions Investigation...\n');

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
    const serviceKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials');
        process.exit(1);
    }

    // Try with service role key if available
    const supabase = createClient(supabaseUrl, serviceKey || supabaseKey);

    async function investigate() {
        console.log('1️⃣  Checking with SERVICE ROLE key (bypasses RLS)...\n');

        // Direct query with service role
        const { data: allTransactions, error: allError } = await supabase
            .from('savings_transactions')
            .select('*')
            .order('created_at', { ascending: false });

        if (allError) {
            console.log('   ❌ Error:', allError.message);
        } else {
            console.log(`   ✅ Found ${allTransactions?.length || 0} transactions with service role`);
            if (allTransactions && allTransactions.length > 0) {
                console.log('\n   📝 All transactions:');
                allTransactions.forEach((t, i) => {
                    console.log(`      ${i + 1}. ID: ${t.id.substring(0, 8)}...`);
                    console.log(`         Type: ${t.action_type}`);
                    console.log(`         Amount: ZMW ${t.amount}`);
                    console.log(`         Date: ${t.date}`);
                    console.log(`         User: ${t.initiating_user}`);
                    console.log(`         Created: ${t.created_at}`);
                    console.log('');
                });
            }
        }

        console.log('\n2️⃣  Checking table structure...\n');

        // Get table columns
        let columns = null;
        try {
            const { data, error } = await supabase
                .rpc('exec_sql', {
                    sql: `SELECT column_name, data_type, is_nullable 
                          FROM information_schema.columns 
                          WHERE table_name = 'savings_transactions' 
                          AND table_schema = 'public'
                          ORDER BY ordinal_position;`
                });

            if (!error) {
                columns = data;
            }
        } catch (e) {
            // Fallback: just describe what we know
            console.log('   ℹ️  (Could not query schema details directly)');
        }

        if (columns) {
            console.log('   Table columns:', columns);
        } else {
            console.log('   ℹ️  Known columns from schema:');
            console.log('      - id (uuid)');
            console.log('      - action_type (text)');
            console.log('      - amount (numeric)');
            console.log('      - description (text)');
            console.log('      - initiating_user (text)');
            console.log('      - initiating_user_id (uuid)');
            console.log('      - balance_before (numeric)');
            console.log('      - balance_after (numeric)');
            console.log('      - date (date)');
            console.log('      - time (time)');
            console.log('      - created_at (timestamp)');
            console.log('      - updated_at (timestamp)');
        }

        console.log('\n3️⃣  Checking RLS policies...\n');

        const { data: policies, error: polError } = await supabase
            .from('pg_policies')
            .select('*')
            .eq('tablename', 'savings_transactions')
            .eq('schemaname', 'public');

        if (polError) {
            console.log('   ⚠️  Cannot query policies:', polError.message);
        } else if (policies && policies.length > 0) {
            console.log(`   📋 Found ${policies.length} RLS policies:`);
            policies.forEach((p, i) => {
                console.log(`\n      Policy ${i + 1}: ${p.policyname}`);
                console.log(`         Command: ${p.cmd}`);
                console.log(`         Permissive: ${p.permissive}`);
                console.log(`         Roles: ${p.roles}`);
                console.log(`         Using: ${p.qual || '(none)'}`);
                console.log(`         With Check: ${p.with_check || '(none)'}`);
            });
        } else {
            console.log('   ⚠️  No RLS policies found!');
        }

        console.log('\n4️⃣  Testing with anon key (simulating frontend)...\n');

        const anonSupabase = createClient(supabaseUrl, supabaseKey);
        const { data: anonTrans, error: anonError } = await anonSupabase
            .from('savings_transactions')
            .select('*')
            .order('created_at', { ascending: false });

        if (anonError) {
            console.log('   ❌ Error with anon key:', anonError.message);
            console.log('   🔧 This explains why the frontend can\'t see transactions!');
        } else {
            console.log(`   ✅ Anon key can see ${anonTrans?.length || 0} transactions`);
        }

        console.log('\n' + '='.repeat(70));
        console.log('\n📋 DIAGNOSIS\n');

        if (allTransactions && allTransactions.length > 0 && (!anonTrans || anonTrans.length === 0)) {
            console.log('❌ PROBLEM IDENTIFIED:');
            console.log('   - Transactions exist in the database (service role can see them)');
            console.log('   - But the frontend cannot access them (anon key blocked)');
            console.log('   - This is an RLS (Row Level Security) policy issue');
            console.log('\n🔧 SOLUTION:');
            console.log('   Run the SQL in FIX_SAVINGS_TRANSACTIONS.sql to fix RLS policies');
        } else if (!allTransactions || allTransactions.length === 0) {
            console.log('ℹ️  No transactions in database');
            console.log('   This is normal if you haven\'t made any deposits/withdrawals yet');
        } else {
            console.log('✅ Everything looks good!');
            console.log('   Transactions are accessible from the frontend');
        }

        console.log('\n');
    }

    investigate();

} catch (e) {
    console.error('❌ Error:', e.message);
}
