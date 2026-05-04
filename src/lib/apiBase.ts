/**
 * API 베이스 URL.
 * - 개발: Vite 프록시 → 빈 문자열(동일 오리진 localhost:5173 → :3001)
 * - Vercel 정적만 쓰는 경우 `/api` POST는 405가 날 수 있으므로, Express가 떠 있는 호스트를 꼭 넣어야 합니다.
 *   Vercel 환경변수: VITE_API_BASE=https://실제-API-호스트
 * - connect.eternalbeam.com 에서 VITE_API_BASE 가 비어 있으면 관용적으로 api 서브도메인을 시도합니다.
 *   다른 호스트를 쓰면 반드시 VITE_API_BASE 로 지정하세요.
 */
const DEFAULT_API_FOR_CONNECT_HOST = 'https://api.connect.eternalbeam.com'

export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined') {
    const h = window.location.hostname
    if (h === 'connect.eternalbeam.com' || h === 'www.connect.eternalbeam.com') {
      return DEFAULT_API_FOR_CONNECT_HOST
    }
  }
  return ''
}
