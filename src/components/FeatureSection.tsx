import { MotionReveal } from './MotionReveal'

const items = [
  {
    title: '그날의 마음이, 늦지 않게',
    body: '바쁜 하루 끝에 남긴 인사도, 봉안당의 자리까지 조용히 이어집니다. 멀리 있어도 오늘 나눈 온기가 그대로 닿도록, 마음을 서두르지 않아도 괜찮습니다.',
  },
  {
    title: '은은한 빛, 투명한 온기',
    body: '기계의 차가움은 걷어내고, 아이의 진심이 담긴 온기만 투명하게 흐르도록 설계했습니다. 보이지 않는 연결로, 그 자리만큼은 부드럽고 따뜻하게 머뭅니다.',
  },
  {
    title: '끊기지 않는 이야기',
    body: '하루가 길어도, 마음이 먼 날에도 아이와의 대화가 이어지도록 곁에 머뭅니다. 기술은 보이지 않는 곳에서 묵묵히, 아이와 당신을 잇는 가장 따뜻한 대화가 끊이지 않게 지켜줍니다.',
  },
]

export function FeatureSection() {
  return (
    <section className="border-b border-[#D4AF37]/10 px-8 py-28 sm:py-40 md:px-12">
      <div className="mx-auto max-w-5xl">
        <MotionReveal className="mb-20 text-center md:mb-24">
          <p className="mb-4 font-sans text-[11px] uppercase tracking-[0.38em] text-[#D4AF37]/65">
            Our promise
          </p>
          <h2 className="font-serif text-[1.65rem] leading-snug text-[#D4AF37] sm:text-3xl md:text-[2.15rem]">
            아이와 다시 연결되는
            <br className="sm:hidden" /> 따뜻한 경험을 먼저 담았습니다
          </h2>
        </MotionReveal>

        <div className="grid gap-16 sm:grid-cols-3 sm:gap-12 md:gap-16">
          {items.map((item, i) => (
            <MotionReveal
              key={item.title}
              delay={i * 0.08}
              className={
                i === 0
                  ? 'flex flex-col border-t border-[#D4AF37]/15 pt-12 sm:border-t-0 sm:pt-0'
                  : 'flex flex-col border-t border-[#D4AF37]/15 pt-12 sm:border-l sm:border-t-0 sm:border-[#D4AF37]/12 sm:pl-12 sm:pt-0 md:pl-16'
              }
            >
              <h3 className="font-serif text-xl text-[#D4AF37] sm:text-[1.35rem]">{item.title}</h3>
              <p className="mt-6 flex-1 font-sans text-[15px] leading-[1.85] text-white/68">
                {item.body}
              </p>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
