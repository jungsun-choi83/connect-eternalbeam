import { motion } from 'framer-motion'
import { AnimatedLetterBg } from './AnimatedLetterBg'
import { MotionReveal } from './MotionReveal'

/**
 * 시제품 사진/영상 — 대표님 촬영물로 교체하세요.
 */
export function ProductShowcase() {
  return (
    <section
      id="showcase"
      className="relative overflow-hidden border-b border-[#D4AF37]/10"
      aria-label="이터널 커넥트 소개"
    >
      <AnimatedLetterBg />

      <div className="relative z-10 mx-auto max-w-4xl px-8 pb-28 pt-24 sm:pb-36 sm:pt-32 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] as const }}
          className="mb-20 text-center md:mb-28"
        >
          <p className="mb-6 font-sans text-[11px] uppercase tracking-[0.42em] text-[#D4AF37]/75">
            아이를 위한 빛의 창 · Eternal Connect
          </p>
          <h1 className="font-serif text-[1.85rem] font-normal leading-[1.35] tracking-tight text-[#D4AF37] sm:text-4xl md:text-[2.75rem]">
            사라진 것이 아니라,
            <br />
            아직 남아 있는 것처럼
          </h1>
          <p className="mx-auto mt-10 max-w-xl font-sans text-base leading-[1.85] text-white/68 sm:text-[17px]">
            아이의 마음은 아직, 여기 있습니다.
          </p>
          <p className="mx-auto mt-8 max-w-2xl whitespace-pre-line font-serif text-[1.15rem] leading-relaxed text-[#D4AF37]/88 sm:text-[1.25rem]">
            {'아이의 메시지는 여기서 끝나지 않습니다.\n이터널 커넥트에서는\n그 마음이 계속 도착합니다.'}
          </p>
        </motion.div>

        <MotionReveal>
          <div className="relative overflow-hidden rounded-sm border border-[#D4AF37]/20 bg-black/40 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
            <div className="aspect-[16/10] w-full md:aspect-[2.2/1]">
              <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-[radial-gradient(ellipse_at_50%_20%,rgba(212,175,55,0.06),transparent_50%),linear-gradient(165deg,rgba(20,18,16,0.9)_0%,#000_55%)] px-10 py-16">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#D4AF37]/30 text-[#D4AF37]/90">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-serif text-lg text-[#D4AF37]/95 sm:text-xl">시제품 영상 · 사진</p>
                  <p className="mx-auto mt-4 max-w-md font-sans text-sm leading-[1.75] text-white/45">
                    이곳에 이터널 커넥트의 모습을 담아 주세요.
                    <span className="mt-2 block text-[13px] text-white/32">
                      추모의 자리에 어울리는 여백을 두었습니다.
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <p className="border-t border-[#D4AF37]/10 px-6 py-4 text-center font-sans text-[10px] uppercase tracking-[0.35em] text-white/25">
              Exhibition placeholder
            </p>
          </div>
        </MotionReveal>
      </div>
    </section>
  )
}
