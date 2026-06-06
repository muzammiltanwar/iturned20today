import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and anon public API key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const isSupabaseConfigured = supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

// Export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
