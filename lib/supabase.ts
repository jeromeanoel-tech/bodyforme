import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
    )
  }
  return _client
}

// Proxy so callers can write `supabase.from(...)` without change.
// The actual client is created on first use, not at module load time.
// eslint-disable-next-line
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as any)[prop]
  },
})
