import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { startTossUpsellCheckout } from '../lib/tossCheckout'
import { ST_KEY_EMAIL, STORAGE_EMAIL } from '../lib/soulTraceIngest'
import { activateSubscriptionFromCheckout } from '../lib/subscriberApi'

export function TossPaymentSuccessPage() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId') ?? '-'
  const amount = params.get('amount') ?? '-'
  const flow = params.get('flow')
  const [processing, setProcessing] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const email = useMemo(() => {
    const fromQuery = params.get('email')?.trim()
    if (fromQuery) return fromQuery
    try {
      return localStorage.getItem(ST_KEY_EMAIL)?.trim() || localStorage.getItem(STORAGE_EMAIL)?.trim() || ''
    } catch {
      return ''
    }
  }, [params])

  const startUpsell = async () => {
    if (!email) {
      window.alert('업셀 결제를 위해 이메일 정보가 필요합니다.')
      return
    }
    setProcessing(true)
    try {
      await startTossUpsellCheckout(email)
    } finally {
      setProcessing(false)
    }
  }

  useEffect(() => {
    if (flow !== 'subscription') return
    if (email && orderId && orderId !== '-') {
      void activateSubscriptionFromCheckout(email, orderId).catch(() => {
        /* 서버 연결 실패 시에도 이동 */
      })
    }
    const timer = window.setTimeout(() => {
      window.location.href = email
        ? `/subscription?email=${encodeURIComponent(email)}`
        : '/subscription'
    }, 700)
    return () => window.clearTimeout(timer)
  }, [flow, email, orderId])

  if (flow === 'upsell') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-xl border border-[#D4AF37]/20 bg-black/40 px-8 py-10 text-center">
          <p className="font-sans text-[11px] uppercase tracking-[0.35em] text-[#D4AF37]/70">결제 완료</p>
          <h1 className="mt-4 font-serif text-2xl text-[#D4AF37] sm:text-3xl">빛으로 간직하는 준비가 끝났어요</h1>
          <p className="mt-6 font-sans text-sm leading-relaxed text-white/65">
            아이의 메시지가 더 가까운 곳에서 다시 도착할 거예요.
          </p>
          <Link
            to={email ? `/subscription?email=${encodeURIComponent(email)}` : '/subscription'}
            className="mt-8 inline-block border border-[#D4AF37]/40 px-6 py-2.5 text-sm text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
          >
            메시지 화면으로 이동
          </Link>
        </div>
      </div>
    )
  }

  if (flow === 'subscription') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-xl border border-[#D4AF37]/20 bg-black/40 px-8 py-10 text-center">
          <p className="font-sans text-[11px] uppercase tracking-[0.35em] text-[#D4AF37]/70">결제 완료</p>
          <h1 className="mt-4 font-serif text-2xl text-[#D4AF37] sm:text-3xl">구독이 시작되었습니다</h1>
          <p className="mt-6 font-sans text-sm leading-relaxed text-white/65">
            잠시 후 편지 화면으로 이동합니다.
          </p>
          <Link
            to={email ? `/subscription?email=${encodeURIComponent(email)}` : '/subscription'}
            className="mt-8 inline-block border border-[#D4AF37]/40 px-6 py-2.5 text-sm text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
          >
            바로 이동하기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="eink-acrylic-bg min-h-dvh bg-black px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-xl">
        <p className="text-center font-sans text-[11px] uppercase tracking-[0.35em] text-[#D4AF37]/70">결제 완료</p>
        <h1 className="mt-5 text-center font-serif text-[1.9rem] leading-snug text-[#D4AF37]">
          이 메시지를 눈앞에서 남겨보시겠어요?
        </h1>
        <p className="mt-6 whitespace-pre-line text-center font-serif text-[1.08rem] leading-relaxed text-white/84">
          {'아이의 편지를\n빛으로 간직하세요'}
        </p>
        <div className="relative mt-8 overflow-hidden border border-[#D4AF37]/20 bg-black/40">
          {!videoFailed && (
            <video autoPlay muted loop playsInline onError={() => setVideoFailed(true)} className="h-[40dvh] w-full object-cover">
              <source src="/videos/plaque-preview.mp4" type="video/mp4" />
            </video>
          )}
          {videoFailed && (
            <div className="flex h-[40dvh] items-center justify-center text-center font-sans text-sm text-white/55">
              명패 영상을 불러오는 중입니다
            </div>
          )}
        </div>
        <div className="mt-8 space-y-2">
          <button
            type="button"
            onClick={startUpsell}
            disabled={processing}
            className="w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-4 font-serif text-[1.05rem] tracking-wide text-[#D4AF37] transition hover:bg-[#D4AF37]/18 disabled:opacity-70"
          >
            {processing ? '준비 중...' : '지금 추가하기'}
          </button>
          <Link
            to={email ? `/subscription?email=${encodeURIComponent(email)}` : '/subscription'}
            className="block w-full py-3 text-center font-sans text-sm text-white/60"
          >
            나중에 할게요
          </Link>
        </div>
        <div className="mt-8 space-y-1 text-center font-mono text-[11px] text-white/35">
          <p>orderId: {orderId}</p>
          <p>amount: {amount}</p>
        </div>
      </div>
    </div>
  )
}
