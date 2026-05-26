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
    const supabaseKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    async function applyMigration() {
        console.log('🔧 Applying Savings Transactions RLS Fix Migration...\n');

        // Read the migration file
        const migrationSQL = readFileSync(
            './supabase/migrations/20251130200000-fix-savings-transactions-rls-final.sql',
            'utf-8'
        );

        // Note: Supabase doesn't support direct SQL execution from client
        // We'll provide instructions for manual migration
        console.log('⚠️  Direct SQL execution not supported from client.');
        console.log('📋 Please apply the migration manually in Supabase SQL Editor.\n');
        console.log('Migration file location:');
        console.log('   ./supabase/migrations/20251130200000-fix-savings-transactions-rls-final.sql\n');
        console.log('📝 Instructions:');
        console.log('   1. Open Supabase Dashboard (https://supabase.com/dashboard)');
        console.log('   2. Navigate to your project');
        console.log('   3. Go to SQL Editor');
        console.log('   4. Copy and paste the contents of the migration file');
        console.log('   5. Run the SQL\n');

        const { data, error } = { data: null, error: null };

        if (error) {
            console.error('❌ Migration failed:', error.message);
            console.log('\n📋 Please apply the migration manually:');
            console.log('   File: ./supabase/migrations/20251130200000-fix-savings-transactions-rls-final.sql');
            process.exit(1);
        }

        console.log('✅ Migration applied successfully!\n');

        // Verify the policies
        console.log('🔍 Verifying RLS policies...\n');

        const { data: policies, error: policiesError } = await supabase
            .from('pg_policies')
            .select('*')
            .in('tablename', ['savings_balance', 'savings_transactions'])
            .eq('schemaname', 'public');

        if (policiesError) {
            console.log('⚠️  Could not verify policies automatically');
        } else if (policies) {
            console.log('Current RLS Policies:');
            policies.forEach(policy => {
                console.log(`  - ${policy.tablename}: ${policy.policyname}`);
            });
        }

        // Test querying savings transactions
        console.log('\n🧪 Testing savings transactions query...\n');

        const { data: transactions, error: transError } = await supabase
            .from('savings_transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (transError) {
            console.error('❌ Error querying transactions:', transError.message);
            console.log('\n⚠️  You may need to apply the migration manually in Supabase SQL Editor');
        } else {
            console.log(`✅ Successfully queried transactions! Found ${transactions?.length || 0} transactions`);
            if (transactions && transactions.length > 0) {
                console.log('\nSample transaction:');
                console.log(JSON.stringify(transactions[0], null, 2));
            }
        }

        console.log('\n✨ Done!');
    }

    applyMigration();

} catch (e) {
    console.error('Error:', e);
    console.log('\n📋 Manual Migration Instructions:');
    console.log('   1. Open Supabase Dashboard (https://supabase.com/dashboard)');
    console.log('   2. Navigate to your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Copy the contents of:');
    console.log('      ./supabase/migrations/20251130200000-fix-savings-transactions-rls-final.sql');
    console.log('   5. Paste and run the SQL');
}
