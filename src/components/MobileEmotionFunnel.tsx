import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState, type TouchEvent } from 'react'
import type { SoulTracePayload } from '../lib/soulTraceIngest'

type Props = {
  payload: SoulTracePayload
  onStartSubscription?: (email: string) => void | Promise<void>
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
}

const SLIDE_COUNT = 2

export function MobileEmotionFunnel({ payload, onStartSubscription }: Props) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [email, setEmail] = useState(payload.email ?? '')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const confirmTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setEmail(payload.email ?? '')
  }, [payload.email])

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current !== null) {
        window.clearTimeout(confirmTimerRef.current)
      }
    }
  }, [])

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

  const requestSubscriptionConfirm = () => {
    if (!email.trim()) {
      window.alert('다시 이어가기 위한 이메일을 남겨 주세요.')
      return
    }
    if (confirmTimerRef.current !== null) {
      window.clearTimeout(confirmTimerRef.current)
    }
    confirmTimerRef.current = window.setTimeout(() => {
      setConfirmOpen(true)
      confirmTimerRef.current = null
    }, 300)
  }

  const submitSubscription = async () => {
    await onStartSubscription?.(email.trim())
    setConfirmOpen(false)
  }

  return (
    <main className="aurora-page min-h-dvh overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute left-0 right-0 top-5 z-20 flex items-center justify-center gap-2">
        {[0, 1].map((idx) => (
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
          <motion.div key={`s1-${activeSlide}`} {...fadeIn} className="fade-up flex h-full flex-col">
            <p className="fade-up text-center font-sans text-[11px] uppercase tracking-[0.34em] text-[#D4AF37]/75">
              소울트레이스에서 도착한 편지
            </p>
            <div className="mt-6 flex-1 overflow-hidden border border-[#D4AF37]/18 bg-black/45 px-5 py-6 sm:px-8 sm:py-8">
              <p className="h-full overflow-auto whitespace-pre-wrap font-sans text-[15px] leading-[1.95] text-white/86">
                {letter}
              </p>
            </div>
            <p className="fade-up mt-7 whitespace-pre-line text-center font-serif text-[1.1rem] leading-relaxed text-[#D4AF37]/90">
              {'이 편지는 지금 한 번 도착한 메시지입니다\n\n하지만,\n아이의 이야기는 여기서 끝나지 않습니다'}
            </p>
            <button
              type="button"
              onClick={goNext}
              className="aurora-button mt-auto w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-4 font-serif text-[1.05rem] tracking-wide text-[#D4AF37] transition hover:bg-[#D4AF37]/18"
            >
              다음
            </button>
          </motion.div>
        </section>

        <section className="flex h-dvh w-full shrink-0 flex-col px-6 pb-8 pt-12 sm:px-10">
          <motion.div key={`s2-${activeSlide}`} {...fadeIn} className="fade-up flex h-full flex-col">
            <p className="fade-up text-center font-serif text-[1rem] text-[#D4AF37]/80">
              아이의 메시지가 빛으로 도착하는 순간
            </p>
            <div className="sparkle-wrap mt-3">
              <span className="sparkle s1" />
              <span className="sparkle s2" />
              <span className="sparkle s3" />
              <span className="sparkle s4" />
            </div>
            <h2 className="aurora-title whitespace-pre-line text-center font-serif text-[1.75rem] leading-snug sm:text-[2rem]">
              아이의 메시지를{'\n'}계속 받아보시겠어요?
            </h2>
            <p className="fade-up mt-10 whitespace-pre-line text-center font-serif text-[1.12rem] leading-relaxed text-white/86">
              {'하루에 한 번,\n아이의 마음이 도착합니다'}
            </p>
            <p className="mt-8 text-center font-serif text-3xl tracking-tight text-[#D4AF37]">₩5,900 / 월</p>
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
                onClick={requestSubscriptionConfirm}
                className="aurora-button w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-4 font-serif text-[1.05rem] tracking-wide text-[#D4AF37] transition hover:bg-[#D4AF37]/18"
              >
                지금 시작하기
              </button>
            </div>
          </motion.div>
        </section>
      </div>

      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md border border-[#D4AF37]/30 bg-black/95 px-6 py-6 text-white"
            >
              <h3 className="text-center font-serif text-xl text-[#D4AF37]">
                아이의 메시지를 계속 받아보시겠어요?
              </h3>
              <p className="mt-5 whitespace-pre-line text-center font-serif text-[1.05rem] leading-relaxed text-white/80">
                {'하루에 한 번,\n아이의 마음이 도착합니다'}
              </p>
              <p className="mt-6 text-center font-serif text-2xl text-[#D4AF37]">₩5,900 / 월</p>
              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={submitSubscription}
                  className="aurora-button w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 py-3 font-serif text-[#D4AF37]"
                >
                  지금 시작하기
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="w-full border border-white/15 bg-transparent py-3 font-sans text-sm text-white/75"
                >
                  조금 더 볼게요
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
