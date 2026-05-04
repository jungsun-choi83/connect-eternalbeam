import { getApiBase } from './apiBase'
import { clearAuthToken, getAuthToken, setAuthToken } from './authStorage'

const base = () => getApiBase()

async function apiJsonMessage(res: Response, fallback: string): Promise<string> {
  const ct = res.headers.get('content-type') ?? ''
  if (res.status === 405 || res.status === 404) {
    return 'API 서버에 연결되지 않았습니다. 배포 환경에 VITE_API_BASE(Express API URL)가 올바른지 확인해 주세요.'
  }
  if (!ct.includes('application/json')) {
    return `${fallback} (${res.status})`
  }
  const j = (await res.json().catch(() => ({}))) as { error?: string }
  return j.error || `${fallback} (${res.status})`
}

export type AuthUser = { id: string; email: string }

export type SubscriptionState = { active: boolean; since: number | null }

export type MeResponse = {
  id: string
  email: string
  created_at: number
  phone?: string | null
  display_name?: string | null
  subscription: SubscriptionState
}

export async function fetchMe(): Promise<MeResponse | null> {
  const token = getAuthToken()
  if (!token) return null
  const res = await fetch(`${base()}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    if (res.status === 401) clearAuthToken()
    return null
  }
  return res.json() as Promise<MeResponse>
}

export async function bindAnonymousToAccount(anonId: string): Promise<{ migrated: number }> {
  const token = getAuthToken()
  if (!token) throw new Error('LOGIN_REQUIRED')
  const res = await fetch(`${base()}/api/auth/bind-anonymous`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ anon_id: anonId }),
  })
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(j.error || `연결 실패 (${res.status})`)
  }
  const data = (await res.json()) as { migrated?: number }
  return { migrated: data.migrated ?? 0 }
}

export async function registerOrderAccount(input: {
  email: string
  phone: string
  displayName: string
}): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${base()}/api/auth/register-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: input.email.trim(),
      phone: input.phone.trim(),
      displayName: input.displayName.trim(),
    }),
  })
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(j.error || `가입 실패 (${res.status})`)
  }
  const data = (await res.json()) as { token: string; user: AuthUser }
  setAuthToken(data.token)
  return data
}

export async function exchangeGoogleOAuthCode(code: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${base()}/api/auth/oauth/google/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(j.error || `Google 로그인 실패 (${res.status})`)
  }
  const data = (await res.json()) as { token: string; user: AuthUser }
  setAuthToken(data.token)
  return data
}

export async function exchangeKakaoOAuthCode(code: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${base()}/api/auth/oauth/kakao/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(j.error || `카카오 로그인 실패 (${res.status})`)
  }
  const data = (await res.json()) as { token: string; user: AuthUser }
  setAuthToken(data.token)
  return data
}

export async function register(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${base()}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    throw new Error(await apiJsonMessage(res, '가입 실패'))
  }
  const data = (await res.json()) as { token: string; user: AuthUser }
  setAuthToken(data.token)
  return data
}

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${base()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    throw new Error(await apiJsonMessage(res, '로그인 실패'))
  }
  const data = (await res.json()) as { token: string; user: AuthUser }
  setAuthToken(data.token)
  return data
}

export function logout(): void {
  clearAuthToken()
}

export async function claimDevice(deviceSn: string): Promise<void> {
  const token = getAuthToken()
  if (!token) throw new Error('LOGIN_REQUIRED')
  const res = await fetch(`${base()}/api/devices/${encodeURIComponent(deviceSn)}/claim`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(j.error || `등록 실패 (${res.status})`)
  }
}
