import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True once real Supabase credentials have been provided (see .env.example). */
export const isOnlineConfigured = Boolean(
  url && anonKey && !url.includes("your-project") && !anonKey.includes("your-anon"),
);

/**
 * Lazily-created singleton. Only call this after checking
 * `isOnlineConfigured` — with placeholder credentials the client
 * constructs fine but every network call will fail.
 */
let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createClient(url, anonKey);
  }
  return client;
}
