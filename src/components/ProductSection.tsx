import { MotionReveal } from './MotionReveal'

type Props = {
  onPackagePurchase?: () => void
  onSubscription?: () => void
}

export function ProductSection({ onPackagePurchase, onSubscription }: Props) {
  return (
    <section
      id="order"
      className="border-b border-[#D4AF37]/10 px-8 py-28 sm:py-36 md:px-12"
    >
      <div className="mx-auto max-w-5xl">
        <MotionReveal className="text-center">
          <p className="mb-4 font-sans text-[11px] uppercase tracking-[0.38em] text-[#D4AF37]/65">
            선택
          </p>
          <h2 className="font-serif text-[1.65rem] leading-snug text-[#D4AF37] sm:text-3xl md:text-[2.1rem]">
            이터널 커넥트로 처음부터 시작하거나,
            <br className="hidden sm:block" />
            <span className="text-white/88"> 이미 이어온 대화만 이어가실 수 있어요</span>
          </h2>
        </MotionReveal>

        <div className="mt-20 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <MotionReveal delay={0.05} className="flex h-full">
            <article className="flex w-full flex-col border border-[#D4AF37]/18 bg-black/30 px-10 py-12 sm:px-12 sm:py-14">
              <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]/60">
                Option 1
              </p>
              <h3 className="mt-4 font-serif text-2xl text-[#D4AF37] sm:text-[1.65rem]">
                이터널 커넥트 패키지
              </h3>
              <p className="mt-5 font-sans text-[15px] leading-relaxed text-white/55">
                아직 <span className="text-white/75">아이를 위한 빛의 창</span> 기기가 없으신 분께.
              </p>
              <ul className="mt-10 space-y-5 font-sans text-[15px] leading-relaxed text-white/75">
                <li className="flex gap-3">
                  <span className="mt-2.5 h-px w-6 shrink-0 bg-[#D4AF37]/40" />
                  <span>기기 본체</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2.5 h-px w-6 shrink-0 bg-[#D4AF37]/40" />
                  <span>전용 케이스</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2.5 h-px w-6 shrink-0 bg-[#D4AF37]/40" />
                  <span>1년 전송권</span>
                </li>
              </ul>
              <div className="mt-12 border-t border-white/8 pt-10">
                <p className="font-sans text-xs tracking-wide text-white/35">패키지 가격</p>
                <p className="mt-2 font-serif text-3xl tracking-tight text-[#D4AF37] sm:text-4xl">
                  000,000원
                </p>
                <p className="mt-3 font-sans text-xs text-white/38">금액은 확정 시 안내드립니다.</p>
              </div>
              <div className="mt-10">
                <button
                  type="button"
                  onClick={onPackagePurchase}
                  className="w-full border border-[#D4AF37]/35 bg-transparent px-6 py-3.5 font-sans text-sm font-medium tracking-wide text-[#D4AF37] transition hover:border-[#D4AF37]/55 hover:bg-[#D4AF37]/10"
                >
                  패키지로 신청하기
                </button>
              </div>
            </article>
          </MotionReveal>

          <MotionReveal delay={0.1} className="flex h-full">
            <article className="flex w-full flex-col border border-white/10 bg-black/20 px-10 py-12 sm:px-12 sm:py-14">
              <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]/60">
                Option 2
              </p>
              <h3 className="mt-4 font-serif text-2xl text-[#D4AF37] sm:text-[1.65rem]">
                실시간 대화 전송 서비스
              </h3>
              <p className="mt-2 font-sans text-sm font-normal text-white/55">구독으로 이용</p>
              <p className="mt-5 font-sans text-[15px] leading-relaxed text-white/55">
                이미 기기를 가지고 계시거나, 앱에서만 우선 이어가고 싶으신 분께.{' '}
                <span className="text-white/68">보이지 않는 연결</span>로 마음만 먼저 보내실 수
                있어요.
              </p>
              <ul className="mt-10 space-y-5 font-sans text-[15px] leading-relaxed text-white/75">
                <li className="flex gap-3">
                  <span className="mt-2.5 h-px w-6 shrink-0 bg-[#D4AF37]/40" />
                  <span>실시간 대화 전송 서비스 단독 이용</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2.5 h-px w-6 shrink-0 bg-[#D4AF37]/40" />
                  <span>월 단위 갱신 · 원하실 때 조정 가능</span>
                </li>
              </ul>
              <div className="mt-12 border-t border-white/8 pt-10">
                <p className="font-sans text-xs tracking-wide text-white/35">월 구독</p>
                <p className="mt-2 font-serif text-3xl tracking-tight text-[#D4AF37] sm:text-4xl">
                  월 0,000원
                </p>
                <p className="mt-3 font-sans text-xs text-white/38">금액은 런칭 시 안내드립니다.</p>
              </div>
              <div className="mt-10">
                <button
                  type="button"
                  onClick={onSubscription}
                  className="w-full border border-white/15 bg-transparent px-6 py-3.5 font-sans text-sm font-medium tracking-wide text-white/75 transition hover:border-white/25 hover:bg-white/5"
                >
                  구독으로 신청하기
                </button>
              </div>
            </article>
          </MotionReveal>
        </div>
      </div>
    </section>
  )
}
