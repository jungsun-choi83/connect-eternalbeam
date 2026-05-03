import { useEffect, useMemo, useState } from 'react'

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
    <main className="aurora-page flex min-h-dvh items-center px-6 py-12 text-white sm:px-10">
      <section className="mx-auto w-full max-w-xl">
        <div className="space-y-5 text-center">
          {INTRO_LINES.map((line, idx) => (
            <p
              key={line}
              className={`whitespace-pre-line font-serif text-[1.45rem] leading-relaxed transition-all duration-700 sm:text-[1.8rem] ${
                visibleCount > idx ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
              }`}
            >
              {line}
            </p>
          ))}
        </div>

        {visibleCount >= INTRO_LINES.length && (
          <div className="fade-up mt-12">
            <button
              type="button"
              onClick={() => setMessage(firstMessage)}
              className="aurora-button w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-4 font-serif text-[1.08rem] tracking-wide text-[#D4AF37]"
            >
              첫 메시지 받아보기
            </button>
          </div>
        )}

        {message && (
          <article className="fade-up mt-6 rounded-md border border-[#D4AF37]/25 bg-black/45 px-5 py-6">
            <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-[#D4AF37]/70">First Message</p>
            <p className="mt-3 whitespace-pre-line font-sans text-[15px] leading-[1.9] text-white/86">{message}</p>
            <button
              type="button"
              onClick={() => setIsTransitioning(true)}
              disabled={isTransitioning}
              className="aurora-button mt-5 w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-3.5 font-serif text-[1.02rem] tracking-wide text-[#D4AF37] disabled:opacity-70"
            >
              다음 이야기 듣기
            </button>
          </article>
        )}

        {isTransitioning && (
          <div className="fade-up mt-6 rounded-md border border-[#D4AF37]/25 bg-black/55 px-5 py-6 text-center">
            <p className="whitespace-pre-line font-serif text-[1.22rem] leading-relaxed text-[#D4AF37]">
              {'이제,\n이 아이의 이야기가 이어집니다'}
            </p>
          </div>
        )}
      </section>
    </main>
  )
}
