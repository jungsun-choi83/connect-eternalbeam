/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  /** 이잉크 디스플레이 폴링 간격(ms). 미설정 시 1시간. */
  readonly VITE_EINK_POLL_MS?: string
  /** Supabase 프로젝트 URL (Settings → API → Project URL) */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon public key (클라이언트 전용, RLS와 함께 사용) */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
