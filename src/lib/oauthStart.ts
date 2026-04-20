import { getApiBase } from './apiBase'
import { setPendingBindAnon } from './anonymousSession'

async function fetchOAuthUrl(path: string): Promise<string> {
  const res = await fetch(`${getApiBase()}${path}`)
  const j = (await res.json()) as { configured?: boolean; url?: string | null }
  if (!j.configured || !j.url) {
    throw new Error('not_configured')
  }
  return j.url
}

/** 간편 로그인 직전: 익명 세션을 이 계정으로 귀속시키기 위해 세션에 anonId를 남깁니다. */
export function startGoogleOAuth(anonId: string | null): void {
  if (anonId) setPendingBindAnon(anonId)
  void fetchOAuthUrl('/api/auth/oauth/google/url')
    .then((url) => {
      window.location.href = url
    })
    .catch(() => {
      window.alert('Google 로그인이 아직 서버에 설정되지 않았습니다.')
    })
}

export function startKakaoOAuth(anonId: string | null): void {
  if (anonId) setPendingBindAnon(anonId)
  void fetchOAuthUrl('/api/auth/oauth/kakao/url')
    .then((url) => {
      window.location.href = url
    })
    .catch(() => {
      window.alert('카카오 로그인이 아직 서버에 설정되지 않았습니다.')
    })
}
