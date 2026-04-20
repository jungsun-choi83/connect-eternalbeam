import { MotionReveal } from './MotionReveal'

export function SubscriptionSection() {
  return (
    <section className="px-8 py-24 sm:py-32 md:px-12">
      <div className="mx-auto max-w-3xl">
        <MotionReveal>
          <div className="border border-white/8 bg-black/25 px-10 py-14 sm:px-14 sm:py-16">
            <h2 className="font-serif text-2xl text-[#D4AF37] sm:text-[1.65rem]">이어지는 대화를 위해</h2>
            <p className="mt-8 font-sans text-[15px] leading-[1.9] text-white/68">
              1년 뒤에도 아이와의 대화를 멈추지 않도록, 최소한의 유지비(월 전송 관리비)만으로
              운영됩니다. 부담을 줄이고, 마음이 닿는 시간은 조금 더 길게 남기고 싶었습니다.
            </p>
            <p className="mt-6 font-sans text-[15px] leading-[1.9] text-white/48">
              갱신 전에는 앱 알림과 메일로 먼저 알려 드리며, 원하시지 않으시면 그때 해지하실 수
              있어요. 이터널 커넥트에 담긴 추억은 기기에서 열람 가능한 범위 안에서 남습니다.
              (전송·동기화는 구독 기간에 한해 제공됩니다.)
            </p>
          </div>
        </MotionReveal>

        <MotionReveal delay={0.08} className="mt-20 text-center">
          <p className="font-sans text-xs tracking-wide text-white/28">
            © {new Date().getFullYear()} Eternal Beam · 이터널 커넥트 안내
          </p>
        </MotionReveal>
      </div>
    </section>
  )
}
