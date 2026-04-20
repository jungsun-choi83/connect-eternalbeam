import { getApiBase } from './apiBase'
import { getAuthToken } from './authStorage'

export type SendLetterResponse = {
  ok: boolean
  latest_message: string
  updated_at: number
}

/**
 * 소울트레이스 앱에서 [전송] 시 호출 — JWT(소유자) 필수.
 * 성공 시 기기 display 엔드포인트가 SSE로 즉시 갱신됩니다.
 */
export async function sendLetterToDevice(
  deviceSn: string,
  text: string,
): Promise<SendLetterResponse> {
  const token = getAuthToken()
  if (!token) {
    throw new Error('로그인이 필요합니다. 기기를 등록한 계정으로 로그인해 주세요.')
  }
  const base = getApiBase()
  const res = await fetch(
    `${base}/api/devices/${encodeURIComponent(deviceSn)}/message`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    },
  )
  if (!res.ok) {
    const errText = await res.text()
    try {
      const j = JSON.parse(errText) as { error?: string }
      throw new Error(j.error || errText)
    } catch {
      throw new Error(errText || `HTTP ${res.status}`)
    }
  }
  return res.json()
}
