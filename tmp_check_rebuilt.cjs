
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fbsceogmrqmfapjwztqy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZic2Nlb2dtcnFtZmFwand6dHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTcwNDAsImV4cCI6MjA2NTQzMzA0MH0.40v9bSnIIl7n5-n3uCbzT5G51V0CtUKowgYvcaVdIDI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRebuilt() {
    console.log('Checking rebuilt_profiles...');

    // Try to get one record without RLS (using service role would be better but we don't have it)
    // Since we only have anon key, we are subject to RLS.

    // Let's try to list ALL functions in the database to see if there's an is_admin function that's broken.
    // We can't do that with anon key.

    // Let's try to see if we can at least get the error message in more detail.
    const { error } = await supabase.from('rebuilt_profiles').select('*').limit(1);
    console.log('Error status:', error);
}

checkRebuilt();
