import { getApiBase } from './apiBase'

const base = () => getApiBase()

export type AnonLetter = { id: string; text: string; created_at: number }

export type AnonymousSessionResponse = {
  anon_id: string
  letters: AnonLetter[]
  latest: AnonLetter | null
  updated_at: number | null
}

/**
 * 익명 편지 임시 저장. `anonId`가 없으면 서버가 새 ID를 발급합니다.
 */
export async function postAnonymousLetter(
  anonId: string | null,
  text: string,
): Promise<{ anon_id: string; letter_id: string; updated_at: number }> {
  const body: { text: string; anon_id?: string } = { text }
  if (anonId) body.anon_id = anonId
  const res = await fetch(`${base()}/api/anonymous/letters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(j.error || `저장 실패 (${res.status})`)
  }
  return (await res.json()) as { anon_id: string; letter_id: string; updated_at: number }
}

export async function fetchAnonymousSession(anonId: string): Promise<AnonymousSessionResponse> {
  const res = await fetch(`${base()}/api/anonymous/letters/${encodeURIComponent(anonId)}`)
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(j.error || `불러오기 실패 (${res.status})`)
  }
  return (await res.json()) as AnonymousSessionResponse
}
