import { MotionReveal } from './MotionReveal'

export function SubscriptionSection() {
  return (
    <section className="px-8 py-24 sm:py-32 md:px-12">
      <div className="mx-auto max-w-3xl">
        <MotionReveal>
          <div className="border border-[#D4AF37]/18 bg-black/25 px-10 py-14 text-center sm:px-14 sm:py-16">
            <h2 className="font-serif text-2xl leading-relaxed text-[#D4AF37] sm:text-[1.8rem]">
              이건 단순한 기기가 아닙니다.
              <br />
              아이와의 시간을 계속 이어주는 방식입니다.
            </h2>
            <p className="mx-auto mt-8 max-w-2xl font-sans text-[15px] leading-[1.9] text-white/58">
              이터널 커넥트는 결제와 기능보다 먼저, 남아 있는 마음이 사라지지 않도록 도와주는 연결의
              루틴을 만듭니다.
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
