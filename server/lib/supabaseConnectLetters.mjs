import { createClient } from '@supabase/supabase-js'

let _client

function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url.trim() || !key.trim()) return null
  if (!_client) {
    _client = createClient(url.trim(), key.trim(), {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return _client
}

/**
 * @param {{ user_email: string, letter_content: string, device_id?: string | null, user_id?: string | null }} row
 */
export async function insertConnectLetter(row) {
  const supabase = getServiceClient()
  if (!supabase) {
    return { ok: false, error: 'supabase_not_configured', detail: null }
  }
  const payload = {
    user_email: row.user_email.trim().toLowerCase(),
    letter_content: row.letter_content,
    device_id: row.device_id?.trim() || null,
    user_id: row.user_id && /^[0-9a-f-]{36}$/i.test(row.user_id) ? row.user_id : null,
  }
  const { data, error } = await supabase
    .from('connect_letters')
    .insert(payload)
    .select('id, created_at')
    .single()
  if (error) {
    return { ok: false, error: error.message, detail: error }
  }
  return { ok: true, id: data.id, created_at: data.created_at }
}

/**
 * @param {string} deviceId
 */
export async function listConnectLettersByDevice(deviceId) {
  const supabase = getServiceClient()
  if (!supabase) {
    return { ok: false, error: 'supabase_not_configured', letters: [] }
  }
  const { data, error } = await supabase
    .from('connect_letters')
    .select('id, user_id, user_email, letter_content, device_id, created_at')
    .eq('device_id', deviceId.trim())
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) {
    return { ok: false, error: error.message, letters: [] }
  }
  return { ok: true, letters: data ?? [] }
}
