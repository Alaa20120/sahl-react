import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Custom fetch with 10s timeout
const fetchWithTimeout = (url: RequestInfo | URL, options?: RequestInit) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer))
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: fetchWithTimeout },
  }
)

export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey
}

// Direct fetch helper — bypasses supabase-js for reliability
export async function supaFetch(
  table: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    filter?: string   // e.g. 'id=eq.DEL-001'
    body?: object
    select?: string
    limit?: number
  } = {}
): Promise<any> {
  const { method = 'GET', filter = '', body, select = '*', limit } = options

  const base = `${supabaseUrl}/rest/v1/${table}`
  const params = new URLSearchParams()
  if (method === 'GET' || method === 'DELETE' || method === 'PATCH') {
    params.set('select', select)
  }
  if (filter) filter.split('&').forEach(f => { const [k, v] = f.split('='); if (k && v) params.set(k, v) })
  if (limit) params.set('limit', String(limit))

  const url = `${base}?${params.toString()}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)

  const headers: Record<string, string> = {
    'apikey': supabaseAnonKey || '',
    'Authorization': `Bearer ${supabaseAnonKey || ''}`,
    'Content-Type': 'application/json',
  }
  if (method === 'POST') headers['Prefer'] = 'return=representation'
  if (method === 'PATCH') headers['Prefer'] = 'return=representation'

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (method === 'DELETE') return null
    const text = await res.text()
    if (!text) return null
    const json = JSON.parse(text)
    if (!res.ok) throw new Error(json?.message || json?.error || `HTTP ${res.status}`)
    return json
  } catch (e: any) {
    clearTimeout(timer)
    if (e.name === 'AbortError') throw new Error('انتهت مهلة الاتصال بـ Supabase')
    throw e
  }
}
