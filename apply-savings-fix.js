// Helper script to guide you through applying the savings balance fix
import { readFileSync } from 'fs';

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║     SAVINGS BALANCE FIX - MIGRATION INSTRUCTIONS              ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Read .env to get Supabase URL
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

if (!supabaseUrl) {
    console.error('❌ Could not find VITE_SUPABASE_URL in .env file');
    process.exit(1);
}

// Extract project reference from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('📋 STEP 1: Open Supabase SQL Editor');
console.log('─────────────────────────────────────────────────────────────\n');

if (projectRef) {
    const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
    console.log(`   Open this URL in your browser:`);
    console.log(`   ${sqlEditorUrl}\n`);
} else {
    console.log(`   Go to: ${supabaseUrl.replace('/rest/v1', '')}`);
    console.log(`   Then navigate to: SQL Editor → New Query\n`);
}

console.log('📄 STEP 2: Copy the Migration SQL');
console.log('─────────────────────────────────────────────────────────────\n');
console.log('   The migration file is located at:');
console.log('   supabase/migrations/20251130000003-consolidated-savings-balance-fix.sql\n');

console.log('   Copy the ENTIRE contents of this file.\n');

console.log('▶️  STEP 3: Run the Migration');
console.log('─────────────────────────────────────────────────────────────\n');
console.log('   1. Paste the SQL into the Supabase SQL Editor');
console.log('   2. Click "Run" or press Ctrl+Enter');
console.log('   3. Wait for "Success. No rows returned" message\n');

console.log('✅ STEP 4: Verify the Migration');
console.log('─────────────────────────────────────────────────────────────\n');
console.log('   Run this command to test:');
console.log('   node test-savings-balance.js\n');

console.log('   Expected: All tests should pass ✅\n');

console.log('🌐 STEP 5: Test in Browser');
console.log('─────────────────────────────────────────────────────────────\n');
console.log('   1. Start dev server: npm run dev');
console.log('   2. Navigate to Savings tab');
console.log('   3. Try "Save Money" - balance should update instantly');
console.log('   4. Try "Withdraw Money" - balance should update instantly\n');

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║  Need help? Check walkthrough.md in the artifacts folder     ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Read and display the SQL file content
console.log('\n📄 MIGRATION SQL CONTENT (copy this):');
console.log('═'.repeat(65));
console.log('\n');

const sqlContent = readFileSync('supabase/migrations/20251130000003-consolidated-savings-balance-fix.sql', 'utf-8');
console.log(sqlContent);

console.log('\n');
console.log('═'.repeat(65));
console.log('✅ Copy the SQL above and paste it into Supabase SQL Editor\n');
