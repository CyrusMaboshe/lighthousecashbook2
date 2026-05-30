import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

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
    const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials in .env');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    async function check() {
        console.log('🔍 Checking database functions...');

        // Check get_mt_company_period_stats
        const dummyUuid = '00000000-0000-0000-0000-000000000000';
        const { data: periodStats, error: periodStatsError } = await supabase.rpc('get_mt_company_period_stats', {
            p_company_id: dummyUuid,
            p_start_date: '2026-05-01',
            p_end_date: '2026-05-31'
        });

        if (periodStatsError) {
            console.error('❌ get_mt_company_period_stats RPC failed:', periodStatsError.message);
        } else {
            console.log('✅ get_mt_company_period_stats RPC exists!');
        }

        // Check get_mt_company_transaction_stats
        const { data: txStats, error: txStatsError } = await supabase.rpc('get_mt_company_transaction_stats', {
            p_company_id: dummyUuid
        });

        if (txStatsError) {
            console.error('❌ get_mt_company_transaction_stats RPC failed:', txStatsError.message);
        } else {
            console.log('✅ get_mt_company_transaction_stats RPC exists!');
        }

        // Check create_default_mt_company_categories
        const { data: defaultCats, error: defaultCatsError } = await supabase.rpc('create_default_mt_company_categories', {
            p_company_id: dummyUuid,
            p_created_by_username: 'test'
        });

        if (defaultCatsError) {
            // Note: If the function doesn't exist, we'll get a specific error message.
            // If it exists, it might fail if we violate UUID constraint, but here dummyUuid is valid format.
            console.log('Category RPC Response:', defaultCatsError.message);
            if (defaultCatsError.message.includes('does not exist')) {
                console.error('❌ create_default_mt_company_categories RPC does NOT exist!');
            } else {
                console.log('✅ create_default_mt_company_categories RPC exists!');
            }
        } else {
            console.log('✅ create_default_mt_company_categories RPC exists!');
        }
    }

    check();

} catch (e) {
    console.error('Error:', e);
}
