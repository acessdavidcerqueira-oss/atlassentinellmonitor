"use client";

import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

let browserClient: SupabaseClient | null = null;

export function createBrowserSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClient;
}

export function createEphemeralSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
