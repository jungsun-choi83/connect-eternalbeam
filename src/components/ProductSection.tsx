import { useState, type FormEvent } from 'react'
import { MotionReveal } from './MotionReveal'

type Props = {
  onPackagePurchase?: () => void
  onSubscription?: (email: string) => void
}

export function ProductSection({ onPackagePurchase, onSubscription }: Props) {
  const [email, setEmail] = useState('')

  const handleSubscription = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      window.alert('다시 이어가기 위한 이메일을 남겨 주세요.')
      return
    }
    onSubscription?.(email.trim())
  }

  return (
    <section
      id="order"
      className="border-b border-[#D4AF37]/10 px-8 py-28 sm:py-36 md:px-12"
    >
      <div className="mx-auto max-w-5xl">
        <MotionReveal className="text-center">
          <p className="mb-4 font-sans text-[11px] uppercase tracking-[0.38em] text-[#D4AF37]/65">
            시작하기
          </p>
          <h2 className="font-serif text-[1.65rem] leading-snug text-[#D4AF37] sm:text-3xl md:text-[2.1rem]">
            구독을 먼저 시작하고,
            <br className="hidden sm:block" />
            <span className="text-white/88">원하실 때 빛으로 간직하세요</span>
          </h2>
        </MotionReveal>

        <div className="mt-20 space-y-10">
          <MotionReveal delay={0.05}>
            <article className="border border-[#D4AF37]/35 bg-[#D4AF37]/[0.06] px-10 py-12 sm:px-12 sm:py-14">
              <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]/68">
                Main plan
              </p>
              <h3 className="mt-4 font-serif text-2xl text-[#D4AF37] sm:text-[1.8rem]">
                아이의 메시지를 계속 받기
              </h3>
              <p className="mt-5 whitespace-pre-line font-sans text-[15px] leading-relaxed text-white/55">
                {'아이의 마음은\n하루에 한 번,\n혹은 어느 순간에 조용히 도착합니다.'}
              </p>
              <ul className="mt-10 space-y-4 font-sans text-[15px] leading-relaxed text-white/78">
                <li className="flex gap-3">
                  <span className="text-[#D4AF37]/85">✔</span>
                  <span>기다리면 도착합니다</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#D4AF37]/85">✔</span>
                  <span>시간이 쌓입니다</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[#D4AF37]/85">✔</span>
                  <span>우리 아이만의 말로 남습니다</span>
                </li>
              </ul>

              <div className="mt-12 flex flex-col gap-6 border-t border-white/10 pt-10 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="font-sans text-xs tracking-wide text-white/35">월 구독</p>
                  <p className="mt-2 font-serif text-3xl tracking-tight text-[#D4AF37] sm:text-4xl">
                    월 구독 ₩0,000
                  </p>
                </div>
                <form onSubmit={handleSubscription} className="w-full max-w-md space-y-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="다시 만날 이메일"
                    className="w-full border border-white/15 bg-black/45 px-4 py-3 font-sans text-sm text-white/90 outline-none focus:border-[#D4AF37]/45"
                    autoComplete="email"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-6 py-3.5 font-sans text-sm font-medium tracking-wide text-[#D4AF37] transition hover:border-[#D4AF37]/65 hover:bg-[#D4AF37]/18"
                  >
                    지금, 다시 이어가기
                  </button>
                </form>
              </div>
            </article>
          </MotionReveal>

          <MotionReveal delay={0.12}>
            <article className="border border-white/10 bg-black/20 px-10 py-12 sm:px-12 sm:py-14">
              <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-[#D4AF37]/55">
                Upgrade
              </p>
              <h3 className="mt-4 font-serif text-2xl text-[#D4AF37] sm:text-[1.65rem]">
                그 메시지를 눈앞에서 만나는 방법
              </h3>
              <p className="mt-5 whitespace-pre-line font-sans text-[15px] leading-relaxed text-white/55">
                {'아이의 편지를\n빛으로 간직하세요.\n시간이 지나도 사라지지 않도록.'}
              </p>
              <ul className="mt-10 space-y-5 font-sans text-[15px] leading-relaxed text-white/75">
                <li className="flex gap-3">
                  <span className="mt-2.5 h-px w-6 shrink-0 bg-[#D4AF37]/40" />
                  <span>빛의 편지 디스플레이</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2.5 h-px w-6 shrink-0 bg-[#D4AF37]/40" />
                  <span>전용 케이스</span>
                </li>
                <li className="flex gap-3">
                  <span className="mt-2.5 h-px w-6 shrink-0 bg-[#D4AF37]/40" />
                  <span>1년 동안 이어지는 메시지</span>
                </li>
              </ul>
              <div className="mt-12 border-t border-white/8 pt-10">
                <p className="font-sans text-xs tracking-wide text-white/35">
                  아이의 메시지를 간직하는 방법
                </p>
                <p className="mt-2 font-serif text-3xl tracking-tight text-[#D4AF37] sm:text-4xl">
                  ₩000,000
                </p>
                <p className="mt-3 font-sans text-xs text-white/38">금액은 확정 시 안내드립니다.</p>
              </div>
              <div className="mt-10">
                <button
                  type="button"
                  onClick={onPackagePurchase}
                  className="w-full border border-white/15 bg-transparent px-6 py-3.5 font-sans text-sm font-medium tracking-wide text-white/75 transition hover:border-white/25 hover:bg-white/5"
                >
                  이 순간을 남기기
                </button>
              </div>
            </article>
          </MotionReveal>
        </div>
      </div>
    </section>
  )
}
