import { useEffect, useState } from 'react'
import {
  ST_KEY_EMAIL,
  ST_KEY_LETTER,
  STORAGE_EMAIL,
  STORAGE_LETTER,
  type SoulTracePayload,
} from '../lib/soulTraceIngest'

type Props = {
  payload: SoulTracePayload
}

function persistLetterAndEmail(letter: string, email: string) {
  try {
    localStorage.setItem(ST_KEY_LETTER, letter)
    localStorage.setItem(STORAGE_LETTER, letter)
    localStorage.setItem(ST_KEY_EMAIL, email)
    localStorage.setItem(STORAGE_EMAIL, email)
  } catch {
    /* ignore */
  }
}

export function SoulTraceLetterHero({ payload }: Props) {
  const [letter, setLetter] = useState(payload.letter ?? '')
  const [email, setEmail] = useState(payload.email ?? '')

  useEffect(() => {
    setLetter(payload.letter ?? '')
    setEmail(payload.email ?? '')
  }, [payload.letter, payload.email])

  const hasContent = letter.trim().length > 0 || email.trim().length > 0
  if (!hasContent) return null

  return (
    <div className="border-b border-[#D4AF37]/20 bg-gradient-to-b from-[#D4AF37]/8 to-black/40">
      <div className="mx-auto max-w-3xl px-8 py-10">
        <p className="text-center font-sans text-[11px] uppercase tracking-[0.38em] text-[#D4AF37]/75">
          소울트레이스에서 가져온 편지입니다
        </p>
        <label className="mt-6 block">
          <span className="sr-only">편지 내용</span>
          <textarea
            value={letter}
            onChange={(e) => {
              const v = e.target.value
              setLetter(v)
              persistLetterAndEmail(v, email)
            }}
            rows={8}
            className="w-full resize-y border border-white/12 bg-black/35 px-4 py-4 font-sans text-[15px] leading-relaxed text-white/90 outline-none placeholder:text-white/30 focus:border-[#D4AF37]/35"
            placeholder="소울 트레이스에서 불러온 편지가 여기에 표시됩니다."
          />
        </label>
        <label className="mt-5 block">
          <span className="mb-1.5 block text-center font-sans text-xs text-white/40">이메일 (매칭·연락용)</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              const v = e.target.value
              setEmail(v)
              persistLetterAndEmail(letter, v)
            }}
            className="w-full border border-white/12 bg-black/35 px-4 py-3 font-sans text-sm text-white/88 outline-none focus:border-[#D4AF37]/35"
            placeholder="you@example.com"
          />
        </label>
      </div>
    </div>
  )
}
