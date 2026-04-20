export const ANON_STORAGE_KEY = 'soultrace_anon_id'

/** OAuth 직후 익명 편지 귀속용 (탭 단위) */
export const PENDING_BIND_ANON_KEY = 'soultrace_pending_bind_anon'

export function getOrCreateAnonId(): string {
  try {
    let id = localStorage.getItem(ANON_STORAGE_KEY)?.trim()
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(ANON_STORAGE_KEY, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export function getStoredAnonId(): string | null {
  try {
    return localStorage.getItem(ANON_STORAGE_KEY)?.trim() || null
  } catch {
    return null
  }
}

export function setStoredAnonId(id: string): void {
  try {
    localStorage.setItem(ANON_STORAGE_KEY, id.trim())
  } catch {
    /* ignore */
  }
}

/** URL의 `anonId`를 로컬에 동기화하고, 표시용으로 우선순위가 높은 값을 반환 */
export function resolveActiveAnonId(searchParams: URLSearchParams): string | null {
  const fromUrl = searchParams.get('anonId')?.trim()
  if (fromUrl) {
    setStoredAnonId(fromUrl)
    return fromUrl
  }
  return getStoredAnonId()
}

export function setPendingBindAnon(anonId: string): void {
  try {
    sessionStorage.setItem(PENDING_BIND_ANON_KEY, anonId.trim())
  } catch {
    /* ignore */
  }
}

export function peekPendingBindAnon(): string | null {
  try {
    return sessionStorage.getItem(PENDING_BIND_ANON_KEY)?.trim() || null
  } catch {
    return null
  }
}

export function takePendingBindAnon(): string | null {
  const id = peekPendingBindAnon()
  try {
    sessionStorage.removeItem(PENDING_BIND_ANON_KEY)
  } catch {
    /* ignore */
  }
  return id
}
