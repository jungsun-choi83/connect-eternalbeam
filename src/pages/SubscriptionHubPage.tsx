import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { fetchMe, login, logout, register, type MeResponse } from '../lib/authApi'
import { ST_KEY_EMAIL, STORAGE_EMAIL } from '../lib/soulTraceIngest'
import { startTossTestCheckout } from '../lib/tossCheckout'
import { devActivateSubscription } from '../lib/subscriberApi'

const showDevSubscription =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_SUBSCRIPTION === 'true'

function looksLikeApiUnavailable(msg: string): boolean {
  return /fetch|Failed to fetch|network|연결|NAME_NOT_RESOLVED|not resolved|404|405|API 서버/i.test(msg)
}

export function SubscriptionHubPage() {
  const [params] = useSearchParams()
  const emailHint = params.get('email')?.trim() ?? ''
  const [booting, setBooting] = useState(true)
  const [me, setMe] = useState<MeResponse | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState(emailHint)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (emailHint) setEmail(emailHint)
  }, [emailHint])

  useEffect(() => {
    if (!emailHint) return
    try {
      localStorage.setItem(STORAGE_EMAIL, emailHint)
      localStorage.setItem(ST_KEY_EMAIL, emailHint)
    } catch {
      /* ignore */
    }
  }, [emailHint])

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

  const refreshSession = async () => {
    const m = await fetchMe()
    setMe(m)
  }

  const onSubmitAuth = async () => {
    setErr(null)
    setBusy(true)
    try {
      if (mode === 'register') {
        await register(email.trim(), password)
      } else {
        await login(email.trim(), password)
      }
      await refreshSession()
    } catch (e) {
      setErr(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const onCheckout = async () => {
    const target = me?.email?.trim() || email.trim()
    if (!target) {
      window.alert('결제를 위해 이메일로 로그인해 주세요.')
      return
    }
    setBusy(true)
    try {
      await startTossTestCheckout(target)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '결제를 시작할 수 없습니다.')
    } finally {
      setBusy(false)
    }
  }

  const onDevActivateSubscription = async () => {
    setBusy(true)
    try {
      await devActivateSubscription()
      await refreshSession()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '활성화에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  if (booting) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0e0e0c] px-6 font-sans text-sm text-white/55">
        불러오는 중…
      </div>
    )
  }

  if (!me) {
    return (
      <div className="min-h-dvh bg-[#0e0e0c] px-5 pb-16 pt-12 font-sans text-white sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]/75">
            Eternal Beam · Connect
          </p>
          <h1 className="mt-4 text-center font-serif text-2xl tracking-wide text-[#D4AF37] sm:text-3xl">
            구독자 공간
          </h1>
          <p className="mt-4 text-center text-sm leading-relaxed text-white/65">
            소울트레이스와 연결된 이메일로 로그인하면
            <br />
            아이의 편지와 기록을 모두 모아 볼 수 있어요.
          </p>

          <form
            className="mt-10 border border-[#D4AF37]/25 bg-black/35 px-6 py-8"
            onSubmit={(e) => {
              e.preventDefault()
              void onSubmitAuth()
            }}
          >
            <div className="flex gap-2 border border-white/10 p-0.5">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2 text-xs tracking-wide transition ${
                  mode === 'login' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'text-white/45'
                }`}
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-2 text-xs tracking-wide transition ${
                  mode === 'register' ? 'bg-[#D4AF37]/15 text-[#D4AF37]' : 'text-white/45'
                }`}
              >
                회원가입
              </button>
            </div>
            <label className="mt-6 block text-[11px] tracking-wide text-white/45">이메일</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mt-1.5 w-full border border-white/15 bg-black/50 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/45"
              placeholder="you@example.com"
            />
            <label className="mt-4 block text-[11px] tracking-wide text-white/45">
              비밀번호 {mode === 'register' && '(8자 이상)'}
            </label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              className="mt-1.5 w-full border border-white/15 bg-black/50 px-3 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/45"
            />
            {err && <p className="mt-4 text-center text-xs text-red-300/90">{err}</p>}
            {err && looksLikeApiUnavailable(err) && (
              <div className="mt-4 rounded-sm border border-[#D4AF37]/25 bg-black/40 px-4 py-3 text-center text-[11px] leading-relaxed text-white/60">
                <code className="font-mono text-[10px] text-white/35">api.connect.eternalbeam.com</code> 등 API
                주소가 아직 연결되지 않았을 수 있어요.
                <br />
                <Link
                  to="/subscription/dashboard?preview=1"
                  className="mt-2 inline-block font-medium text-[#D4AF37] underline-offset-2 hover:underline"
                >
                  대시보드 화면만 데모로 보기
                </Link>
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="mt-6 w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 py-3.5 font-serif text-sm tracking-wide text-[#D4AF37] transition hover:bg-[#D4AF37]/18 disabled:opacity-60"
            >
              {busy ? '처리 중…' : mode === 'register' ? '가입하고 계속하기' : '로그인'}
            </button>
          </form>

          <Link
            to="/"
            className="mt-10 block text-center font-sans text-xs tracking-wide text-white/35 transition hover:text-white/55"
          >
            ← 홈으로
          </Link>
          <Link
            to="/subscription/dashboard?preview=1"
            className="mt-6 block text-center text-[11px] tracking-wide text-[#D4AF37]/70 underline-offset-4 transition hover:text-[#D4AF37]"
          >
            API 없이 대시보드 화면만 보기 (테스트)
          </Link>
        </div>
      </div>
    )
  }

  if (me.subscription.active) {
    return <Navigate to="/subscription/dashboard" replace />
  }

  return (
    <div className="min-h-dvh bg-[#0e0e0c] px-5 pb-16 pt-12 font-sans text-white sm:px-8">
      <div className="mx-auto w-full max-w-lg text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]/75">Subscriber</p>
          <h1 className="mt-4 font-serif text-2xl text-[#D4AF37] sm:text-3xl">구독으로 이어지는 공간</h1>
          <p className="mt-6 text-sm leading-relaxed text-white/65">
            월 구독을 시작하면 아이의 편지가 매달 이곳에 도착하고,
            <br className="hidden sm:inline" />
            사진·기억·아카이브를 한곳에서 간직할 수 있어요.
          </p>
          <button
            type="button"
            onClick={() => void onCheckout()}
            disabled={busy}
            className="mt-10 w-full max-w-sm border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-6 py-4 font-serif text-[1.05rem] tracking-wide text-[#D4AF37] transition hover:bg-[#D4AF37]/18 disabled:opacity-60"
          >
            {busy ? '연결 중…' : '구독 시작하기'}
          </button>
          <p className="mt-4 font-mono text-[10px] text-white/30">{me.email}</p>
          {showDevSubscription && (
            <div className="mx-auto mt-8 max-w-sm space-y-2">
              <p className="text-center text-[11px] leading-snug text-white/35">
                로컬 테스트: 서버가 CONNECT_DEV_SUBSCRIPTION=1 일 때만 동작합니다.
                <br />
                <span className="text-white/25">(npm run dev 로 서버 실행 시 자동 적용)</span>
              </p>
              <button
                type="button"
                onClick={() => void onDevActivateSubscription()}
                disabled={busy}
                className="w-full border border-dashed border-[#D4AF37]/35 py-3 font-sans text-xs tracking-wide text-[#D4AF37]/80 transition hover:border-[#D4AF37]/55 hover:bg-[#D4AF37]/10 disabled:opacity-60"
              >
                {busy ? '처리 중…' : '결제 없이 구독 켜기 (개발)'}
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              logout()
              setMe(null)
            }}
            className="mt-12 text-xs tracking-wide text-white/35 underline-offset-4 hover:text-white/55"
          >
            다른 계정으로 바꾸기
          </button>
        <Link to="/" className="mt-6 block text-xs tracking-wide text-white/35 hover:text-white/55">
          ← 홈으로
        </Link>
        <Link
          to="/subscription/dashboard?preview=1"
          className="mt-5 block text-center text-[11px] tracking-wide text-[#D4AF37]/70 underline-offset-4 transition hover:text-[#D4AF37]"
        >
          API 없이 대시보드 화면만 보기 (테스트)
        </Link>
      </div>
    </div>
  )
}
