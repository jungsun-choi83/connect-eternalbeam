import { Link, useParams } from 'react-router-dom'
import { getApiBase } from '../lib/apiBase'

const SN_RE = /^[a-zA-Z0-9_-]{4,128}$/

/** 출고·라벨용 QR 미리보기 (시리얼 기준) */
export function QrToolPage() {
  const { deviceSn: raw } = useParams<{ deviceSn: string }>()
  const sn = raw ? decodeURIComponent(raw) : ''
  const valid = SN_RE.test(sn)
  const apiBase = getApiBase()
  const png = `${apiBase}/api/devices/${encodeURIComponent(sn)}/qr.png`
  const json = `${apiBase}/api/devices/${encodeURIComponent(sn)}/qr`

  if (!valid) {
    return (
      <div className="min-h-dvh bg-black px-6 py-16 text-white">
        <p className="text-center text-white/55">유효하지 않은 시리얼입니다.</p>
        <Link to="/" className="mt-8 block text-center text-[#D4AF37]/80">
          홈
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#f5f0e8] px-6 py-16 text-black">
      <div className="mx-auto max-w-md text-center">
        <p className="font-mono text-sm">{sn}</p>
        <img src={png} alt="" className="mx-auto mt-6 max-w-[280px] border border-black/10 bg-white p-3 shadow-lg" />
        <p className="mt-6 break-all text-left text-xs text-black/55">{png}</p>
        <a href={json} target="_blank" rel="noreferrer" className="mt-4 block text-sm text-amber-900/80 underline">
          JSON (data URL)
        </a>
        <Link to="/" className="mt-10 block text-sm text-black/45">
          닫기
        </Link>
      </div>
    </div>
  )
}
