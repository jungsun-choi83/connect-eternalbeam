import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { startTossUpsellCheckout } from '../lib/tossCheckout'
import { ST_KEY_EMAIL, STORAGE_EMAIL } from '../lib/soulTraceIngest'

export function PlaqueDetailPage() {
  const [params] = useSearchParams()
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

  const startCheckout = async () => {
    if (!email) {
      window.alert('결제를 위해 이메일 정보가 필요합니다.')
      return
    }
    setProcessing(true)
    try {
      await startTossUpsellCheckout(email)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <main className="eink-acrylic-bg min-h-dvh px-6 py-10 text-white sm:px-10">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <section className="text-center">
          <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/75">Plaque</p>
          <h1 className="aurora-title mt-4 whitespace-pre-line font-serif text-[2rem] leading-snug sm:text-[2.4rem]">
            {'이 메시지를,\n눈앞에서 다시 만나는 순간'}
          </h1>
          <p className="mt-4 font-serif text-[1.1rem] text-white/82">아이의 마음이, 빛으로 도착합니다</p>
        </section>

        <section className="rounded-xl border border-[#D4AF37]/20 bg-black/40 p-3">
          {!videoFailed && (
            <video autoPlay muted loop playsInline onError={() => setVideoFailed(true)} className="product-video">
              <source src="/video/eternalbeam.mp4" type="video/mp4" />
              <source src="/videos/plaque-preview.mp4" type="video/mp4" />
            </video>
          )}
          {videoFailed && (
            <div className="flex h-[40dvh] items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-black/30 text-center font-sans text-sm text-white/60">
              명패 영상이 곧 표시됩니다
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#D4AF37]/20 bg-black/35 px-6 py-6">
          <ul className="space-y-2 font-sans text-[15px] leading-relaxed text-white/80">
            <li>- 아이의 메시지를 빛으로 표현</li>
            <li>- NFC 카드로 언제든 다시 재생</li>
            <li>- 시간이 지나도 사라지지 않는 기억</li>
          </ul>
        </section>

        <section className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/8 px-6 py-7 text-center">
          <p className="whitespace-pre-line font-serif text-[1.25rem] leading-relaxed text-[#D4AF37]">
            {'이건 단순한 기기가 아닙니다\n\n아이와의 시간을\n눈앞에 남기는 방식입니다'}
          </p>
        </section>

        <section className="rounded-xl border border-[#D4AF37]/20 bg-black/35 px-6 py-6">
          <ul className="space-y-2 font-sans text-[15px] leading-relaxed text-white/80">
            <li>- 디스플레이 명패</li>
            <li>- 전용 케이스</li>
            <li>- 1년 메시지 연결</li>
          </ul>
        </section>

        <section className="text-center">
          <p className="font-serif text-[2.2rem] tracking-tight text-[#D4AF37]">₩000,000</p>
          <p className="mt-3 font-serif text-[1rem] text-white/75">지금 이 순간의 메시지를 담을 수 있어요</p>
          <button
            type="button"
            onClick={startCheckout}
            disabled={processing}
            className="aurora-button mt-5 w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-4 font-serif text-[1.08rem] tracking-wide text-[#D4AF37] disabled:opacity-70"
          >
            {processing ? '결제 준비 중...' : '이 메시지를 남기기'}
          </button>
          <Link
            to={email ? `/subscription?email=${encodeURIComponent(email)}` : '/subscription'}
            className="mt-4 block text-center font-sans text-sm text-white/55"
          >
            구독으로 계속 받아보기
          </Link>
        </section>
      </div>
    </main>
  )
}
