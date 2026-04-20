import { MotionReveal } from './MotionReveal'

export function SubscriptionSection() {
  return (
    <section className="px-8 py-24 sm:py-32 md:px-12">
      <div className="mx-auto max-w-3xl">
        <MotionReveal>
          <div className="border border-[#D4AF37]/18 bg-black/25 px-10 py-14 text-center sm:px-14 sm:py-16">
            <h2 className="whitespace-pre-line font-serif text-2xl leading-relaxed text-[#D4AF37] sm:text-[1.8rem]">
              {'이건 단순한 물건이 아닙니다.\n\n사라지지 않도록,\n아이의 마음을 붙잡아 두는 방법입니다.\n\n시간이 지나도,\n다시 만날 수 있도록.'}
            </h2>
            <p className="mx-auto mt-8 max-w-2xl font-sans text-[15px] leading-[1.9] text-white/58">
              오늘의 편지가 내일에도 남고, 오래된 시간도 다시 만나는 마음으로 이어집니다.
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
