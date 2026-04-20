import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { SoulTracePayload } from '../lib/soulTraceIngest'

type Props = {
  payload: SoulTracePayload
  onStartSubscription?: (email: string) => void | Promise<void>
  onUpgrade?: () => void | Promise<void>
}

const fade = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-12%' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
}

export function MobileEmotionFunnel({ payload, onStartSubscription, onUpgrade }: Props) {
  const step2Ref = useRef<HTMLElement | null>(null)
  const step3Ref = useRef<HTMLElement | null>(null)
  const [email, setEmail] = useState(payload.email ?? '')

  useEffect(() => {
    setEmail(payload.email ?? '')
  }, [payload.email])

  const letter = payload.letter?.trim() || '아직 도착한 편지가 없습니다.'

  const scrollTo = (target: HTMLElement | null) => {
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
    <main>
      <section className="flex min-h-dvh flex-col border-b border-[#D4AF37]/10 bg-black px-6 pb-8 pt-10 text-white sm:px-10">
        <motion.p
          {...fade}
          className="text-center font-sans text-[11px] uppercase tracking-[0.34em] text-[#D4AF37]/75"
        >
          소울트레이스에서 도착한 편지
        </motion.p>

        <div className="mt-6 flex flex-1 flex-col">
          <motion.div
            {...fade}
            className="flex-1 border border-[#D4AF37]/18 bg-black/45 px-5 py-6 sm:px-8 sm:py-8"
          >
            <p className="whitespace-pre-wrap font-sans text-[15px] leading-[1.95] text-white/86">{letter}</p>
          </motion.div>

          <motion.p
            {...fade}
            className="mt-8 whitespace-pre-line text-center font-serif text-[1.12rem] leading-relaxed text-[#D4AF37]/90"
          >
            {'이 편지는 지금 한 번 도착한 메시지입니다\n\n하지만,\n아이의 이야기는 여기서 끝나지 않습니다'}
          </motion.p>

          <motion.button
            {...fade}
            type="button"
            onClick={() => scrollTo(step2Ref.current)}
            className="mt-auto w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-4 font-serif text-[1.05rem] tracking-wide text-[#D4AF37] transition hover:bg-[#D4AF37]/18"
          >
            이 아이의 메시지를 계속 받기
          </motion.button>
        </div>
      </section>

      <section
        ref={step2Ref}
        className="flex min-h-dvh flex-col border-b border-[#D4AF37]/10 bg-black px-6 pb-8 pt-10 text-white sm:px-10"
      >
        <motion.div {...fade}>
          <h2 className="text-center font-serif text-[1.75rem] leading-snug text-[#D4AF37] sm:text-[2rem]">
            아이와의 이야기는 계속됩니다
          </h2>
          <p className="mt-8 whitespace-pre-line text-center font-serif text-[1.15rem] leading-relaxed text-white/86">
            {'아이의 마음은\n하루에 한 번,\n\n혹은 어느 순간에\n조용히 도착합니다'}
          </p>
          <p className="mt-6 text-center font-sans text-sm leading-relaxed text-white/56">
            기다림 끝에 도착하는 마음을 경험하세요
          </p>
          <ul className="mt-10 space-y-3 font-sans text-[15px] leading-relaxed text-white/80">
            <li>기다리면 도착합니다</li>
            <li>시간이 쌓입니다</li>
            <li>우리 아이의 말로 남습니다</li>
          </ul>
        </motion.div>

        <motion.div {...fade} className="mt-auto space-y-3">
          <p className="text-center font-serif text-3xl tracking-tight text-[#D4AF37]">월 ₩0,000</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="다시 만날 이메일"
            className="w-full border border-white/15 bg-black/50 px-4 py-3 font-sans text-sm text-white/90 outline-none focus:border-[#D4AF37]/45"
          />
          <button
            type="button"
            onClick={submitSubscription}
            className="w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-4 font-serif text-[1.05rem] tracking-wide text-[#D4AF37] transition hover:bg-[#D4AF37]/18"
          >
            지금, 다시 이어가기
          </button>
          <button
            type="button"
            onClick={() => scrollTo(step3Ref.current)}
            className="w-full py-2 text-center font-sans text-xs tracking-wide text-white/45"
          >
            빛으로 간직하는 방법 보기
          </button>
        </motion.div>
      </section>

      <section
        ref={step3Ref}
        className="flex min-h-dvh flex-col border-b border-[#D4AF37]/10 bg-black px-6 pb-8 pt-10 text-white sm:px-10"
      >
        <motion.div {...fade}>
          <p className="text-center font-sans text-[11px] uppercase tracking-[0.35em] text-[#D4AF37]/62">
            UPGRADE
          </p>
          <h2 className="mt-4 text-center font-serif text-[1.65rem] leading-snug text-[#D4AF37] sm:text-[1.9rem]">
            그 메시지를 눈앞에서 만나는 방법
          </h2>
          <p className="mt-8 whitespace-pre-line text-center font-serif text-[1.12rem] leading-relaxed text-white/86">
            {'아이의 편지를\n빛으로 간직하세요\n\n시간이 지나도\n사라지지 않도록'}
          </p>
          <ul className="mt-10 space-y-4 font-sans text-[15px] leading-relaxed text-white/80">
            <li>빛의 편지 디스플레이</li>
            <li>전용 케이스</li>
            <li>1년 동안 이어지는 메시지</li>
          </ul>
        </motion.div>

        <motion.div {...fade} className="mt-auto space-y-3">
          <p className="text-center font-serif text-3xl tracking-tight text-[#D4AF37]">₩000,000</p>
          <button
            type="button"
            onClick={submitUpgrade}
            className="w-full border border-white/15 bg-transparent px-5 py-4 font-serif text-[1.05rem] tracking-wide text-white/80 transition hover:border-white/30 hover:bg-white/5"
          >
            이 순간을 남기기
          </button>
        </motion.div>
      </section>

      <section className="flex min-h-[88dvh] items-center border-b border-[#D4AF37]/10 bg-black px-6 py-16 text-white sm:px-10">
        <motion.p
          {...fade}
          className="whitespace-pre-line text-center font-serif text-[1.45rem] leading-relaxed text-[#D4AF37] sm:text-[1.8rem]"
        >
          {'이건 단순한 물건이 아닙니다\n\n사라지지 않도록,\n아이의 마음을 붙잡아 두는 방법입니다\n\n시간이 지나도,\n다시 만날 수 있도록'}
        </motion.p>
      </section>
    </main>
  )
}
