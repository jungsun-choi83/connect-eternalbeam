import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getApiBase } from '../lib/apiBase'
import { EINK_RED, parseEInkLetter, type ParsedEInkLetter } from '../lib/einkLetterParse'

const DEVICE_SN_RE = /^[a-zA-Z0-9_-]{4,128}$/
const POLL_MS = Number(import.meta.env.VITE_EINK_POLL_MS) || 3_600_000

const FLASH_MS = 520
const SIGN_HOLD_MS = 480
const LINE_STEP_MS = 420
const TAGS_DELAY_MS = 350
const SETTLE_MS = 220

async function fetchMessage(
  base: string,
  deviceSn: string,
): Promise<{ latest_message: string; updated_at: number | null } | null> {
  const res = await fetch(`${base}/api/devices/${encodeURIComponent(deviceSn)}/message`)
  if (!res.ok) return null
  return res.json()
}

type Phase = 'static' | 'flash' | 'sign' | 'typing' | 'tags'

export function DisplayPage() {
  const { deviceSn: rawSn } = useParams<{ deviceSn: string }>()
  const deviceSn = rawSn ? decodeURIComponent(rawSn) : ''
  const valid = useMemo(() => Boolean(deviceSn && DEVICE_SN_RE.test(deviceSn)), [deviceSn])

  const base = getApiBase()

  const [snapshot, setSnapshot] = useState<{
    text: string
    updatedAt: number
    parsed: ParsedEInkLetter
  } | null>(null)

  const [phase, setPhase] = useState<Phase>('static')
  const [flashTick, setFlashTick] = useState(0)
  const [liveParsed, setLiveParsed] = useState<ParsedEInkLetter | null>(null)
  const [visibleBodyCount, setVisibleBodyCount] = useState(0)
  const [showTags, setShowTags] = useState(false)

  const timersRef = useRef<number[]>([])
  const lastHandledUpdatedAt = useRef<number | null>(null)
  const sequenceToken = useRef(0)
  const sequenceInProgress = useRef(false)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }, [])

  const runUpdateSequence = useCallback(
    (text: string, updatedAt: number) => {
      if (sequenceInProgress.current) return
      sequenceInProgress.current = true
      clearTimers()
      const token = ++sequenceToken.current
      const parsed = parseEInkLetter(text)
      setLiveParsed(parsed)
      setVisibleBodyCount(0)
      setShowTags(false)
      setPhase('flash')
      setFlashTick((n) => n + 1)

      const push = (fn: () => void, delay: number) => {
        timersRef.current.push(
          window.setTimeout(() => {
            if (sequenceToken.current !== token) return
            fn()
          }, delay),
        )
      }

      const bodyLen = parsed.bodyLines.length
      const hasTags = Boolean(parsed.tagsLine)

      let t = FLASH_MS
      push(() => setPhase('sign'), t)
      t += SIGN_HOLD_MS
      push(() => setPhase('typing'), t)

      if (bodyLen === 0) {
        if (hasTags) {
          t += TAGS_DELAY_MS
          push(() => {
            setPhase('tags')
            setShowTags(true)
          }, t)
        }
      } else {
        for (let i = 1; i <= bodyLen; i++) {
          t += LINE_STEP_MS
          const count = i
          push(() => setVisibleBodyCount(count), t)
        }
        if (hasTags) {
          t += TAGS_DELAY_MS
          push(() => {
            setPhase('tags')
            setShowTags(true)
          }, t)
        }
      }

      t += SETTLE_MS
      push(() => {
        setSnapshot({ text, updatedAt, parsed })
        setPhase('static')
        setLiveParsed(null)
        lastHandledUpdatedAt.current = updatedAt
        sequenceInProgress.current = false
      }, t)
    },
    [clearTimers],
  )

  useEffect(() => {
    if (!valid) return
    let cancelled = false

    const handlePayload = (j: { latest_message: string; updated_at: number | null } | null) => {
      if (cancelled || !j || sequenceInProgress.current) return
      const msg = j.latest_message ?? ''
      const ts = j.updated_at

      if (ts === null || ts === undefined) {
        if (!msg.trim()) {
          setSnapshot(null)
          lastHandledUpdatedAt.current = null
        }
        return
      }

      if (!msg.trim()) return

      if (lastHandledUpdatedAt.current === null) {
        const parsed = parseEInkLetter(msg)
        setSnapshot({ text: msg, updatedAt: ts, parsed })
        lastHandledUpdatedAt.current = ts
        return
      }

      if (ts > lastHandledUpdatedAt.current) {
        runUpdateSequence(msg, ts)
      }
    }

    void fetchMessage(base, deviceSn).then(handlePayload)

    const poll = window.setInterval(() => {
      void fetchMessage(base, deviceSn).then(handlePayload)
    }, POLL_MS)

    return () => {
      cancelled = true
      clearInterval(poll)
      clearTimers()
    }
  }, [base, deviceSn, valid, runUpdateSequence, clearTimers])

  const showStatic = phase === 'static'
  const staticParsed = snapshot?.parsed ?? null

  if (!valid) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white text-neutral-600">
        <p className="font-serif text-sm tracking-wide">유효하지 않은 기기 주소입니다.</p>
      </div>
    )
  }

  return (
    <div
      className="relative min-h-dvh overflow-hidden bg-[#FFFFFF] text-[#000000]"
      style={{ fontFamily: '"EB Garamond", "Times New Roman", serif' }}
    >
      <div
        className="pointer-events-none absolute inset-3 border border-[#000000]/8 md:inset-6"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle, #000000 0.45px, transparent 0.45px), radial-gradient(circle, #000000 0.35px, transparent 0.35px)',
          backgroundSize: '7px 7px, 11px 11px',
          backgroundPosition: '0 0, 3px 4px',
          opacity: 0.12,
        }}
      />

      <AnimatePresence mode="wait">
        {phase === 'flash' && (
          <motion.div
            key={flashTick}
            className="fixed inset-0 z-50 bg-[#000000]"
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 1, 0] }}
            transition={{ duration: FLASH_MS / 1000, times: [0, 0.72, 1], ease: 'linear' }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-2xl flex-col px-8 py-12 md:px-14 md:py-16">
        {showStatic && staticParsed && <StaticLetterBlock parsed={staticParsed} />}

        {!showStatic && liveParsed && (
          <SequenceLetterBlock
            phase={phase}
            parsed={liveParsed}
            visibleBodyCount={visibleBodyCount}
            showTags={showTags}
          />
        )}

        {showStatic && !staticParsed && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-lg font-medium tracking-[0.02em] text-[#1a1a1a] md:text-xl">
              이곳에 전해진 마음이 머뭅니다.
            </p>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-[#444444]">
              새 편지가 도착하면 화면이 한 번 갱신된 뒤, 이름과 글이 차례로 이어집니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StaticLetterBlock({ parsed }: { parsed: ParsedEInkLetter }) {
  return (
    <div className="flex flex-1 flex-col">
      {parsed.sign ? (
        <p
          className="text-center text-2xl font-semibold tracking-tight md:text-3xl"
          style={{ color: EINK_RED }}
        >
          {parsed.sign}
        </p>
      ) : null}
      <div className="mt-10 flex flex-1 flex-col gap-6 text-left">
        {parsed.bodyLines.map((line, i) => (
          <p
            key={i}
            className="text-[1.15rem] font-normal leading-[1.75] tracking-[0.01em] text-[#000000] md:text-[1.25rem] md:leading-[1.8]"
            style={{ fontFeatureSettings: '"kern" 1, "liga" 1' }}
          >
            {line}
          </p>
        ))}
      </div>
      {parsed.tagsLine ? (
        <p
          className="mt-12 text-center text-sm font-medium tracking-wide md:text-base"
          style={{ color: EINK_RED }}
        >
          {parsed.tagsLine}
        </p>
      ) : null}
    </div>
  )
}

function SequenceLetterBlock({
  phase,
  parsed,
  visibleBodyCount,
  showTags,
}: {
  phase: Phase
  parsed: ParsedEInkLetter
  visibleBodyCount: number
  showTags: boolean
}) {
  const showSign = phase === 'sign' || phase === 'typing' || phase === 'tags'
  const showBody = phase === 'typing' || phase === 'tags'

  return (
    <div className="flex flex-1 flex-col">
      {parsed.sign && showSign ? (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-center text-2xl font-semibold tracking-tight md:text-3xl"
          style={{ color: EINK_RED }}
        >
          {parsed.sign}
        </motion.p>
      ) : null}

      {showBody ? (
        <div className="mt-10 flex flex-1 flex-col gap-6 text-left">
          {parsed.bodyLines.slice(0, visibleBodyCount).map((line, i) => (
            <motion.p
              key={`${i}-${line.slice(0, 24)}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
              className="text-[1.15rem] font-normal leading-[1.75] tracking-[0.01em] text-[#000000] md:text-[1.25rem]"
            >
              {line}
            </motion.p>
          ))}
        </div>
      ) : null}

      {parsed.tagsLine && showTags ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.38 }}
          className="mt-12 text-center text-sm font-medium tracking-wide md:text-base"
          style={{ color: EINK_RED }}
        >
          {parsed.tagsLine}
        </motion.p>
      ) : null}
    </div>
  )
}
