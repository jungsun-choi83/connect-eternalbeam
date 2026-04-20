import { MotionReveal } from './MotionReveal'

export function FeatureSection() {
  return (
    <section className="border-b border-[#D4AF37]/10 px-8 py-24 sm:py-32 md:px-12">
      <div className="mx-auto max-w-4xl">
        <MotionReveal className="text-center">
          <p className="mb-4 font-sans text-[11px] uppercase tracking-[0.38em] text-[#D4AF37]/65">
            계속되는 연결
          </p>
          <h2 className="font-serif text-[1.65rem] leading-snug text-[#D4AF37] sm:text-3xl md:text-[2.05rem]">
            아이와의 대화는 계속됩니다
          </h2>
        </MotionReveal>

        <MotionReveal delay={0.06} className="mt-14 border border-white/10 bg-black/25 px-8 py-10 sm:px-12">
          <ul className="space-y-5 font-sans text-[15px] leading-relaxed text-white/76">
            <li>- 이 편지는 끝나지 않습니다</li>
            <li>- 시간이 지나도 계속 이어지고</li>
            <li>- 언제든 다시 만날 수 있습니다</li>
          </ul>
        </MotionReveal>
      </div>
    </section>
  )
}
