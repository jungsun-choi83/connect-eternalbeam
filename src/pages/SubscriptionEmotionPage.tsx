import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { generatePetMessage } from '../lib/petMessageApi'
import { ST_KEY_LETTER, STORAGE_LETTER } from '../lib/soulTraceIngest'

const EMOTIONS = ['보고 싶어', '고마워', '미안해', '오늘 생각났어'] as const

const panelMotion = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
}

function readTodayMessage(): string {
  try {
    return (
      localStorage.getItem(ST_KEY_LETTER)?.trim() ||
      localStorage.getItem(STORAGE_LETTER)?.trim() ||
      '오늘은 조용히 네 이름을 불러 보았어. 아직도 너의 마음이 여기 머물러 있는 것 같아.'
    )
  } catch {
    return '오늘은 조용히 네 이름을 불러 보았어. 아직도 너의 마음이 여기 머물러 있는 것 같아.'
  }
}

function SequenceLines({ lines, baseDelay = 0 }: { lines: string[]; baseDelay?: number }) {
  return (
    <div className="space-y-2">
      {lines.map((line, i) => (
        <motion.p
          key={`${line}-${i}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: baseDelay + i * 0.14, ease: [0.22, 1, 0.36, 1] }}
          className={`whitespace-pre-line text-center font-serif text-[1.08rem] leading-relaxed ${
            line.includes('빛으로 도착하는 순간') ? 'aurora-title' : 'text-[#D4AF37]'
          }`}
        >
          {line}
        </motion.p>
      ))}
    </div>
  )
}

type Step = 'home' | 'reply' | 'sent' | 'arrived'
const ONE_HOUR_MS = 60 * 60 * 1000
const LS_USER_MESSAGE = 'ec_userMessage'
const LS_REPLY_TIME = 'ec_replyTime'
const LS_AI_MESSAGE = 'ec_aiMessage'
const LS_AI_MESSAGE_TIME = 'ec_aiMessageTime'

export function SubscriptionEmotionPage() {
  const [params] = useSearchParams()
  const [step, setStep] = useState<Step>('home')
  const [selectedEmotion, setSelectedEmotion] = useState<(typeof EMOTIONS)[number] | null>(null)
  const [replyText, setReplyText] = useState('')
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null)
  const [nextMessageTime, setNextMessageTime] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [checkingArrival, setCheckingArrival] = useState(false)

  const email = params.get('email')?.trim() || ''
  const todayMessage = useMemo(() => readTodayMessage(), [])
  useEffect(() => {
    let cancelled = false
    const rawUserMessage =
      typeof window !== 'undefined' ? localStorage.getItem(LS_USER_MESSAGE)?.trim() || '' : ''
    const cachedAiMessage =
      typeof window !== 'undefined' ? localStorage.getItem(LS_AI_MESSAGE)?.trim() || '' : ''
    const rawReplyTime = typeof window !== 'undefined' ? localStorage.getItem(LS_REPLY_TIME) : null
    const rawAiTime = typeof window !== 'undefined' ? localStorage.getItem(LS_AI_MESSAGE_TIME) : null
    const replyTime = Number(rawReplyTime ?? 0)
    const validReplyTime = Number.isFinite(replyTime) && replyTime > 0 ? replyTime : 0
    const aiMessageTime = Number(rawAiTime ?? 0)
    const validAiTime = Number.isFinite(aiMessageTime) && aiMessageTime > 0 ? aiMessageTime : 0

    if (!rawUserMessage) return

    if (cachedAiMessage && validAiTime >= validReplyTime && validReplyTime > 0) {
      setGeneratedMessage(cachedAiMessage)
      setStep('arrived')
      return
    }

    const now = Date.now()
    const targetTime = validReplyTime > 0 ? validReplyTime + ONE_HOUR_MS : now + ONE_HOUR_MS
    if (now < targetTime) {
      setStep('sent')
      setNextMessageTime(targetTime)
      return
    }

    const hour = new Date().getHours()
    const time: 'morning' | 'night' | 'rain' | 'random' =
      hour < 11 ? 'morning' : hour >= 20 ? 'night' : 'random'

    void generatePetMessage({
      time,
      emotion: 'thanks',
      memory: 'calling_name',
      user_action: 'reply',
      character: {
        personality: 'calm',
        tone: 'quiet',
      },
    })
      .then((msg) => {
        if (cancelled) return
        localStorage.setItem(LS_AI_MESSAGE, msg)
        localStorage.setItem(LS_AI_MESSAGE_TIME, String(Date.now()))
        setGeneratedMessage(msg)
        setStep('arrived')
        window.alert('답장이 도착했습니다')
      })
      .catch(() => {
        if (cancelled) return
        const fallback = '조금 생각하고 있었어\n곧 다시 올게'
        localStorage.setItem(LS_AI_MESSAGE, fallback)
        localStorage.setItem(LS_AI_MESSAGE_TIME, String(Date.now()))
        setGeneratedMessage(fallback)
        setStep('arrived')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const onSubmitReply = async () => {
    if (!selectedEmotion && !replyText.trim()) {
      window.alert('마음을 한 가지 골라 주시거나 짧게 남겨 주세요.')
      return
    }
    setSubmitting(true)
    const userMessage = replyText.trim() || selectedEmotion || '보고 싶어'
    localStorage.setItem(LS_USER_MESSAGE, userMessage)
    localStorage.setItem(LS_REPLY_TIME, String(Date.now()))
    localStorage.removeItem(LS_AI_MESSAGE)
    localStorage.removeItem(LS_AI_MESSAGE_TIME)
    setGeneratedMessage(null)
    setNextMessageTime(Date.now() + ONE_HOUR_MS)
    setReplyText('')
    setSelectedEmotion(null)
    setStep('sent')
    setSubmitting(false)
  }

  const checkArrival = async () => {
    const cachedAi = localStorage.getItem(LS_AI_MESSAGE)?.trim()
    const aiMessageTime = Number(localStorage.getItem(LS_AI_MESSAGE_TIME) ?? 0)
    const replyTime = Number(localStorage.getItem(LS_REPLY_TIME) ?? 0)
    if (cachedAi && Number.isFinite(aiMessageTime) && aiMessageTime >= replyTime) {
      setGeneratedMessage(cachedAi)
      setStep('arrived')
      return
    }

    const userMessage = localStorage.getItem(LS_USER_MESSAGE)?.trim() || ''
    if (!userMessage) {
      window.alert('아직 남긴 메시지가 없어요.')
      return
    }
    const targetTime = (Number.isFinite(replyTime) && replyTime > 0 ? replyTime : Date.now()) + ONE_HOUR_MS
    const now = Date.now()
    if (now < targetTime) {
      setNextMessageTime(targetTime)
      setStep('sent')
      window.alert('아직 답장이 도착하지 않았어요.\n조금 뒤에 다시 와주세요')
      return
    }

    setCheckingArrival(true)
    try {
      const hour = new Date().getHours()
      const time: 'morning' | 'night' | 'rain' | 'random' =
        hour < 11 ? 'morning' : hour >= 20 ? 'night' : 'random'
      const msg = await generatePetMessage({
        time,
        emotion: 'thanks',
        memory: 'calling_name',
        user_action: 'reply',
        character: {
          personality: 'calm',
          tone: 'quiet',
        },
      })
      localStorage.setItem(LS_AI_MESSAGE, msg)
      localStorage.setItem(LS_AI_MESSAGE_TIME, String(Date.now()))
      setGeneratedMessage(msg)
      setStep('arrived')
      window.alert('답장이 도착했습니다')
    } catch {
      const fallback = '조금 생각하고 있었어\n곧 다시 올게'
      localStorage.setItem(LS_AI_MESSAGE, fallback)
      localStorage.setItem(LS_AI_MESSAGE_TIME, String(Date.now()))
      setGeneratedMessage(fallback)
      setStep('arrived')
      window.alert('답장이 도착했습니다')
    } finally {
      setCheckingArrival(false)
    }
  }

  const resetLocalReplyState = () => {
    localStorage.removeItem(LS_USER_MESSAGE)
    localStorage.removeItem(LS_REPLY_TIME)
    localStorage.removeItem(LS_AI_MESSAGE)
    localStorage.removeItem(LS_AI_MESSAGE_TIME)
    setGeneratedMessage(null)
    setNextMessageTime(null)
    setReplyText('')
    setSelectedEmotion(null)
    setStep('home')
  }

  const arrivedMessage = useMemo(
    () => generatedMessage?.trim() || '조금 생각하고 있었어\n곧 다시 올게',
    [generatedMessage],
  )

  return (
    <div className="aurora-page min-h-dvh bg-black px-6 py-10 text-white sm:px-10">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={resetLocalReplyState}
            className="border border-white/20 px-3 py-1.5 text-[11px] tracking-wide text-white/65 transition hover:border-white/35 hover:text-white/85"
          >
            테스트 초기화
          </button>
        </div>
        <AnimatePresence mode="wait">
          {step === 'home' && (
            <motion.section key="home" {...panelMotion} className="fade-up flex min-h-[78dvh] flex-col">
              <div className="sparkle-wrap mb-1">
                <span className="sparkle s1" />
                <span className="sparkle s2" />
                <span className="sparkle s3" />
              </div>
              <SequenceLines lines={['아이의 메시지가 빛으로 도착하는 순간', '오늘의 메시지']} />
              <div className="mt-8 flex-1 border border-[#D4AF37]/20 bg-black/40 px-5 py-6">
                <p className="whitespace-pre-wrap font-sans text-[15px] leading-[1.95] text-white/88">
                  {todayMessage}
                </p>
              </div>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                type="button"
                onClick={() => setStep('reply')}
                className="aurora-button mt-auto w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-4 font-serif text-[1.05rem] tracking-wide text-[#D4AF37]"
              >
                답장 남기기
              </motion.button>
            </motion.section>
          )}

          {step === 'reply' && (
            <motion.section key="reply" {...panelMotion} className="flex min-h-[78dvh] flex-col">
              <SequenceLines lines={['지금 떠오른 마음을 남겨 주세요']} />
              <div className="mt-8 grid grid-cols-2 gap-2">
                {EMOTIONS.map((emotion) => (
                  <button
                    key={emotion}
                    type="button"
                    onClick={() => setSelectedEmotion(emotion)}
                    className={`border px-4 py-2.5 text-sm transition ${
                      selectedEmotion === emotion
                        ? 'border-[#D4AF37]/65 bg-[#D4AF37]/15 text-[#D4AF37]'
                        : 'border-white/20 bg-black/40 text-white/75'
                    }`}
                  >
                    {emotion}
                  </button>
                ))}
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                maxLength={240}
                rows={5}
                className="mt-4 w-full resize-none border border-white/15 bg-black/40 px-4 py-3 font-sans text-sm leading-relaxed text-white/88 outline-none focus:border-[#D4AF37]/45"
                placeholder="짧게 남겨 주세요"
              />
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                type="button"
                onClick={onSubmitReply}
                disabled={submitting}
                className="aurora-button mt-auto w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-4 font-serif text-[1.05rem] tracking-wide text-[#D4AF37]"
              >
                {submitting ? '남기는 중...' : '메시지 남기기'}
              </motion.button>
            </motion.section>
          )}

          {step === 'sent' && (
            <motion.section key="sent" {...panelMotion} className="flex min-h-[78dvh] flex-col justify-center">
              <SequenceLines
                lines={['아직 답장이 도착하지 않았어요', '', '조금 뒤에 다시 와주세요']}
              />
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="mt-8 text-center font-sans text-sm text-white/65"
              >
                {nextMessageTime
                  ? `예상 도착: ${new Date(nextMessageTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : '조금만 기다려 주세요'}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mt-12 space-y-3"
              >
                <button
                  type="button"
                  onClick={() => setStep('home')}
                  className="aurora-button w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-4 font-serif text-[1.05rem] tracking-wide text-[#D4AF37]"
                >
                  기다릴게요
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void checkArrival()
                  }}
                  disabled={checkingArrival}
                  className="w-full py-2 text-center font-sans text-xs tracking-[0.18em] text-white/40"
                >
                  {checkingArrival ? '확인 중...' : '지금 확인하기'}
                </button>
              </motion.div>
            </motion.section>
          )}

          {step === 'arrived' && (
            <motion.section key="arrived" {...panelMotion} className="flex min-h-[78dvh] flex-col">
              <div className="sparkle-wrap mb-1">
                <span className="sparkle s1" />
                <span className="sparkle s2" />
                <span className="sparkle s4" />
              </div>
              <SequenceLines lines={['답장이 도착했습니다']} />
              <div className="mt-8 border border-[#D4AF37]/20 bg-black/45 px-5 py-6">
                <p className="aurora-title whitespace-pre-line text-center font-serif text-[1.2rem] leading-[1.9]">
                  {arrivedMessage}
                </p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mt-auto space-y-2"
              >
                <button
                  type="button"
                  onClick={() => setStep('reply')}
                  className="aurora-button w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-4 font-serif text-[1.05rem] tracking-wide text-[#D4AF37]"
                >
                  다시 남기기
                </button>
                <Link
                  to={email ? `/?email=${encodeURIComponent(email)}` : '/'}
                  className="block w-full py-2 text-center font-sans text-xs tracking-wide text-white/45"
                >
                  홈으로 돌아가기
                </Link>
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
