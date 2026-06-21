import { createClient } from '@supabase/supabase-js'

let _client: ReturnType<typeof createClient> | null = null

// Browser-side Supabase client — uses the public anon key, safe to expose.
// Used only for Realtime subscriptions; data fetching goes through API routes.
export function getBrowserSupabase() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    )
  }
  return _client
}
