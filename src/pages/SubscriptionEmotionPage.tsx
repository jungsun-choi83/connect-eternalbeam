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
          className="whitespace-pre-line text-center font-serif text-[1.08rem] leading-relaxed text-[#D4AF37]"
        >
          {line}
        </motion.p>
      ))}
    </div>
  )
}

type Step = 'home' | 'reply' | 'sent' | 'arrived'

export function SubscriptionEmotionPage() {
  const [params] = useSearchParams()
  const [step, setStep] = useState<Step>('home')
  const [selectedEmotion, setSelectedEmotion] = useState<(typeof EMOTIONS)[number] | null>(null)
  const [replyText, setReplyText] = useState('')
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null)

  const email = params.get('email')?.trim() || ''
  const todayMessage = useMemo(() => readTodayMessage(), [])

  useEffect(() => {
    if (step !== 'sent') return
    let cancelled = false

    const hour = new Date().getHours()
    const time: 'morning' | 'night' | 'rain' | 'random' =
      hour < 11 ? 'morning' : hour >= 20 ? 'night' : 'random'
    const emotionMap: Record<string, 'miss' | 'thanks' | 'calm' | 'playful'> = {
      '보고 싶어': 'miss',
      고마워: 'thanks',
      미안해: 'calm',
      '오늘 생각났어': 'playful',
    }
    const memoryMap: Record<string, 'walk' | 'food' | 'calling_name' | 'touch'> = {
      '보고 싶어': 'walk',
      고마워: 'calling_name',
      미안해: 'touch',
      '오늘 생각났어': 'food',
    }

    void generatePetMessage({
      time,
      emotion: selectedEmotion ? emotionMap[selectedEmotion] : 'miss',
      memory: selectedEmotion ? memoryMap[selectedEmotion] : 'walk',
      user_action: 'reply',
      character: {
        personality: 'calm',
        tone: 'quiet',
      },
    })
      .then((msg) => {
        if (!cancelled) setGeneratedMessage(msg)
      })
      .catch(() => {
        if (!cancelled) setGeneratedMessage(null)
      })

    const timer = window.setTimeout(() => setStep('arrived'), 5200)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [step, selectedEmotion])

  const submitReply = () => {
    if (!selectedEmotion && !replyText.trim()) {
      window.alert('마음을 한 가지 골라 주시거나 짧게 남겨 주세요.')
      return
    }
    setGeneratedMessage(null)
    setStep('sent')
  }

  const arrivedMessage = useMemo(() => {
    if (generatedMessage?.trim()) return generatedMessage
    const emotionLine = selectedEmotion ? `${selectedEmotion}라는 마음, 잘 도착했어요.` : '네가 남긴 마음, 잘 도착했어요.'
    const short = replyText.trim()
    if (!short) return emotionLine
    return `${emotionLine}\n"${short.slice(0, 80)}${short.length > 80 ? '…' : ''}"`
  }, [selectedEmotion, replyText, generatedMessage])

  return (
    <div className="min-h-dvh bg-black px-6 py-10 text-white sm:px-10">
      <div className="mx-auto w-full max-w-xl">
        <AnimatePresence mode="wait">
          {step === 'home' && (
            <motion.section key="home" {...panelMotion} className="flex min-h-[78dvh] flex-col">
              <SequenceLines lines={['오늘의 메시지']} />
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
                className="mt-auto w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-4 font-serif text-[1.05rem] tracking-wide text-[#D4AF37]"
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
                onClick={submitReply}
                className="mt-auto w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-4 font-serif text-[1.05rem] tracking-wide text-[#D4AF37]"
              >
                메시지 남기기
              </motion.button>
            </motion.section>
          )}

          {step === 'sent' && (
            <motion.section key="sent" {...panelMotion} className="flex min-h-[78dvh] flex-col justify-center">
              <SequenceLines
                lines={['메시지를 남겼습니다', '', '아이의 답장은', '조금 뒤에 도착할 거예요']}
              />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="mt-12 text-center font-sans text-xs tracking-[0.18em] text-white/40"
              >
                기다림 중...
              </motion.div>
            </motion.section>
          )}

          {step === 'arrived' && (
            <motion.section key="arrived" {...panelMotion} className="flex min-h-[78dvh] flex-col">
              <SequenceLines lines={['답장이 도착했습니다']} />
              <div className="mt-8 border border-[#D4AF37]/20 bg-black/45 px-5 py-6">
                <p className="whitespace-pre-line font-sans text-[15px] leading-[1.9] text-white/88">
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
                  className="w-full border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-4 font-serif text-[1.05rem] tracking-wide text-[#D4AF37]"
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
