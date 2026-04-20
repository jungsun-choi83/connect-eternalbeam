import { Link, useSearchParams } from 'react-router-dom'

export function TossPaymentFailPage() {
  const [params] = useSearchParams()
  const code = params.get('code') ?? '-'
  const message = params.get('message') ?? '결제를 완료하지 못했습니다.'

  return (
    <div className="flex min-h-dvh items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-xl border border-white/15 bg-black/40 px-8 py-10 text-center">
        <p className="font-sans text-[11px] uppercase tracking-[0.35em] text-white/45">결제 미완료</p>
        <h1 className="mt-4 font-serif text-2xl text-[#D4AF37] sm:text-3xl">다시 시도해 주세요</h1>
        <p className="mt-6 font-sans text-sm leading-relaxed text-white/65">{message}</p>
        <p className="mt-3 font-mono text-xs text-white/45">code: {code}</p>
        <Link
          to="/#order"
          className="mt-8 inline-block border border-[#D4AF37]/40 px-6 py-2.5 text-sm text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
        >
          구독 결제로 돌아가기
        </Link>
      </div>
    </div>
  )
}
