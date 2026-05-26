
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fbsceogmrqmfapjwztqy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZic2Nlb2dtcnFtZmFwand6dHF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NTcwNDAsImV4cCI6MjA2NTQzMzA0MH0.40v9bSnIIl7n5-n3uCbzT5G51V0CtUKowgYvcaVdIDI'

export const supabase = createClient(supabaseUrl, supabaseKey)
