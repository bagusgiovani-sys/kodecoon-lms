// The requested demo is the default. Explicitly set false to restore Supabase.
export function isMockMode() {
  return process.env.NEXT_PUBLIC_MOCK_MODE !== 'false'
}
