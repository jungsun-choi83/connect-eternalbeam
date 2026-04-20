import { motion } from 'framer-motion'

type Props = {
  onConnect?: () => void
}

export function ConnectCtaSection({ onConnect }: Props) {
  return (
    <section
      id="connect"
      className="border-b border-[#D4AF37]/10 px-8 py-24 sm:py-32 md:px-12"
      aria-label="예약 및 결제"
    >
      <div className="mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <p className="mb-8 font-sans text-[11px] uppercase tracking-[0.4em] text-[#D4AF37]/55">
            결제 진행
          </p>
          <button
            type="button"
            onClick={onConnect}
            className="group relative w-full max-w-xl border border-[#D4AF37]/45 bg-[#D4AF37]/[0.08] px-8 py-7 font-serif text-xl tracking-wide text-[#D4AF37] transition hover:border-[#D4AF37]/70 hover:bg-[#D4AF37]/12 sm:py-8 sm:text-2xl md:text-[1.75rem]"
          >
            <span className="relative z-10">지금, 다시 이어가기</span>
            <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.12),transparent_70%)] opacity-0 transition group-hover:opacity-100" />
          </button>
          <p className="mx-auto mt-10 max-w-md whitespace-pre-line font-sans text-sm leading-[1.85] text-white/42">
            {'이건 대화가 아니라,\n기다림 끝에 도착하는 마음입니다'}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
