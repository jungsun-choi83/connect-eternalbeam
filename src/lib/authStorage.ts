export const AUTH_TOKEN_KEY = 'eternalbeam_auth_token'

const AUTH_CHANGE = 'eternalbeam-auth-change'

function notifyAuthChange(): void {
  try {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE))
  } catch {
    /* ignore */
  }
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY)?.trim() || null
  } catch {
    return null
  }
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token.trim())
  notifyAuthChange()
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  notifyAuthChange()
}

export function subscribeAuthChange(fn: () => void): () => void {
  const handler = () => fn()
  window.addEventListener(AUTH_CHANGE, handler)
  return () => window.removeEventListener(AUTH_CHANGE, handler)
}
