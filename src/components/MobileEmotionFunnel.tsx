import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react'
import type { SoulTracePayload } from '../lib/soulTraceIngest'

type Props = {
  payload: SoulTracePayload
  onStartSubscription?: (email: string) => void | Promise<void>
  onUpgrade?: (email: string) => void | Promise<void>
  entry?: string | null
  petName?: string | null
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
}

const SLIDE_COUNT = 2

function buildTagStarterStory(petName: string | null): string {
  const name = petName?.trim() || '이 아이'
  return `오늘 도착한 이야기\n\n${name}가 이제 막 문을 열고, 첫 마음을 전해요.\n\n"오늘부터는 내 이야기가,\n여기서 천천히 이어질 거예요."`
}

export function MobileEmotionFunnel({ payload, onStartSubscription, onUpgrade, entry, petName }: Props) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [email, setEmail] = useState(payload.email ?? '')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const confirmTimerRef = useRef<number | null>(null)
  const isTagEntry = entry === 'tag'

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

  const letter = useMemo(() => {
    if (isTagEntry) return buildTagStarterStory(petName ?? null)
    return payload.letter?.trim() || '아직 도착한 편지가 없습니다.'
  }, [isTagEntry, payload.letter, petName])

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
    if (!isTagEntry && !email.trim()) {
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
    await onStartSubscription?.(email.trim() || '')
    setConfirmOpen(false)
  }

  const submitUpgrade = async () => {
    if (!isTagEntry && !email.trim()) {
      window.alert('구매 진행을 위해 이메일을 남겨 주세요.')
      return
    }
    await onUpgrade?.(email.trim() || '')
  }

  return (
    <main className="min-h-dvh overflow-hidden bg-[#0e0e0c] text-white">
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
        <section className="flex h-dvh w-full shrink-0 flex-col bg-[#0e0e0c] px-4 pb-8 pt-10 sm:px-8 sm:pt-12">
          <motion.div key={`s1-${activeSlide}`} {...fadeIn} className="fade-up flex h-full min-h-0 flex-col">
            <p className="eb-main-letter-kicker fade-up px-1">
              {isTagEntry ? '지금, 처음 도착한 이야기' : '소울트레이스에서 도착한 편지'}
            </p>
            <div className="eb-main-letter-panel mt-5 flex min-h-0 flex-1 flex-col sm:mt-6">
              <span className="eb-main-letter-quote" aria-hidden>
                &#x201C;
              </span>
              <p className="eb-main-letter-body h-full min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap">
                {letter}
              </p>
            </div>
            <p className="fade-up mt-6 whitespace-pre-line text-center font-serif text-[1.05rem] leading-[1.75] text-[#D4AF37] sm:mt-8 sm:text-[1.1rem]">
              {'이 편지는 지금 한 번 도착한 메시지입니다\n\n하지만,\n아이의 이야기는 여기서 끝나지 않습니다'}
            </p>
            <button
              type="button"
              onClick={goNext}
              className="eb-main-letter-cta mt-auto w-full px-5 py-4 font-serif text-[1.05rem] tracking-[0.06em]"
            >
              다음
            </button>
          </motion.div>
        </section>

        <section className="flex h-dvh w-full shrink-0 flex-col bg-[#0e0e0c] px-6 pb-8 pt-12 sm:px-10">
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
              이제, 원하는 방식으로{'\n'}이어갈 수 있어요
            </h2>
            <p className="fade-up mt-8 whitespace-pre-line text-center font-serif text-[1.02rem] leading-relaxed text-white/78">
              {'지금 이 마음을 곁에 간직하거나,\n하루하루 새로운 이야기를 이어갈 수 있어요'}
            </p>
            <div className="mt-6 rounded-md border border-[#D4AF37]/25 bg-black/45 px-4 py-4">
              <p className="font-sans text-[11px] uppercase tracking-[0.18em] text-[#D4AF37]/75">
                OPTION 1 — 명패 구매
              </p>
              <p className="mt-2 font-serif text-[1.1rem] text-[#D4AF37]">이 메시지를 눈앞에서 만나기</p>
              <p className="mt-2 font-sans text-sm text-white/65">잉크 기반 아크릴 명패로 주문하실 수 있어요.</p>
              <button
                type="button"
                onClick={submitUpgrade}
                className="aurora-button mt-4 w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-3.5 font-serif text-[1.02rem] tracking-wide text-[#D4AF37]"
              >
                명패 구매하기
              </button>
            </div>
            <div className="mt-4 rounded-md border border-white/12 bg-black/30 px-4 py-4">
              <p className="font-sans text-[11px] uppercase tracking-[0.18em] text-white/55">
                OPTION 2 — 구독하기
              </p>
              <p className="mt-2 font-serif text-[1.02rem] text-white/82">아이의 메시지를 계속 받아보기</p>
              <p className="mt-2 font-sans text-[12px] leading-relaxed text-white/50">
                구독이 완료되면 전용 공간에서 매달 편지와 기록을 이어가요.
              </p>
              <p className="mt-2 font-sans text-xs text-[#D4AF37]/85">₩5,900 / 월</p>
              <button
                type="button"
                onClick={requestSubscriptionConfirm}
                className="mt-3 w-full border border-white/20 bg-black/35 px-5 py-3.5 font-serif text-[0.98rem] tracking-wide text-white/75 transition hover:border-white/35 hover:bg-black/45"
              >
                구독하기
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
                구독하고 대시보드로 이어갈까요?
              </h3>
              <p className="mt-5 whitespace-pre-line text-center font-serif text-[1.05rem] leading-relaxed text-white/80">
                {'결제 후 로그인하면\n편지·앨범·기억·아카이브를 한 화면에서 이어갈 수 있어요'}
              </p>
              <p className="mt-6 text-center font-serif text-2xl text-[#D4AF37]">₩5,900 / 월</p>
              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={submitSubscription}
                  className="aurora-button w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 py-3 font-serif text-[#D4AF37]"
                >
                  구독 진행하기
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
