// Helper script to guide you through applying the multi-tenant period stats function to your Supabase project.
import { readFileSync } from 'fs';

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║   MULTI-TENANT STATS OPTIMIZATION MIGRATION INSTRUCTIONS      ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Read .env to get Supabase URL
let envContent = '';
try {
    envContent = readFileSync('.env', 'utf-8');
} catch (e) {
    console.error('⚠️ Could not read .env file');
}

const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let value = match[2].trim();
        value = value.replace(/^["']|["']$/g, '');
        envVars[match[1].trim()] = value;
    }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL || 'https://fbsceogmrqmfapjwztqy.supabase.co';
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'fbsceogmrqmfapjwztqy';

console.log('📋 STEP 1: Open Supabase SQL Editor');
console.log('─────────────────────────────────────────────────────────────\n');
const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
console.log(`   Open this URL in your browser:`);
console.log(`   ${sqlEditorUrl}\n`);

console.log('📄 STEP 2: Copy the Migration SQL');
console.log('─────────────────────────────────────────────────────────────\n');
console.log('   The migration file is located at:');
console.log('   supabase/migrations/20260530000002-add-mt-period-stats.sql\n');
console.log('   Copy the ENTIRE contents of this file.\n');

console.log('▶️  STEP 3: Run the Migration');
console.log('─────────────────────────────────────────────────────────────\n');
console.log('   1. Paste the SQL into the Supabase SQL Editor');
console.log('   2. Click "Run" or press Ctrl+Enter');
console.log('   3. Wait for the success confirmation\n');

console.log('✅ STEP 4: Verify the Migration');
console.log('─────────────────────────────────────────────────────────────\n');
console.log('   Run this command to test:');
console.log('   node check-migration.js\n');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║  Need help? Check walkthrough.md in the brain/artifacts folder║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

console.log('\n📄 MIGRATION SQL CONTENT (copy this):');
console.log('═'.repeat(65));
console.log('\n');

try {
    const sqlContent = readFileSync('supabase/migrations/20260530000002-add-mt-period-stats.sql', 'utf-8');
    console.log(sqlContent);
} catch (e) {
    console.error('❌ Could not read the SQL migration file. Make sure it exists at:');
    console.error('   supabase/migrations/20260530000002-add-mt-period-stats.sql');
}

console.log('\n');
console.log('═'.repeat(65));
console.log('✅ Copy the SQL above, paste it in Supabase, and run it!\n');
