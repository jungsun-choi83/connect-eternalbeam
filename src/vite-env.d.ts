/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  /** 이잉크 디스플레이 폴링 간격(ms). 미설정 시 1시간. */
  readonly VITE_EINK_POLL_MS?: string
  /** Supabase 프로젝트 URL (Settings → API → Project URL) */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon public key (클라이언트 전용, RLS와 함께 사용) */
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** Toss Payments 클라이언트 키 (테스트: test_ck_...) */
  readonly VITE_TOSS_CLIENT_KEY?: string
  /** true: /subscription/dashboard?preview=1 로 API 없이 대시보드 UI만 표시 (Vercel 테스트용) */
  readonly VITE_PREVIEW_SUBSCRIPTION_UI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
