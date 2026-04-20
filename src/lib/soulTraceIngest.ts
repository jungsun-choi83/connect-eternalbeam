/**
 * 소울 트레이스 → 이터널 커넥트로 넘어올 때 URL·localStorage에서 편지·이메일·기기 ID를 읽습니다.
 * 쿼리 값은 encodeURIComponent 기준으로 decodeURIComponent 처리합니다.
 */

/** 소울 트레이스 앱에서 직접 쓰는 키 (페이지 로드 시 우선 확인) */
export const ST_KEY_LETTER = 'st_letter'
export const ST_KEY_EMAIL = 'st_email'

export const STORAGE_LETTER = 'soultrace_letter_content'
export const STORAGE_EMAIL = 'soultrace_user_email'
export const STORAGE_DEVICE = 'soultrace_device_id'

export type SoulTracePayload = {
  letter: string | null
  email: string | null
  deviceId: string | null
}

/** 잘못된 이스케이프 시 원문 또는 null */
export function safeDecodeParam(value: string | null): string | null {
  if (!value?.trim()) return null
  const raw = value.trim()
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' '))
  } catch {
    return raw
  }
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)?.trim() || null
  } catch {
    return null
  }
}

function tryParseJsonPayload(decoded: string): Record<string, unknown> | null {
  try {
    const j = JSON.parse(decoded)
    return j && typeof j === 'object' ? (j as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function tryParsePayload(payloadRaw: string | null): Record<string, unknown> | null {
  const decoded = safeDecodeParam(payloadRaw)
  if (!decoded || decoded.toLowerCase() === 'localstorage') return null

  const asJson = tryParseJsonPayload(decoded)
  if (asJson) return asJson

  // URL-safe base64(JSON)도 허용
  try {
    const normalized = decoded.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const base64Decoded = atob(padded)
    return tryParseJsonPayload(base64Decoded)
  } catch {
    return null
  }
}

function pickString(obj: Record<string, unknown> | null, keys: string[]): string | null {
  if (!obj) return null
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}

/**
 * URL 쿼리 → (우선) 그 다음 `st_letter` / `st_email` → 기존 soultrace_* 키 순으로 편지·이메일을 합칩니다.
 */
export function syncSoulTraceFromSearchParams(searchParams: URLSearchParams): SoulTracePayload {
  const payloadObj = tryParsePayload(searchParams.get('payload'))

  const fromUrlLetter =
    safeDecodeParam(searchParams.get('letter')) ??
    safeDecodeParam(searchParams.get('letter_content')) ??
    safeDecodeParam(searchParams.get('st_letter')) ??
    pickString(payloadObj, ['letter', 'letter_content', 'st_letter'])

  const fromUrlEmail =
    safeDecodeParam(searchParams.get('email')) ??
    safeDecodeParam(searchParams.get('user_email')) ??
    safeDecodeParam(searchParams.get('user')) ??
    safeDecodeParam(searchParams.get('st_email')) ??
    pickString(payloadObj, ['email', 'user_email', 'user', 'st_email'])

  const deviceId =
    safeDecodeParam(searchParams.get('deviceId')) ??
    safeDecodeParam(searchParams.get('device_id')) ??
    pickString(payloadObj, ['deviceId', 'device_id'])

  const stLetter = readStorage(ST_KEY_LETTER)
  const stEmail = readStorage(ST_KEY_EMAIL)

  const letter = fromUrlLetter ?? stLetter ?? readStorage(STORAGE_LETTER)
  const email = fromUrlEmail ?? stEmail ?? readStorage(STORAGE_EMAIL)
  const resolvedDeviceId = deviceId ?? readStorage(STORAGE_DEVICE)

  try {
    if (letter) {
      localStorage.setItem(STORAGE_LETTER, letter)
      localStorage.setItem(ST_KEY_LETTER, letter)
    }
    if (email) {
      localStorage.setItem(STORAGE_EMAIL, email)
      localStorage.setItem(ST_KEY_EMAIL, email)
    }
    if (resolvedDeviceId) localStorage.setItem(STORAGE_DEVICE, resolvedDeviceId)
  } catch {
    /* ignore */
  }

  return {
    letter,
    email,
    deviceId: resolvedDeviceId,
  }
}
