import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SendToDeviceButton } from '../components/integration/SendToDeviceButton'
import { postAnonymousLetter } from '../lib/anonymousApi'
import { getOrCreateAnonId, setStoredAnonId } from '../lib/anonymousSession'
import { getAuthToken } from '../lib/authStorage'
import { getBoundDeviceSn } from '../lib/deviceStorage'

/**
 * 소울트레이스 편지 결과 화면을 가정한 데모.
 */
export function LetterResultDemoPage() {
  const [letter, setLetter] = useState(
    '엄마, 아빠,\n오늘도 햇살이 참 좋아요.\n그때 같이 달리던 길, 아직도 따뜻해요.',
  )
  const [deviceSn, setDeviceSn] = useState<string | null>(null)
  const [tokenPresent, setTokenPresent] = useState(false)
  const [anonId, setAnonId] = useState<string | null>(null)

  useEffect(() => {
    setAnonId(getOrCreateAnonId())
  }, [])

  useEffect(() => {
    if (!anonId) return
    const t = window.setTimeout(() => {
      postAnonymousLetter(anonId, letter)
        .then((r) => {
          setStoredAnonId(r.anon_id)
          setAnonId(r.anon_id)
        })
        .catch(() => {
          /* 오프라인 등 */
        })
    }, 700)
    return () => window.clearTimeout(t)
  }, [letter, anonId])

  useEffect(() => {
    const sync = () => {
      setDeviceSn(getBoundDeviceSn())
      setTokenPresent(Boolean(getAuthToken()))
    }
    sync()
    window.addEventListener('focus', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('focus', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return (
    <div className="min-h-dvh bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-lg">
        <p className="font-sans text-xs uppercase tracking-[0.28em] text-[#D4AF37]/65">
          Soul Trace · 데모
        </p>
        <h1 className="mt-3 font-serif text-xl text-[#D4AF37]">편지 미리보기</h1>
        <textarea
          value={letter}
          onChange={(e) => setLetter(e.target.value)}
          rows={10}
          className="mt-8 w-full resize-y border border-white/10 bg-white/5 px-4 py-4 font-sans text-sm leading-relaxed text-white/88 outline-none focus:border-[#D4AF37]/35"
        />
        <div className="mt-10">
          <SendToDeviceButton deviceSn={deviceSn} letterText={letter} />
        </div>
        <p className="mt-6 font-mono text-[11px] text-white/35">
          device_sn: {deviceSn ?? '(없음)'} · auth: {tokenPresent ? 'yes' : 'no'} · anon:{' '}
          {anonId ? `${anonId.slice(0, 8)}…` : '—'}
        </p>
        {anonId && (
          <Link
            to={`/?anonId=${encodeURIComponent(anonId)}#order`}
            className="mt-4 block text-center text-sm font-medium text-[#D4AF37]"
          >
            이터널 커넥트 구매로 이어가기 (마지막 편지 동기화)
          </Link>
        )}
        <Link
          to="/register/EB-DEMO-001"
          className="mt-6 block text-center text-sm text-[#D4AF37]/80"
        >
          등록 페이지 예시 (/register/시리얼)
        </Link>
        <Link to="/register-device" className="mt-3 block text-center text-sm text-white/45">
          시리얼만 입력 (구 경로)
        </Link>
      </div>
    </div>
  )
}
