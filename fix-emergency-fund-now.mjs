// Direct cleanup: remove test transactions by ID and fix balance
const SUPABASE_URL = 'https://fbsceogmrqmfapjwztqy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZic2Nlb2dtcnFtZmFwand6dHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTcwNDAsImV4cCI6MjA2NTQzMzA0MH0.40v9bSnIIl7n5-n3uCbzT5G51V0CtUKowgYvcaVdIDI';

const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
};

async function get(path) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { headers });
    return res.json();
}

async function del(path) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { method: 'DELETE', headers: { ...headers, 'Prefer': 'return=minimal' } });
    return res.status;
}

async function rpc(funcName, params = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${funcName}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });
    return res.json();
}

async function main() {
    console.log('🔧 Final Emergency Fund Fix\n');

    // Get ALL EF transactions to show full list
    const allEfTxs = await get('/emergency_fund_transactions?select=*&order=created_at.asc');
    console.log('All Emergency Fund Transactions:');
    let balance = 0;
    for (const tx of allEfTxs) {
        const sign = tx.action_type === 'deposit' ? '+' : '-';
        balance += tx.action_type === 'deposit' ? Number(tx.amount) : -Number(tx.amount);
        console.log(`  [${tx.id.substring(0, 8)}...] ${sign}ZMW ${tx.amount} | "${tx.note}" | ${tx.initiating_user} | ${new Date(tx.created_at).toLocaleString()}`);
    }
    console.log(`\nNet balance from history: ZMW ${balance.toFixed(2)}`);

    // Current stored balance
    const storedBalances = await get('/emergency_fund_balance?select=*');
    console.log(`Stored balance: ZMW ${storedBalances[0]?.current_balance}`);
    console.log(`Balance records: ${storedBalances.length}`);

    // Identify test transactions to remove (created by our diagnostic scripts today)
    // These are from 2026-02-19 with notes from our test scripts
    const testNoteKeywords = ['System connectivity test', 'Test 210 deposit diagnostic', 'System balance sync', 'Balance correction'];

    console.log('\n🗑️  Removing test/diagnostic transactions...');
    let removed = 0;
    for (const tx of allEfTxs) {
        const isTest = testNoteKeywords.some(kw => tx.note && tx.note.includes(kw));
        if (isTest) {
            console.log(`  Removing: "${tx.note}" (${tx.action_type} ZMW ${tx.amount})`);
            const status = await del(`/emergency_fund_transactions?id=eq.${tx.id}`);
            console.log(`    Status: ${status}`);
            // Also remove paired main system transaction
            const mainMatches = await get(`/transactions?select=id,type,amount,details&added_by=eq.${encodeURIComponent(tx.initiating_user)}&order=created_at.desc&limit=5`);
            for (const mt of mainMatches) {
                if (mt.details && (mt.details.includes('System connectivity test') || mt.details.includes('Test 210 deposit diagnostic') || mt.details.includes('System balance sync') || mt.details.includes('Balance correction'))) {
                    const mtStatus = await del(`/transactions?id=eq.${mt.id}`);
                    console.log(`    Main tx removed: ${mt.type} ZMW ${mt.amount} (${mtStatus})`);
                    removed++;
                }
            }
            removed++;
        }
    }
    console.log(`Removed ${removed} test records.`);

    // Recalculate balance from real transactions
    const realTxs = await get('/emergency_fund_transactions?select=*&order=created_at.asc');
    let realBalance = 0;
    console.log('\n✅ Real EF Transactions remaining:');
    for (const tx of realTxs) {
        const sign = tx.action_type === 'deposit' ? '+' : '-';
        realBalance += tx.action_type === 'deposit' ? Number(tx.amount) : -Number(tx.amount);
        console.log(`  ${sign}ZMW ${tx.amount} | "${tx.note}" | ${tx.initiating_user}`);
    }
    console.log(`\n📊 Real balance should be: ZMW ${realBalance.toFixed(2)}`);

    // Fix the stored balance to match reality
    const storedBal = Number(storedBalances[0]?.current_balance ?? 0);
    const diff = realBalance - storedBal;

    console.log(`Stored: ${storedBal}, Real: ${realBalance}, Diff: ${diff.toFixed(2)}`);

    if (Math.abs(diff) > 0.001) {
        if (diff < 0) {
            // Need to decrease stored balance
            console.log('\nWithdrawing excess from balance...');
            const r = await rpc('withdraw_from_emergency_fund', {
                amount_param: Math.abs(diff),
                note_param: '__balance_correction__',
                transaction_date: new Date().toISOString().split('T')[0],
                user_username: 'System'
            });
            console.log('Result:', JSON.stringify(r));
            if (r.success) {
                const ct = await get('/emergency_fund_transactions?note=eq.__balance_correction__&select=id');
                if (ct.length) await del(`/emergency_fund_transactions?id=eq.${ct[0].id}`);
                const cm = await get('/transactions?details=like.*__balance_correction__*&select=id');
                if (cm.length) await del(`/transactions?id=eq.${cm[0].id}`);
                console.log('Balance corrected successfully.');
            }
        } else if (diff > 0) {
            // Need to increase stored balance
            console.log('\nDepositing to fix balance...');
            const r = await rpc('deposit_to_emergency_fund', {
                amount_param: diff,
                note_param: '__balance_correction__',
                transaction_date: new Date().toISOString().split('T')[0],
                user_username: 'System'
            });
            console.log('Result:', JSON.stringify(r));
            if (r.success) {
                const ct = await get('/emergency_fund_transactions?note=eq.__balance_correction__&select=id');
                if (ct.length) await del(`/emergency_fund_transactions?id=eq.${ct[0].id}`);
                const cm = await get('/transactions?details=like.*__balance_correction__*&select=id');
                if (cm.length) await del(`/transactions?id=eq.${cm[0].id}`);
                console.log('Balance corrected successfully.');
            }
        }
    } else {
        console.log('Balance is already correct!');
    }

    // FINAL CHECK
    const finalBal = await get('/emergency_fund_balance?select=*');
    const finalTxs = await get('/emergency_fund_transactions?select=*&order=created_at.asc');
    let fb = 0;
    for (const tx of finalTxs) fb += tx.action_type === 'deposit' ? Number(tx.amount) : -Number(tx.amount);

    console.log('\n🎯 ===== FINAL STATE =====');
    console.log(`Stored Balance: ZMW ${finalBal[0]?.current_balance ?? 0}`);
    console.log(`Transaction Net: ZMW ${fb.toFixed(2)}`);
    console.log(`Transaction Count: ${finalTxs.length}`);
    console.log('\n✨ Refresh your browser now!');
}

main().catch(console.error);
