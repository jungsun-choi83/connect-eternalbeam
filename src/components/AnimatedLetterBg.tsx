import { motion } from 'framer-motion'

const lines = [
  '엄마, 아빠, 오늘도 햇살이 참 좋아요.',
  '그때 같이 달리던 길, 아직도 따뜻해요.',
  '사랑한다는 말, 늘 곁에 있어요.',
]

export function AnimatedLetterBg() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="animate-mist-drift absolute -left-1/4 top-0 h-[120%] w-[150%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.1)_0%,transparent_55%)] blur-3xl" />
      <div
        className="absolute -right-1/4 bottom-0 h-[90%] w-[130%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(120,90,160,0.06)_0%,transparent_50%)] blur-3xl"
        style={{ animation: 'mist-drift 22s ease-in-out infinite reverse' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,175,55,0.05),transparent_45%)]" />

      <div className="absolute inset-0 flex items-center justify-center opacity-[0.2]">
        <motion.img
          src="/soul-trace-letter.png"
          alt=""
          className="h-[min(78vh,640px)] w-auto max-w-[92%] rounded-2xl object-contain shadow-[0_0_80px_rgba(212,175,55,0.1)]"
          initial={{ opacity: 0.2, scale: 0.98 }}
          animate={{ opacity: [0.16, 0.26, 0.16], scale: [0.98, 1, 0.98] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'blur(1.2px) saturate(0.85)' }}
        />
      </div>

      <div className="absolute inset-x-0 top-[18%] flex flex-col items-center gap-6 px-6 text-center">
        {lines.map((text, i) => (
          <motion.p
            key={text}
            className="max-w-xl font-sans text-sm leading-relaxed text-white/22 sm:text-base"
            initial={{ opacity: 0, y: 12 }}
            animate={{
              opacity: [0.18, 0.4, 0.18],
              y: [0, -6, 0],
            }}
            transition={{
              duration: 8 + i * 1.4,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 1.2,
            }}
          >
            {text}
          </motion.p>
        ))}
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#000000_78%)]" />
    </div>
  )
}
