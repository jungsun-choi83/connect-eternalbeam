import { useState, type FormEvent } from 'react'
import { getStoredAnonId } from '../../lib/anonymousSession'
import { bindAnonymousToAccount, registerOrderAccount } from '../../lib/authApi'

/**
 * 배송·연락처 입력과 동시에 계정을 만들고, 익명 편지를 귀속합니다.
 */
export function OrderAutoAccountCard() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setBusy(true)
    try {
      await registerOrderAccount({ email, phone, displayName })
      const anon = getStoredAnonId()
      if (anon) {
        const { migrated } = await bindAnonymousToAccount(anon)
        setMsg(`주문 계정이 준비되었습니다. 이전 대화 ${migrated}건을 연결했어요.`)
      } else {
        setMsg('주문 계정이 준비되었습니다.')
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : '처리하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-xl rounded-lg border border-white/10 bg-black/25 px-8 py-10">
      <p className="font-serif text-lg text-[#D4AF37]">주문과 함께 계정 만들기</p>
      <p className="mt-2 font-sans text-sm leading-relaxed text-white/50">
        배송지와 연락처를 남겨 주시면 주문 확인과 동시에 계정이 만들어지고, 소울트레이스에서 써 두신
        편지도 이 계정으로 자동으로 이어집니다.
      </p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="font-sans text-xs text-white/40">받는 분 이름</span>
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1.5 w-full border border-white/10 bg-black/40 px-3 py-2.5 font-sans text-sm text-white/88 outline-none focus:border-[#D4AF37]/35"
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className="font-sans text-xs text-white/40">이메일</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full border border-white/10 bg-black/40 px-3 py-2.5 font-sans text-sm text-white/88 outline-none focus:border-[#D4AF37]/35"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <span className="font-sans text-xs text-white/40">연락처</span>
          <input
            required
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5 w-full border border-white/10 bg-black/40 px-3 py-2.5 font-sans text-sm text-white/88 outline-none focus:border-[#D4AF37]/35"
            autoComplete="tel"
            placeholder="010-0000-0000"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 py-3 font-sans text-sm font-medium text-[#D4AF37] transition hover:bg-[#D4AF37]/18 disabled:opacity-50"
        >
          {busy ? '처리 중…' : '주문 정보로 계정 만들기'}
        </button>
      </form>
      {msg && <p className="mt-4 font-sans text-sm text-white/55">{msg}</p>}
    </div>
  )
}
