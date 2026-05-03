import { getApiBase } from './apiBase'
import { getAuthToken } from './authStorage'

const headersAuthJson = (): Record<string, string> => {
  const token = getAuthToken()
  if (!token) throw new Error('LOGIN_REQUIRED')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export type ArchiveEntry = {
  id: string
  source: 'soultrace' | 'monthly'
  body: string
  arrived_at: number
  title?: string
  cycle_index?: number
}

export type SubscriberPhoto = {
  id: string
  data_url: string
  created_at: number
}

export type SubscriberMemory = {
  id: string
  date_iso: string
  text: string
  created_at: number
}

export type SubscriberDashboardPayload = {
  child_name: string
  profile_photo: string | null
  archive_entries: ArchiveEntry[]
  photos: SubscriberPhoto[]
  memories: SubscriberMemory[]
  subscription: { active: boolean; since: number }
  next_letter_eta_ms: number | null
  latest_monthly: ArchiveEntry | null
}

export async function fetchSubscriberDashboard(): Promise<SubscriberDashboardPayload> {
  const res = await fetch(`${getApiBase()}/api/subscriber/dashboard`, {
    headers: headersAuthJson(),
  })
  const data = (await res.json().catch(() => ({}))) as SubscriberDashboardPayload & { error?: string }
  if (!res.ok) {
    throw new Error(data.error || `대시보드를 불러오지 못했습니다 (${res.status})`)
  }
  return data
}

export async function patchSubscriberProfile(input: {
  child_name?: string
  profile_photo?: string | null
}): Promise<{ child_name: string; profile_photo: string | null }> {
  const res = await fetch(`${getApiBase()}/api/subscriber/dashboard/profile`, {
    method: 'PATCH',
    headers: headersAuthJson(),
    body: JSON.stringify(input),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(data.error || `저장 실패 (${res.status})`)
  return data as { child_name: string; profile_photo: string | null }
}

export async function uploadSubscriberPhoto(dataUrl: string): Promise<{ photo: SubscriberPhoto }> {
  const res = await fetch(`${getApiBase()}/api/subscriber/dashboard/photos`, {
    method: 'POST',
    headers: headersAuthJson(),
    body: JSON.stringify({ data_url: dataUrl }),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string; photo?: SubscriberPhoto }
  if (!res.ok) throw new Error(data.error || `업로드 실패 (${res.status})`)
  if (!data.photo) throw new Error('응답 오류')
  return { photo: data.photo }
}

export async function deleteSubscriberPhoto(id: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/subscriber/dashboard/photos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: headersAuthJson(),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error || `삭제 실패 (${res.status})`)
  }
}

export async function addSubscriberMemory(date_iso: string, text: string): Promise<{ memory: SubscriberMemory }> {
  const res = await fetch(`${getApiBase()}/api/subscriber/dashboard/memories`, {
    method: 'POST',
    headers: headersAuthJson(),
    body: JSON.stringify({ date_iso, text }),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string; memory?: SubscriberMemory }
  if (!res.ok) throw new Error(data.error || `추가 실패 (${res.status})`)
  if (!data.memory) throw new Error('응답 오류')
  return { memory: data.memory }
}

export async function deleteSubscriberMemory(id: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/subscriber/dashboard/memories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: headersAuthJson(),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error || `삭제 실패 (${res.status})`)
  }
}

export async function activateSubscriptionFromCheckout(email: string, orderId: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/subscription/activate-from-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), orderId: orderId.trim() }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error || `구독 활성화 실패 (${res.status})`)
  }
}

/** CONNECT_DEV_SUBSCRIPTION=1 인 서버에서만 동작 (로그인한 계정) */
export async function devActivateSubscription(): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/subscription/dev-activate`, {
    method: 'POST',
    headers: headersAuthJson(),
  })
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        '개발 모드가 아닙니다. npm run dev 로 서버를 띄우거나 CONNECT_DEV_SUBSCRIPTION=1 을 설정해 주세요.',
      )
    }
    throw new Error(data.error || `활성화 실패 (${res.status})`)
  }
}
