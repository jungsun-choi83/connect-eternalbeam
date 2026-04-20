import { useEffect, useState } from 'react'
import { fetchAnonymousSession, type AnonymousSessionResponse } from '../../lib/anonymousApi'

type Props = {
  anonId: string | null
}

export function AnonLetterPreview({ anonId }: Props) {
  const [data, setData] = useState<AnonymousSessionResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!anonId) {
      setData(null)
      setErr(null)
      return
    }
    let cancelled = false
    setErr(null)
    fetchAnonymousSession(anonId)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e: unknown) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : '불러오지 못했습니다.')
      })
    return () => {
      cancelled = true
    }
  }, [anonId])

  if (!anonId) return null
  if (err) {
    return (
      <div className="border-b border-[#D4AF37]/12 bg-black/50 px-8 py-4 text-center text-sm text-white/45">
        {err}
      </div>
    )
  }
  if (!data?.latest) return null

  const preview = data.latest.text.trim().slice(0, 280)
  const clipped = data.latest.text.trim().length > 280

  return (
    <div className="border-b border-[#D4AF37]/15 bg-black/60 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl px-8 py-6">
        <p className="font-sans text-[10px] uppercase tracking-[0.32em] text-[#D4AF37]/55">
          소울트레이스에서 이어온 마지막 편지
        </p>
        <p className="mt-4 whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-white/78">
          {preview}
          {clipped ? '…' : ''}
        </p>
      </div>
    </div>
  )
}
