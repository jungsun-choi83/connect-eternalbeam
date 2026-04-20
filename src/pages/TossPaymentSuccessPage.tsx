import { Link, useSearchParams } from 'react-router-dom'

export function TossPaymentSuccessPage() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId') ?? '-'
  const amount = params.get('amount') ?? '-'

  return (
    <div className="flex min-h-dvh items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-xl border border-[#D4AF37]/20 bg-black/40 px-8 py-10 text-center">
        <p className="font-sans text-[11px] uppercase tracking-[0.35em] text-[#D4AF37]/70">결제 완료</p>
        <h1 className="mt-4 font-serif text-2xl text-[#D4AF37] sm:text-3xl">
          구독이 정상적으로 시작되었습니다
        </h1>
        <p className="mt-6 font-sans text-sm leading-relaxed text-white/65">
          테스트 결제가 완료되었습니다. 실제 과금 연동 시 서버에서 결제 승인 API까지 확인해 주세요.
        </p>
        <div className="mt-8 space-y-2 font-mono text-xs text-white/45">
          <p>orderId: {orderId}</p>
          <p>amount: {amount}</p>
        </div>
        <Link
          to="/"
          className="mt-8 inline-block border border-[#D4AF37]/40 px-6 py-2.5 text-sm text-[#D4AF37] transition hover:bg-[#D4AF37]/10"
        >
          메인으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
