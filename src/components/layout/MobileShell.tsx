import type { ReactNode } from 'react'

/**
 * connect.eternalbeam.com — 모바일 웹앱 컬럼 (max 430px는 #root 에서 처리)
 * 상단 상태바 스타일 로고 + 선택 서브타이틀
 */
export function MobileTopBar({ subtitle }: { subtitle?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-[rgba(255,255,255,0.06)] bg-[#0e0e0c]/[0.97] backdrop-blur-md supports-[backdrop-filter]:bg-[#0e0e0c]/90">
      <div
        className="flex h-9 items-center justify-center px-4"
        style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.36em] text-[#c9a227]/88">ETERNAL BEAM</span>
      </div>
      {subtitle != null && subtitle !== false ? (
        <div className="border-t border-[rgba(255,255,255,0.04)] px-4 py-2.5">{subtitle}</div>
      ) : null}
    </header>
  )
}

export function MobileBottomDock({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`shrink-0 border-t border-[rgba(255,255,255,0.08)] bg-[#0e0e0c] px-4 pt-3 ${className}`}
      style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}
    >
      {children}
    </div>
  )
}
