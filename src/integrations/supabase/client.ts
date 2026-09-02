// This file initializes a standard Supabase client
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function createSupabaseClient() {
  const SUPABASE_URL = import.meta.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL'];
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || process.env['SUPABASE_PUBLISHABLE_KEY'];

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.warn("[Supabase] Missing environment variables VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Please provide them to connect to your Supabase project.");
    // We return a dummy client or throw an error based on your preference. 
    // Throwing so it behaves similarly to before, but with a standard message.
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});

