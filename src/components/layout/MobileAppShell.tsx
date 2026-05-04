import { Outlet } from 'react-router-dom'

/** 모바일 웹앱 컬럼 — `/display/:deviceSn` 등 전체 너비 라우트와 분리 */
export function MobileAppShell() {
  return (
    <div className="mobile-app-shell flex min-h-dvh flex-col">
      <Outlet />
    </div>
  )
}
