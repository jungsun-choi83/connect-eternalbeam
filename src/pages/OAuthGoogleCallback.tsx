import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { takePendingBindAnon } from '../lib/anonymousSession'
import { bindAnonymousToAccount, exchangeGoogleOAuthCode } from '../lib/authApi'

export function OAuthGoogleCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const error = searchParams.get('error')
    const code = searchParams.get('code')
    if (error) {
      setErr('로그인이 취소되었습니다.')
      return
    }
    if (!code) {
      setErr('인증 코드가 없습니다.')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        await exchangeGoogleOAuthCode(code)
        const pending = takePendingBindAnon()
        if (pending) {
          try {
            await bindAnonymousToAccount(pending)
          } catch {
            /* 이미 귀속됨 등 */
          }
        }
        if (!cancelled) navigate('/', { replace: true })
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : '로그인에 실패했습니다.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [searchParams, navigate])

  if (err) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-black px-6 text-center text-white/80">
        <p className="font-sans text-sm">{err}</p>
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="mt-6 border border-[#D4AF37]/35 px-5 py-2 text-sm text-[#D4AF37]"
        >
          처음으로
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-black text-[#D4AF37]">
      <p className="font-sans text-sm tracking-wide">Google 계정으로 연결하는 중…</p>
    </div>
  )
}
