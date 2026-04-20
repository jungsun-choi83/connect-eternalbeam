import { motion } from 'framer-motion'
import { useEffect, useRef, useState, type TouchEvent } from 'react'
import type { SoulTracePayload } from '../lib/soulTraceIngest'

type Props = {
  payload: SoulTracePayload
  onStartSubscription?: (email: string) => void | Promise<void>
  onUpgrade?: () => void | Promise<void>
}

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
}

const SLIDE_COUNT = 3

export function MobileEmotionFunnel({ payload, onStartSubscription, onUpgrade }: Props) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [email, setEmail] = useState(payload.email ?? '')
  const sliderRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setEmail(payload.email ?? '')
  }, [payload.email])

  const letter = payload.letter?.trim() || '아직 도착한 편지가 없습니다.'

  const goToSlide = (index: number) => {
    const bounded = Math.max(0, Math.min(SLIDE_COUNT - 1, index))
    setActiveSlide(bounded)
  }

  const goNext = () => goToSlide(activeSlide + 1)
  const goPrev = () => goToSlide(activeSlide - 1)

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0]?.clientX ?? null)
  }

  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return
    const endX = e.changedTouches[0]?.clientX ?? touchStartX
    const delta = endX - touchStartX
    const threshold = 48
    if (delta <= -threshold) goNext()
    if (delta >= threshold) goPrev()
    setTouchStartX(null)
  }

  const submitSubscription = async () => {
    if (!email.trim()) {
      window.alert('다시 이어가기 위한 이메일을 남겨 주세요.')
      return
    }
    await onStartSubscription?.(email.trim())
  }

  const submitUpgrade = async () => {
    await onUpgrade?.()
  }

  return (
    <main className="min-h-dvh overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute left-0 right-0 top-5 z-20 flex items-center justify-center gap-2">
        {[0, 1, 2].map((idx) => (
          <span
            key={idx}
            className={`h-1.5 rounded-full transition-all ${
              idx === activeSlide ? 'w-8 bg-[#D4AF37]' : 'w-3 bg-white/25'
            }`}
          />
        ))}
      </div>

      <div
        ref={sliderRef}
        className="flex h-dvh w-full touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translate3d(-${activeSlide * 100}%,0,0)`,
          transition: 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <section className="flex h-dvh w-full shrink-0 flex-col px-6 pb-8 pt-12 sm:px-10">
          <motion.div key={`s1-${activeSlide}`} {...fadeIn} className="flex h-full flex-col">
            <p className="text-center font-sans text-[11px] uppercase tracking-[0.34em] text-[#D4AF37]/75">
              소울트레이스에서 도착한 편지
            </p>
            <div className="mt-6 flex-1 overflow-hidden border border-[#D4AF37]/18 bg-black/45 px-5 py-6 sm:px-8 sm:py-8">
              <p className="h-full overflow-auto whitespace-pre-wrap font-sans text-[15px] leading-[1.95] text-white/86">
                {letter}
              </p>
            </div>
            <p className="mt-7 whitespace-pre-line text-center font-serif text-[1.1rem] leading-relaxed text-[#D4AF37]/90">
              {'이 편지는 지금 한 번 도착한 메시지입니다\n\n하지만,\n아이의 이야기는 여기서 끝나지 않습니다'}
            </p>
            <button
              type="button"
              onClick={goNext}
              className="mt-auto w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-4 font-serif text-[1.05rem] tracking-wide text-[#D4AF37] transition hover:bg-[#D4AF37]/18"
            >
              다음
            </button>
          </motion.div>
        </section>

        <section className="flex h-dvh w-full shrink-0 flex-col px-6 pb-8 pt-12 sm:px-10">
          <motion.div key={`s2-${activeSlide}`} {...fadeIn} className="flex h-full flex-col">
            <h2 className="text-center font-serif text-[1.75rem] leading-snug text-[#D4AF37] sm:text-[2rem]">
              아이와의 이야기는 계속됩니다
            </h2>
            <p className="mt-10 whitespace-pre-line text-center font-serif text-[1.12rem] leading-relaxed text-white/86">
              {'아이의 마음은\n하루에 한 번,\n혹은 어느 순간에 조용히 도착합니다'}
            </p>
            <p className="mt-8 text-center font-sans text-sm text-white/56">
              기다림 끝에 도착하는 마음을 경험하세요
            </p>
            <p className="mt-8 text-center font-serif text-3xl tracking-tight text-[#D4AF37]">월 ₩0,000</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="다시 만날 이메일"
              className="mt-6 w-full border border-white/15 bg-black/50 px-4 py-3 font-sans text-sm text-white/90 outline-none focus:border-[#D4AF37]/45"
            />
            <div className="mt-auto space-y-2">
              <button
                type="button"
                onClick={submitSubscription}
                className="w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-4 font-serif text-[1.05rem] tracking-wide text-[#D4AF37] transition hover:bg-[#D4AF37]/18"
              >
                지금 시작하기
              </button>
              <button
                type="button"
                onClick={goNext}
                className="w-full py-2 text-center font-sans text-xs tracking-wide text-white/45"
              >
                다음 보기
              </button>
            </div>
          </motion.div>
        </section>

        <section className="flex h-dvh w-full shrink-0 flex-col px-6 pb-8 pt-12 sm:px-10">
          <motion.div key={`s3-${activeSlide}`} {...fadeIn} className="flex h-full flex-col">
            <h2 className="text-center font-serif text-[1.65rem] leading-snug text-[#D4AF37] sm:text-[1.9rem]">
              그 메시지를 눈앞에서 만나는 방법
            </h2>
            <p className="mt-10 whitespace-pre-line text-center font-serif text-[1.12rem] leading-relaxed text-white/86">
              {'아이의 편지를\n빛으로 간직하세요\n\n시간이 지나도 사라지지 않도록'}
            </p>
            <p className="mt-10 text-center font-serif text-3xl tracking-tight text-[#D4AF37]">₩000,000</p>
            <div className="mt-auto space-y-2">
              <button
                type="button"
                onClick={submitUpgrade}
                className="w-full border border-white/15 bg-transparent px-5 py-4 font-serif text-[1.05rem] tracking-wide text-white/80 transition hover:border-white/30 hover:bg-white/5"
              >
                이 순간을 남기기
              </button>
              <button
                type="button"
                onClick={goPrev}
                className="w-full py-2 text-center font-sans text-xs tracking-wide text-white/45"
              >
                이전 보기
              </button>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  )
}
