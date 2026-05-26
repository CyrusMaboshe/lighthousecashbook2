// Script to apply SQL migrations directly to Supabase
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration(filename) {
  console.log(`\n📄 Applying migration: ${filename}`);
  
  const migrationPath = join(__dirname, 'supabase', 'migrations', filename);
  const sql = readFileSync(migrationPath, 'utf-8');
  
  console.log('SQL Preview:', sql.substring(0, 200) + '...');
  
  // Note: Supabase JS client doesn't support raw SQL execution
  // We need to use the REST API or Supabase CLI
  console.log('⚠️  Cannot execute raw SQL via JS client');
  console.log('Please run this SQL in Supabase SQL Editor:');
  console.log('---');
  console.log(sql);
  console.log('---');
}

async function testSavingsBalance() {
  console.log('\n🔍 Testing savings balance query...');
  
  const { data, error } = await supabase
    .from('savings_balance')
    .select('*');
  
  if (error) {
    console.error('❌ Error fetching savings balance:', error);
  } else {
    console.log('✅ Savings balance data:', data);
  }
}

async function testSavingsTransactions() {
  console.log('\n🔍 Testing savings transactions query...');
  
  const { data, error } = await supabase
    .from('savings_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('❌ Error fetching savings transactions:', error);
  } else {
    console.log('✅ Savings transactions data:', data);
  }
}

async function main() {
  console.log('🚀 Starting migration application...');
  
  await applyMigration('20251130000000-fix-savings-deposit.sql');
  await applyMigration('20251130000001-fix-savings-rls.sql');
  
  await testSavingsBalance();
  await testSavingsTransactions();
}

main().catch(console.error);
