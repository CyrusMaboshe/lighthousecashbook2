import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

try {
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
  const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
  }

  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, supabaseKey);

  async function verify() {
    console.log('\n--- VERIFICATION OF RESERVE WITHDRAWAL BALANCE FUNCTIONALITY ---');

    // 1. Check get_system_balance_status RPC
    console.log('\n1. Testing public.get_system_balance_status() RPC...');
    const { data: systemStatus, error: systemError } = await supabase.rpc('get_system_balance_status');
    if (systemError) {
      console.error('❌ Failed to execute get_system_balance_status():', systemError.message);
    } else {
      console.log('✅ Success! System balance status returns:');
      console.log(JSON.stringify(systemStatus, null, 2));
    }

    // 2. Check get_user_summary_report RPC
    console.log('\n2. Testing public.get_user_summary_report() RPC...');
    const { data: userSummary, error: userSummaryError } = await supabase.rpc('get_user_summary_report', { month_filter: null, year_filter: null });
    if (userSummaryError) {
      console.error('❌ Failed to execute get_user_summary_report():', userSummaryError.message);
    } else {
      console.log('✅ Success! User summary report returned', userSummary?.length, 'records.');
      if (userSummary && userSummary.length > 0) {
        console.log('Sample record:', JSON.stringify(userSummary[0], null, 2));
      }
    }

    // 3. Verify allocation constraint metadata if possible, or print configuration
    console.log('\n3. Fetching reserve investment configuration singleton...');
    const { data: config, error: configError } = await supabase
      .from('reserve_investment_config')
      .select('*')
      .eq('id', 'singleton')
      .single();

    if (configError) {
      console.error('❌ Failed to fetch reserve_investment_config:', configError.message);
    } else {
      console.log('✅ Success! Global Reserve Config:', JSON.stringify(config, null, 2));
    }

    // 4. Fetch allocations
    console.log('\n4. Fetching reserve investment allocations...');
    const { data: allocations, error: allocationsError } = await supabase
      .from('reserve_investment_allocations')
      .select('*')
      .limit(5);

    if (allocationsError) {
      console.error('❌ Failed to fetch allocations:', allocationsError.message);
    } else {
      console.log('✅ Success! Allocations count:', allocations?.length);
      if (allocations && allocations.length > 0) {
        console.log('Sample allocation:', JSON.stringify(allocations[0], null, 2));
      }
    }

    console.log('\n---------------------------------------------------------------');
  }

  verify();

} catch (e) {
  console.error('Error running verification script:', e);
}
