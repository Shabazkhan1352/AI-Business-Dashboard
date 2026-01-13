// NEW FILE: This file creates and exports a single, reusable Supabase client instance.
// This is a best practice to ensure you are not creating multiple connections.
import { createClient } from '@supabase/supabase-js'

// These environment variables should be in a `.env.local` file in your frontend root.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    // This error will be shown in the server console if the variables are missing.
    console.error("Supabase URL and Anon Key are missing. Please check your .env.local file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

