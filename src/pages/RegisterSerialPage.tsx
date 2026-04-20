import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { claimDevice, login, register } from '../lib/authApi'
import { getAuthToken } from '../lib/authStorage'
import { setBoundDeviceSn } from '../lib/deviceStorage'
import { getApiBase } from '../lib/apiBase'

const SN_RE = /^[a-zA-Z0-9_-]{4,128}$/

export function RegisterSerialPage() {
  const { serial: rawSerial } = useParams<{ serial: string }>()
  const serial = rawSerial ? decodeURIComponent(rawSerial) : ''
  const validSn = useMemo(() => SN_RE.test(serial), [serial])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [loggedIn, setLoggedIn] = useState(() => Boolean(getAuthToken()))

  const handleAuth = async () => {
    setErr(null)
    setBusy(true)
    try {
      if (mode === 'register') {
        await register(email, password)
      } else {
        await login(email, password)
      }
      setLoggedIn(true)
    } catch (e) {
      setErr(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const handleClaim = async () => {
    if (!validSn) return
    setErr(null)
    setBusy(true)
    try {
      await claimDevice(serial)
      setBoundDeviceSn(serial)
      setDone(true)
    } catch (e) {
      setErr(e instanceof Error ? e.message : '등록에 실패했습니다.')
    } finally {
      setBusy(false)
    }
  }

  const apiBase = getApiBase()
  const qrPngUrl = `${apiBase}/api/devices/${encodeURIComponent(serial)}/qr.png`

  if (!validSn) {
    return (
      <div className="min-h-dvh bg-black px-6 py-16 text-white">
        <p className="text-center text-white/55">유효하지 않은 시리얼입니다.</p>
        <Link to="/" className="mt-8 block text-center text-[#D4AF37]/80">
          홈으로
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-black px-6 py-14 text-white">
      <div className="mx-auto max-w-md">
        <p className="text-center font-sans text-xs uppercase tracking-[0.3em] text-[#D4AF37]/65">
          기기 등록
        </p>
        <h1 className="mt-3 text-center font-serif text-2xl text-[#D4AF37]">이터널 커넥트</h1>
        <p className="mt-2 text-center font-mono text-sm text-white/55">{serial}</p>
        <p className="mt-6 text-center text-sm leading-relaxed text-white/55">
          최초 연결 시 본인 확인을 위해 로그인(또는 회원가입) 후, 이 기기를 내 계정에만
          묶습니다. 다른 사람은 이 시리얼로 메시지를 보낼 수 없습니다.
        </p>

        {done ? (
          <div className="mt-10 rounded-xl border border-[#D4AF37]/25 bg-white/5 p-6 text-center">
            <p className="text-[#D4AF37]">등록이 완료되었습니다.</p>
            <Link
              to={`/display/${encodeURIComponent(serial)}`}
              className="mt-4 inline-block text-sm text-white/70 underline"
            >
              기기 화면 미리보기
            </Link>
            <Link to="/demo/letter" className="mt-3 block text-sm text-white/45">
              편지 전송 데모
            </Link>
          </div>
        ) : (
          <>
            {!loggedIn ? (
              <div className="mt-10 space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`flex-1 py-2 text-sm ${mode === 'login' ? 'border-b border-[#D4AF37] text-[#D4AF37]' : 'text-white/45'}`}
                  >
                    로그인
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`flex-1 py-2 text-sm ${mode === 'register' ? 'border-b border-[#D4AF37] text-[#D4AF37]' : 'text-white/45'}`}
                  >
                    회원가입
                  </button>
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="이메일"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/45"
                />
                <input
                  type="password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  placeholder="비밀번호 (8자 이상)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#D4AF37]/45"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleAuth}
                  className="w-full border border-[#D4AF37]/45 bg-[#D4AF37] py-3 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {mode === 'register' ? '가입 후 계속' : '로그인'}
                </button>
              </div>
            ) : (
              <div className="mt-10">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleClaim}
                  className="w-full border border-[#D4AF37]/45 bg-[#D4AF37]/15 py-4 font-serif text-lg text-[#D4AF37] disabled:opacity-50"
                >
                  이 기기를 내 계정에 연결하기
                </button>
              </div>
            )}

            {err && <p className="mt-4 text-center text-sm text-red-300/95">{err}</p>}

            <div className="mt-12 border-t border-white/10 pt-8">
              <p className="text-center text-xs text-white/35">라벨용 QR (PNG)</p>
              <a href={qrPngUrl} target="_blank" rel="noreferrer" className="mt-2 block text-center text-xs text-[#D4AF37]/80">
                {qrPngUrl}
              </a>
              <img
                src={qrPngUrl}
                alt=""
                className="mx-auto mt-4 max-w-[200px] border border-white/10 bg-white p-2"
              />
            </div>
          </>
        )}

        <Link to="/" className="mt-10 block text-center text-sm text-white/35">
          홈으로
        </Link>
      </div>
    </div>
  )
}
