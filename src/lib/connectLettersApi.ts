import { getApiBase } from './apiBase'
import { getAuthToken } from './authStorage'

export type SaveConnectLetterInput = {
  user_email: string
  letter_content: string
  device_id?: string | null
}

export async function saveConnectLetter(input: SaveConnectLetterInput): Promise<{
  ok: boolean
  id?: string
  created_at?: string
}> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getAuthToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${getApiBase()}/api/connect/letters`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_email: input.user_email.trim(),
      letter_content: input.letter_content,
      device_id: input.device_id?.trim() || null,
    }),
  })

  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean
    id?: string
    created_at?: string
    error?: string
  }

  if (!res.ok) {
    throw new Error(data.error || `저장 실패 (${res.status})`)
  }

  return { ok: true, id: data.id, created_at: data.created_at }
}
