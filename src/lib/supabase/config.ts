const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function normalizeSupabaseUrl(url: string): string {
  return url.replace("https://rrrynrtsbflywrsnjwdfs.supabase.co", "https://rrynrtsbflywrsnjwdfs.supabase.co");
}
