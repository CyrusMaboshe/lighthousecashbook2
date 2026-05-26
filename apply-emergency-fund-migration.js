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

async function applyEmergencyFundMigration() {
    console.log('\n🚀 Applying Emergency Fund Migration...\n');

    const migrationPath = join(__dirname, 'supabase', 'migrations', '20260216000000-create-emergency-fund.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded successfully');
    console.log('📊 SQL Preview (first 300 chars):');
    console.log(sql.substring(0, 300) + '...\n');

    console.log('⚠️  IMPORTANT: The Supabase JS client cannot execute raw SQL directly.');
    console.log('Please follow these steps:\n');
    console.log('1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/fbsceogmrqmfapjwztqy');
    console.log('2. Navigate to: SQL Editor (left sidebar)');
    console.log('3. Click "New Query"');
    console.log('4. Copy the SQL below and paste it into the editor');
    console.log('5. Click "Run" to execute\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('SQL TO EXECUTE:');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(sql);
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('\n✅ After running the SQL, your Emergency Fund will be fully functional!');
}

applyEmergencyFundMigration().catch(console.error);
