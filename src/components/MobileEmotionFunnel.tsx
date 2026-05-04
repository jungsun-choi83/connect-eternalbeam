import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react'
import { MobileBottomDock, MobileTopBar } from './layout/MobileShell'
import type { SoulTracePayload } from '../lib/soulTraceIngest'

type Props = {
  payload: SoulTracePayload
  onStartSubscription?: (email: string) => void | Promise<void>
  onUpgrade?: (email: string) => void | Promise<void>
  entry?: string | null
  petName?: string | null
}

const SLIDE_COUNT = 2

const sheetVariants = {
  initial: { opacity: 0, y: 28 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const },
  },
}

function buildTagStarterStory(petName: string | null): string {
  const name = petName?.trim() || '이 아이'
  return `오늘 도착한 이야기\n\n${name}가 이제 막 문을 열고, 첫 마음을 전해요.\n\n"오늘부터는 내 이야기가,\n여기서 천천히 이어질 거예요."`
}

export function MobileEmotionFunnel({ payload, onStartSubscription, onUpgrade, entry, petName }: Props) {
  const [activeSlide, setActiveSlide] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [email, setEmail] = useState(payload.email ?? '')
  const [confirmOpen, setConfirmOpen] = useState(false)
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
    const threshold = 56
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

  const letterKicker = isTagEntry ? '지금, 처음 도착한 이야기' : '소울트레이스에서 도착한 편지'

  const headerSubtitle =
    activeSlide === 0 ? (
      <p className="eb-main-letter-kicker text-center">{letterKicker}</p>
    ) : (
      <p className="text-center font-sans text-[10px] uppercase tracking-[0.28em] text-[#c9a227]/75">
        아이의 메시지가 빛으로 도착하는 순간
      </p>
    )

  return (
    <main className="flex min-h-dvh flex-col overflow-hidden bg-[#0e0e0c] text-white">
      <MobileTopBar subtitle={headerSubtitle} />

      {/* 단계 표시 */}
      <div className="pointer-events-none flex shrink-0 justify-center gap-1.5 border-b border-[rgba(255,255,255,0.04)] py-2">
        {[0, 1].map((idx) => (
          <span
            key={idx}
            className={`h-1 rounded-full transition-all duration-300 ${
              idx === activeSlide ? 'w-6 bg-[#c9a227]' : 'w-1.5 bg-white/20'
            }`}
          />
        ))}
      </div>

      <div
        className="relative flex min-h-0 flex-1 flex-col touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          {activeSlide === 0 && (
            <motion.div
              key="slide-letter"
              variants={sheetVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-2 pt-1">
                <div className="eb-main-letter-panel mt-2">
                  <span className="eb-main-letter-quote" aria-hidden>
                    &#x201C;
                  </span>
                  <p className="eb-main-letter-body whitespace-pre-wrap">{letter}</p>
                </div>
              </div>

              <MobileBottomDock>
                <p className="text-center font-sans text-[11px] leading-snug tracking-wide text-[#c9a227]/95">
                  이 편지는 지금 한 번 도착한 메시지입니다
                </p>
                <p className="mt-2 text-center font-serif text-[13px] leading-relaxed text-[rgba(240,232,216,0.82)]">
                  하지만, 아이의 이야기는 여기서 끝나지 않습니다
                </p>
                <button type="button" onClick={goNext} className="eb-main-letter-cta mt-5 w-full py-3.5 font-sans text-[15px] font-medium tracking-wide">
                  다음
                </button>
              </MobileBottomDock>
            </motion.div>
          )}

          {activeSlide === 1 && (
            <motion.div
              key="slide-options"
              variants={sheetVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-4 pt-4">
                <div className="sparkle-wrap relative mx-auto mb-5 min-h-[32px] max-w-sm">
                  <span className="sparkle s1" />
                  <span className="sparkle s2" />
                  <span className="sparkle s3" />
                  <span className="sparkle s4" />
                </div>
                <h2 className="aurora-title whitespace-pre-line text-center font-serif text-[1.55rem] leading-snug sm:text-[1.75rem]">
                  이제, 원하는 방식으로{'\n'}이어갈 수 있어요
                </h2>
                <p className="mt-7 whitespace-pre-line text-center font-serif text-[0.98rem] leading-[1.75] text-[rgba(240,232,216,0.78)]">
                  {'지금 이 마음을 곁에 간직하거나,\n하루하루 새로운 이야기를 이어갈 수 있어요'}
                </p>
                <div className="mt-8 rounded-sm border border-[rgba(180,140,60,0.22)] bg-[rgba(255,255,255,0.03)] px-4 py-5">
                  <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[#c9a227]/80">
                    Option 1 — 명패 구매
                  </p>
                  <p className="mt-2 font-serif text-[1.08rem] text-[#D4AF37]">이 메시지를 눈앞에서 만나기</p>
                  <p className="mt-2 font-sans text-[13px] leading-relaxed text-[rgba(240,232,216,0.62)]">
                    잉크 기반 아크릴 명패로 주문하실 수 있어요.
                  </p>
                  <button
                    type="button"
                    onClick={submitUpgrade}
                    className="eb-option-secondary mt-5 w-full py-3.5 font-serif text-[1rem] tracking-wide text-[#D4AF37]"
                  >
                    명패 구매하기
                  </button>
                </div>
                <div className="mt-4 rounded-sm border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] px-4 py-5">
                  <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[rgba(240,232,216,0.45)]">
                    Option 2 — 구독하기
                  </p>
                  <p className="mt-2 font-serif text-[1.02rem] text-[rgba(240,232,216,0.88)]">
                    아이의 메시지를 계속 받아보기
                  </p>
                  <p className="mt-2 font-sans text-[12px] leading-relaxed text-[rgba(240,232,216,0.48)]">
                    구독이 완료되면 전용 공간에서 매달 편지와 기록을 이어가요.
                  </p>
                  <p className="mt-3 font-sans text-[13px] text-[#c9a227]/90">₩5,900 / 월</p>
                  <button
                    type="button"
                    onClick={requestSubscriptionConfirm}
                    className="eb-option-ghost mt-4 w-full py-3.5 font-serif text-[0.98rem] tracking-wide text-[rgba(240,232,216,0.82)]"
                  >
                    구독하기
                  </button>
                </div>
              </div>

              <MobileBottomDock>
                <button
                  type="button"
                  onClick={goPrev}
                  className="w-full py-3 text-center font-sans text-[12px] tracking-wide text-[rgba(240,232,216,0.45)] transition hover:text-[rgba(240,232,216,0.65)]"
                >
                  ← 이전
                </button>
              </MobileBottomDock>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:items-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="eb-modal-sheet w-full max-w-[390px] border border-[rgba(180,140,60,0.28)] bg-[#121210] px-5 py-6 text-white shadow-[0_-12px_48px_rgba(0,0,0,0.5)]"
            >
              <h3 className="text-center font-serif text-[1.15rem] text-[#D4AF37]">구독하고 대시보드로 이어갈까요?</h3>
              <p className="mt-5 whitespace-pre-line text-center font-serif text-[0.98rem] leading-relaxed text-[rgba(240,232,216,0.82)]">
                {'결제 후 로그인하면\n편지·앨범·기억·아카이브를 한 화면에서 이어갈 수 있어요'}
              </p>
              <p className="mt-6 text-center font-serif text-[1.65rem] text-[#c9a227]">₩5,900 / 월</p>
              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={submitSubscription}
                  className="eb-main-letter-cta w-full py-3.5 font-sans text-[15px] font-medium"
                >
                  구독 진행하기
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                  className="w-full border border-[rgba(255,255,255,0.12)] bg-transparent py-3 font-sans text-[13px] text-[rgba(240,232,216,0.65)]"
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
