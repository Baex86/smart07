// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Narik variabel dari .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validasi darurat biar gampang nge-debug kalau lupa ngisi .env
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables. Pastikan .env.local sudah diisi."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);