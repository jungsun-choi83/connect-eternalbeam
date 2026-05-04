import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { SubscriberDashboard } from '../components/subscriber/SubscriberDashboard'
import { fetchMe, logout, type MeResponse } from '../lib/authApi'

/**
 * 구독 완료·로그인한 구독자만 접근.
 * 비구독자·미로그인 → `/subscription` (구독 유도·로그인)
 */
export function SubscriptionDashboardPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const emailHint = params.get('email')?.trim() ?? ''
  const [booting, setBooting] = useState(true)
  const [me, setMe] = useState<MeResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const m = await fetchMe()
      if (!cancelled) {
        setMe(m)
        setBooting(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (booting) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0e0e0c] px-6 font-sans text-sm text-white/55">
        불러오는 중…
      </div>
    )
  }

  if (!me) {
    const q = emailHint ? `?email=${encodeURIComponent(emailHint)}` : ''
    return <Navigate to={`/subscription${q}`} replace />
  }

  if (!me.subscription.active) {
    return <Navigate to="/subscription" replace />
  }

  return (
    <SubscriberDashboard
      userEmail={me.email}
      onLogout={() => {
        logout()
        navigate('/subscription', { replace: true })
      }}
    />
  )
}
