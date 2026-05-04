import { useEffect, useMemo, useState } from 'react'
import { MobileTopBar } from '../layout/MobileShell'

type Props = {
  petName: string | null
}

const INTRO_LINES = [
  '이 연결은,\n이제 시작입니다',
  '아직 이 아이의 이야기는\n남겨진 적이 없어요',
  '지금,\n처음으로 들어보시겠어요?',
]

function buildFirstMessage(petName: string | null): string {
  const name = petName?.trim() || '이 아이'
  return `${name}가 오늘 가장 먼저 전하고 싶었던 마음이에요.\n\n"기다려줘서 고마워요.\n오늘부터 내 이야기를, 여기에서 천천히 들려줄게요."`
}

export function TagStartExperience({ petName }: Props) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const firstMessage = useMemo(() => buildFirstMessage(petName), [petName])

  useEffect(() => {
    let step = 0
    const timer = window.setInterval(() => {
      step += 1
      setVisibleCount(step)
      if (step >= INTRO_LINES.length) {
        window.clearInterval(timer)
      }
    }, 850)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isTransitioning) return
    const timer = window.setTimeout(() => {
      const nextUrl = `https://connect.eternalbeam.com/main?entry=tag&petName=${encodeURIComponent(
        petName?.trim() || '',
      )}`
      window.location.href = nextUrl
    }, 800)
    return () => window.clearTimeout(timer)
  }, [isTransitioning, petName])

  return (
    <main className="flex min-h-dvh flex-col bg-[#0e0e0c] text-white">
      <MobileTopBar />
      <section className="mx-auto flex w-full flex-1 flex-col justify-center px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-md space-y-5 text-center">
          {INTRO_LINES.map((line, idx) => (
            <p
              key={line}
              className={`whitespace-pre-line font-serif text-[1.35rem] leading-relaxed text-[rgba(240,232,216,0.9)] transition-all duration-700 sm:text-[1.55rem] ${
                visibleCount > idx ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
              }`}
            >
              {line}
            </p>
          ))}
        </div>

        {visibleCount >= INTRO_LINES.length && (
          <div className="fade-up mx-auto mt-12 max-w-md">
            <button
              type="button"
              onClick={() => setMessage(firstMessage)}
              className="eb-main-letter-cta w-full px-5 py-4 font-serif text-[1.05rem] tracking-wide"
            >
              첫 메시지 받아보기
            </button>
          </div>
        )}

        {message && (
          <article className="fade-up mx-auto mt-6 max-w-md rounded-sm border border-[rgba(180,140,60,0.22)] bg-[rgba(255,255,255,0.03)] px-5 py-6">
            <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#c9a227]/75">First Message</p>
            <p className="mt-3 whitespace-pre-line font-serif text-[15px] font-light leading-[1.95] text-[rgba(240,232,216,0.88)]">
              {message}
            </p>
            <button
              type="button"
              onClick={() => setIsTransitioning(true)}
              disabled={isTransitioning}
              className="eb-main-letter-cta mt-6 w-full px-5 py-3.5 font-serif text-[1.02rem] tracking-wide disabled:opacity-70"
            >
              다음 이야기 듣기
            </button>
          </article>
        )}

        {isTransitioning && (
          <div className="fade-up mx-auto mt-6 max-w-md rounded-sm border border-[rgba(180,140,60,0.2)] bg-[rgba(0,0,0,0.35)] px-5 py-6 text-center">
            <p className="whitespace-pre-line font-serif text-[1.12rem] leading-relaxed text-[#c9a227]">
              {'이제,\n이 아이의 이야기가 이어집니다'}
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
