import { motion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-12% 0px -8% 0px' },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
}

type Props = {
  children: ReactNode
  className?: string
  delay?: number
} & Omit<HTMLMotionProps<'div'>, 'children'>

export function MotionReveal({ children, className, delay = 0, ...rest }: Props) {
  return (
    <motion.div
      {...fadeUp}
      transition={{ ...fadeUp.transition, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
