import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

/** 시리얼 직접 입력 시 — 인증은 /register/:serial 에서 진행합니다. */
export function RegisterDevicePage() {
  const navigate = useNavigate()
  const [id, setId] = useState('')

  const save = () => {
    if (!id.trim()) return
    navigate(`/register/${encodeURIComponent(id.trim())}`)
  }

  return (
    <div className="min-h-dvh bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-md">
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-[#D4AF37]/70">기기 연결</p>
        <h1 className="mt-3 font-serif text-2xl text-[#D4AF37]">기기 시리얼</h1>
        <p className="mt-4 font-sans text-sm leading-relaxed text-white/55">
          제품에 부착된 시리얼을 입력하면 본인 확인 후 계정과 연결됩니다.
        </p>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="예: EB-XXXX-XXXX"
          className="mt-8 w-full border border-white/15 bg-white/5 px-4 py-3 font-mono text-sm text-white outline-none focus:border-[#D4AF37]/45"
        />
        <button
          type="button"
          onClick={save}
          className="mt-4 w-full border border-[#D4AF37]/45 bg-[#D4AF37]/15 py-3 font-sans text-sm font-medium text-[#D4AF37]"
        >
          등록 화면으로 이동
        </button>
        <Link to="/demo/letter" className="mt-10 block text-center text-sm text-white/45 underline">
          편지 보내기 데모
        </Link>
        <Link to="/" className="mt-4 block text-center text-sm text-white/35">
          랜딩으로
        </Link>
      </div>
    </div>
  )
}
