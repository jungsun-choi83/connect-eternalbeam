import { useEffect, useState } from 'react'
import { fetchAnonymousSession } from '../../lib/anonymousApi'
import { getAuthToken, subscribeAuthChange } from '../../lib/authStorage'
import { startGoogleOAuth, startKakaoOAuth } from '../../lib/oauthStart'

type Props = {
  anonId: string | null
}

export function SoftArchivePrompt({ anonId }: Props) {
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getAuthToken()))
  const [hasLetters, setHasLetters] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sync = () => setLoggedIn(Boolean(getAuthToken()))
    sync()
    const unsub = subscribeAuthChange(sync)
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)
    return () => {
      unsub()
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  useEffect(() => {
    if (!anonId || loggedIn) {
      setHasLetters(false)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchAnonymousSession(anonId)
      .then((d) => {
        if (!cancelled) setHasLetters((d.letters?.length ?? 0) > 0)
      })
      .catch(() => {
        if (!cancelled) setHasLetters(false)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [anonId, loggedIn])

  if (loggedIn || !anonId || loading || !hasLetters) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(5.85rem+env(safe-area-inset-bottom))] sm:pb-6">
      <div className="pointer-events-auto max-w-lg rounded-lg border border-[#D4AF37]/25 bg-black/90 px-6 py-5 shadow-2xl backdrop-blur-md">
        <p className="text-center font-serif text-[1.05rem] leading-snug text-[#D4AF37]">
          아이와의 소중한 대화를 보관해드릴까요?
        </p>
        <p className="mt-2 text-center font-sans text-xs leading-relaxed text-white/45">
          간편 로그인 한 번이면 지금까지의 편지와 시간이 사라지지 않도록 이어집니다.
        </p>
        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => startKakaoOAuth(anonId)}
            className="rounded border border-[#FEE500]/50 bg-[#FEE500] px-4 py-2.5 font-sans text-sm font-medium text-[#191919] transition hover:bg-[#fdd835]"
          >
            카카오로 보관하기
          </button>
          <button
            type="button"
            onClick={() => startGoogleOAuth(anonId)}
            className="rounded border border-white/15 bg-white px-4 py-2.5 font-sans text-sm font-medium text-gray-900 transition hover:bg-white/95"
          >
            Google로 보관하기
          </button>
        </div>
      </div>
    </div>
  )
}
