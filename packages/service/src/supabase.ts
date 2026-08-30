// ─── Shared Supabase admin client ────────────────────────────────────────────
// Single instance reused by store.ts, runnerHub.ts, etc.
// Returns null when env vars are absent so callers can handle the no-Supabase case.
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const supabase: SupabaseClient | null =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    : null;
