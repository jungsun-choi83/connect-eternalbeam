import { useState } from 'react'
import { sendLetterToDevice } from '../../lib/sendToDevice'
import { getAuthToken } from '../../lib/authStorage'

type Props = {
  /** 등록된 기기 시리얼 */
  deviceSn: string | null
  letterText: string
  className?: string
}

/**
 * 소울트레이스 편지 결과 화면 하단 — 로그인 + 기기 등록(클레임) 후 활성화.
 */
export function SendToDeviceButton({ deviceSn, letterText, className = '' }: Props) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [err, setErr] = useState<string | null>(null)

  const token = getAuthToken()
  const canSend =
    Boolean(deviceSn) &&
    Boolean(token) &&
    letterText.trim().length > 0 &&
    status !== 'sending'

  const handleClick = async () => {
    if (!deviceSn || !letterText.trim()) return
    setStatus('sending')
    setErr(null)
    try {
      await sendLetterToDevice(deviceSn, letterText.trim())
      setStatus('done')
      setTimeout(() => setStatus('idle'), 2500)
    } catch (e) {
      setStatus('error')
      setErr(e instanceof Error ? e.message : '전송에 실패했습니다.')
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        disabled={!canSend}
        onClick={handleClick}
        className="w-full rounded-full border border-[#D4AF37]/45 bg-[#D4AF37] px-6 py-4 font-sans text-base font-semibold text-black transition enabled:hover:bg-[#e4c456] disabled:cursor-not-allowed disabled:border-white/15 disabled:bg-white/10 disabled:text-white/35"
      >
        {status === 'sending'
          ? '기기로 보내는 중…'
          : status === 'done'
            ? '기기에 반영되었습니다'
            : '지금 내 기기로 보내기'}
      </button>
      {!deviceSn && (
        <p className="mt-3 text-center text-xs text-white/45">
          QR로 기기를 등록하면 이 버튼이 활성화됩니다.
        </p>
      )}
      {deviceSn && !token && (
        <p className="mt-3 text-center text-xs text-white/45">
          로그인한 계정으로만 전송할 수 있습니다.
        </p>
      )}
      {err && <p className="mt-2 text-center text-xs text-red-300/90">{err}</p>}
    </div>
  )
}
