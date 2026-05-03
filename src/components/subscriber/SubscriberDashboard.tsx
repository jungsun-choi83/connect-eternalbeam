import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addSubscriberMemory,
  deleteSubscriberMemory,
  deleteSubscriberPhoto,
  fetchSubscriberDashboard,
  patchSubscriberProfile,
  uploadSubscriberPhoto,
  type ArchiveEntry,
  type SubscriberDashboardPayload,
  type SubscriberPhoto,
} from '../../lib/subscriberApi'

type Tab = 'letters' | 'album' | 'memories' | 'archive'

const TABS: { id: Tab; label: string }[] = [
  { id: 'letters', label: '편지 도착' },
  { id: 'album', label: '사진 앨범' },
  { id: 'memories', label: '기억 기록' },
  { id: 'archive', label: '편지 아카이브' },
]

function formatEta(ms: number): string {
  const day = 24 * 60 * 60 * 1000
  if (ms >= day) {
    const d = Math.max(1, Math.ceil(ms / day))
    return `${d}일`
  }
  const h = Math.max(1, Math.ceil(ms / (60 * 60 * 1000)))
  return `${h}시간`
}

function formatDisplayDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatIsoDots(iso: string): string {
  return iso.replace(/-/g, '.')
}

type Props = {
  userEmail: string
  onLogout: () => void
}

export function SubscriberDashboard({ userEmail, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('letters')
  const [data, setData] = useState<SubscriberDashboardPayload | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [nameDraft, setNameDraft] = useState('')
  const [editingName, setEditingName] = useState(false)

  const [envelopeOpen, setEnvelopeOpen] = useState(false)

  const [lightbox, setLightbox] = useState<SubscriberPhoto | null>(null)
  const [letterModal, setLetterModal] = useState<ArchiveEntry | null>(null)

  const [memoryDate, setMemoryDate] = useState(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  })
  const [memoryText, setMemoryText] = useState('')

  const etaRef = useRef<{ at: number; ms: number } | null>(null)
  const [etaTick, setEtaTick] = useState(0)

  const load = useCallback(async () => {
    setLoadErr(null)
    try {
      const d = await fetchSubscriberDashboard()
      setData(d)
      setNameDraft(d.child_name)
      etaRef.current =
        d.next_letter_eta_ms != null ? { at: Date.now(), ms: d.next_letter_eta_ms } : null
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : '불러오지 못했습니다.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (data?.next_letter_eta_ms == null) return
    const id = window.setInterval(() => setEtaTick((x) => x + 1), 1000)
    return () => window.clearInterval(id)
  }, [data?.next_letter_eta_ms])

  const etaLeft = useMemo(() => {
    const b = etaRef.current
    if (!b) return null
    return Math.max(0, b.ms - (Date.now() - b.at))
  }, [data?.next_letter_eta_ms, etaTick])

  const monthlyLetters = useMemo(() => {
    if (!data) return []
    return data.archive_entries.filter((e) => e.source === 'monthly')
  }, [data])

  const sortedMemories = useMemo(() => {
    if (!data) return []
    return [...data.memories].sort((a, b) => b.date_iso.localeCompare(a.date_iso))
  }, [data])

  const saveName = async () => {
    setBusy(true)
    try {
      await patchSubscriberProfile({ child_name: nameDraft.trim() || '우리 아이' })
      setEditingName(false)
      await load()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setBusy(false)
    }
  }

  const onPickPhoto = (fileList: FileList | null) => {
    const file = fileList?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      void (async () => {
        const dataUrl = String(reader.result || '')
        if (dataUrl.length > 2_200_000) {
          window.alert('이미지가 너무 큽니다. 더 작은 사진을 선택해 주세요.')
          return
        }
        setBusy(true)
        try {
          await uploadSubscriberPhoto(dataUrl)
          await load()
        } catch (e) {
          window.alert(e instanceof Error ? e.message : '업로드 실패')
        } finally {
          setBusy(false)
        }
      })()
    }
    reader.readAsDataURL(file)
  }

  const onPickAvatar = (fileList: FileList | null) => {
    const file = fileList?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      void (async () => {
        const dataUrl = String(reader.result || '')
        if (dataUrl.length > 2_200_000) {
          window.alert('이미지가 너무 큽니다.')
          return
        }
        setBusy(true)
        try {
          await patchSubscriberProfile({ profile_photo: dataUrl })
          await load()
        } catch (e) {
          window.alert(e instanceof Error ? e.message : '저장 실패')
        } finally {
          setBusy(false)
        }
      })()
    }
    reader.readAsDataURL(file)
  }

  const submitMemory = async () => {
    if (!memoryText.trim()) {
      window.alert('기억을 입력해 주세요.')
      return
    }
    setBusy(true)
    try {
      await addSubscriberMemory(memoryDate, memoryText.trim())
      setMemoryText('')
      await load()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : '추가 실패')
    } finally {
      setBusy(false)
    }
  }

  if (loadErr && !data) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#0e0e0c] px-6 text-center">
        <p className="text-sm text-white/70">{loadErr}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-6 border border-[#D4AF37]/40 px-4 py-2 text-sm text-[#D4AF37]"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0e0e0c] text-sm text-white/55">
        대시보드를 여는 중…
      </div>
    )
  }

  const displayName = data.child_name?.trim() || '우리 아이'

  return (
    <div className="min-h-dvh bg-[#0e0e0c] pb-28 pt-6 font-sans text-white sm:pb-12 sm:pt-10">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <header className="flex flex-col gap-5 border-b border-[#D4AF37]/20 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <label className="group relative h-[72px] w-[72px] shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-[#D4AF37]/50 bg-black/50 shadow-[0_0_24px_rgba(212,175,55,0.12)] sm:h-[88px] sm:w-[88px]">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 z-10 cursor-pointer opacity-0"
                onChange={(e) => onPickAvatar(e.target.files)}
              />
              {data.profile_photo ? (
                <img src={data.profile_photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-serif text-xs tracking-wide text-[#D4AF37]/55">
                  사진
                </span>
              )}
              <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 to-transparent pb-1 text-[9px] text-white/70 opacity-0 transition group-hover:opacity-100">
                변경
              </span>
            </label>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]/65">
                Eternal Beam · Subscriber
              </p>
              {editingName ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    className="max-w-[220px] border border-[#D4AF37]/35 bg-black/40 px-2 py-1.5 font-serif text-xl text-[#D4AF37] outline-none sm:text-2xl"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void saveName()}
                    className="border border-[#D4AF37]/45 px-3 py-1 text-xs text-[#D4AF37]"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingName(false)
                      setNameDraft(data.child_name)
                    }}
                    className="text-xs text-white/45"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="mt-1 text-left font-serif text-2xl text-[#D4AF37] sm:text-3xl"
                >
                  {displayName}
                  <span className="ml-2 align-middle font-sans text-xs font-normal text-white/35">편집</span>
                </button>
              )}
              <p className="mt-1 truncate font-mono text-[11px] text-white/35">{userEmail}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <Link
              to={`/subscription/reply${userEmail ? `?email=${encodeURIComponent(userEmail)}` : ''}`}
              className="border border-white/15 px-3 py-2 text-white/65 transition hover:border-[#D4AF37]/35 hover:text-white/85"
            >
              답장 남기기
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="border border-white/10 px-3 py-2 text-white/45 hover:text-white/70"
            >
              로그아웃
            </button>
          </div>
        </header>

        <nav className="mt-6 flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 whitespace-nowrap border px-4 py-2.5 text-xs tracking-wide transition sm:text-sm ${
                tab === t.id
                  ? 'border-[#D4AF37]/55 bg-[#D4AF37]/10 text-[#D4AF37]'
                  : 'border-white/12 bg-black/30 text-white/55 hover:border-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <section className="mt-8 min-h-[320px]">
          {tab === 'letters' && (
            <LettersPanel
              latestMonthly={data.latest_monthly}
              monthlyLetters={monthlyLetters}
              etaLeft={etaLeft}
              envelopeOpen={envelopeOpen}
              setEnvelopeOpen={setEnvelopeOpen}
            />
          )}
          {tab === 'album' && (
            <AlbumPanel
              photos={data.photos}
              busy={busy}
              onPick={(files) => onPickPhoto(files)}
              onOpen={(p) => setLightbox(p)}
              onDelete={async (id) => {
                if (!window.confirm('이 사진을 삭제할까요?')) return
                setBusy(true)
                try {
                  await deleteSubscriberPhoto(id)
                  await load()
                } catch (e) {
                  window.alert(e instanceof Error ? e.message : '삭제 실패')
                } finally {
                  setBusy(false)
                }
              }}
            />
          )}
          {tab === 'memories' && (
            <MemoriesPanel
              sortedMemories={sortedMemories}
              memoryDate={memoryDate}
              setMemoryDate={setMemoryDate}
              memoryText={memoryText}
              setMemoryText={setMemoryText}
              busy={busy}
              onSubmit={() => void submitMemory()}
              onDelete={async (id) => {
                if (!window.confirm('이 기록을 삭제할까요?')) return
                setBusy(true)
                try {
                  await deleteSubscriberMemory(id)
                  await load()
                } catch (e) {
                  window.alert(e instanceof Error ? e.message : '삭제 실패')
                } finally {
                  setBusy(false)
                }
              }}
            />
          )}
          {tab === 'archive' && (
            <ArchivePanel entries={data.archive_entries} onOpen={(e) => setLetterModal(e)} />
          )}
        </section>

        <footer className="mt-16 border-t border-white/10 pt-8 text-center">
          <Link to="/" className="font-sans text-xs tracking-wide text-white/35 hover:text-white/55">
            ← 메인으로
          </Link>
        </footer>
      </div>

      {lightbox && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.data_url}
            alt=""
            className="max-h-[90dvh] max-w-full rounded-sm border border-[#D4AF37]/35 object-contain shadow-[0_0_40px_rgba(212,175,55,0.15)]"
            onClick={(e) => e.stopPropagation()}
          />
        </button>
      )}

      {letterModal && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-5"
          onClick={() => setLetterModal(null)}
        >
          <div
            className="max-h-[85dvh] w-full max-w-lg overflow-y-auto border border-[#D4AF37]/30 bg-[#121210] px-6 py-8 text-left shadow-[0_0_48px_rgba(0,0,0,0.65)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]/70">
              {letterModal.source === 'soultrace' ? 'Soultrace' : 'Monthly'}
            </p>
            <p className="mt-2 font-sans text-xs text-white/45">{formatDisplayDate(letterModal.arrived_at)}</p>
            {letterModal.title && (
              <h3 className="mt-4 font-serif text-lg text-[#D4AF37]">{letterModal.title}</h3>
            )}
            <p className="mt-6 whitespace-pre-wrap font-serif text-[1.05rem] leading-[1.85] text-white/88">
              {letterModal.body}
            </p>
            <button
              type="button"
              onClick={() => setLetterModal(null)}
              className="mt-10 w-full border border-[#D4AF37]/40 py-2.5 text-sm text-[#D4AF37]"
            >
              닫기
            </button>
          </div>
        </button>
      )}
    </div>
  )
}

function LettersPanel({
  latestMonthly,
  monthlyLetters,
  etaLeft,
  envelopeOpen,
  setEnvelopeOpen,
}: {
  latestMonthly: ArchiveEntry | null
  monthlyLetters: ArchiveEntry[]
  etaLeft: number | null
  envelopeOpen: boolean
  setEnvelopeOpen: (v: boolean) => void
}) {
  const restList = monthlyLetters.slice(1)

  return (
    <div>
      {etaLeft != null && etaLeft > 0 && (
        <div className="mb-8 rounded-sm border border-[#D4AF37]/25 bg-black/40 px-5 py-4 text-center">
          <p className="font-serif text-sm text-[#D4AF37]">다음 편지까지</p>
          <p className="mt-2 font-serif text-3xl tracking-wide text-white">{formatEta(etaLeft)}</p>
          <p className="mt-2 font-sans text-xs text-white/45">매달 이어지는 편지를 기다려 주세요.</p>
        </div>
      )}

      <div className="mx-auto max-w-md">
        <div className={`eb-envelope mx-auto max-w-sm ${envelopeOpen ? 'eb-envelope--open' : ''}`}>
          <div className="eb-envelope__sheet">
            <p className="eb-envelope__meta font-mono text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]/75">
              {latestMonthly?.title ?? '이번 달의 편지'}
            </p>
            <p className="mt-3 whitespace-pre-wrap font-serif text-[1.02rem] leading-[1.85] text-white/88">
              {latestMonthly?.body ?? '아직 도착한 편지가 없어요. 조금만 기다려 주세요.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnvelopeOpen(true)}
            aria-label="편지 봉투 열기"
            className="eb-envelope__face"
          >
            <span className="eb-envelope__wax" />
          </button>
        </div>
        {!envelopeOpen && latestMonthly && (
          <p className="mx-auto mt-4 max-w-sm text-center font-sans text-xs text-white/40">봉투를 눌러 편지를 열어 보세요</p>
        )}
      </div>

      <div className="mt-14">
        <h3 className="font-serif text-lg text-[#D4AF37]/90">지난 편지</h3>
        <ul className="mt-4 space-y-3">
          {restList.length === 0 && (
            <li className="border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/45">
              {latestMonthly ? '이전 편지가 아직 없어요.' : '기록된 편지가 없어요.'}
            </li>
          )}
          {restList.map((letter) => (
            <li
              key={letter.id}
              className="border border-[#D4AF37]/15 bg-black/35 px-4 py-3 sm:flex sm:justify-between sm:gap-4"
            >
              <span className="font-mono text-xs text-[#D4AF37]/70">{formatDisplayDate(letter.arrived_at)}</span>
              <p className="mt-1 line-clamp-2 flex-1 font-sans text-sm text-white/75 sm:mt-0">{letter.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function AlbumPanel({
  photos,
  busy,
  onPick,
  onOpen,
  onDelete,
}: {
  photos: SubscriberPhoto[]
  busy: boolean
  onPick: (files: FileList | null) => void
  onOpen: (p: SubscriberPhoto) => void
  onDelete: (id: string) => void
}) {
  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-[#D4AF37]/35 bg-black/30 px-4 py-10 transition hover:border-[#D4AF37]/55 hover:bg-[rgba(212,175,55,0.07)]">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={busy}
          onChange={(e) => onPick(e.target.files)}
        />
        <span className="font-serif text-[#D4AF37]">{busy ? '처리 중…' : '사진 올리기'}</span>
        <span className="mt-2 text-center text-xs text-white/45">업로드 시 날짜가 함께 저장돼요.</span>
      </label>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {photos.map((p) => (
          <div key={p.id} className="group relative">
            <button
              type="button"
              onClick={() => onOpen(p)}
              className="relative aspect-square w-full overflow-hidden rounded-sm border border-[#D4AF37]/35 bg-black/50 shadow-[inset_0_0_0_1px_rgba(212,175,55,0.12)]"
            >
              <img src={p.data_url} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
            </button>
            <p className="mt-1.5 font-mono text-[10px] text-white/40">{formatDisplayDate(p.created_at)}</p>
            <button
              type="button"
              onClick={() => onDelete(p.id)}
              className="absolute right-1 top-1 rounded bg-black/65 px-2 py-0.5 text-[10px] text-white/75 opacity-0 transition hover:text-white group-hover:opacity-100"
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function MemoriesPanel({
  sortedMemories,
  memoryDate,
  setMemoryDate,
  memoryText,
  setMemoryText,
  busy,
  onSubmit,
  onDelete,
}: {
  sortedMemories: SubscriberDashboardPayload['memories']
  memoryDate: string
  setMemoryDate: (v: string) => void
  memoryText: string
  setMemoryText: (v: string) => void
  busy: boolean
  onSubmit: () => void
  onDelete: (id: string) => void
}) {
  return (
    <div>
      <div className="border border-[#D4AF37]/20 bg-black/35 px-4 py-5 sm:px-6">
        <p className="font-serif text-[#D4AF37]">새 기억 남기기</p>
        <label className="mt-4 block text-[11px] text-white/45">날짜</label>
        <input
          type="date"
          value={memoryDate}
          onChange={(e) => setMemoryDate(e.target.value)}
          className="mt-1 w-full max-w-[240px] border border-white/15 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#D4AF37]/45"
        />
        <label className="mt-4 block text-[11px] text-white/45">기억</label>
        <textarea
          value={memoryText}
          onChange={(e) => setMemoryText(e.target.value)}
          rows={4}
          placeholder="예: 오늘 공원에서 마지막으로 산책했어"
          className="mt-1 w-full resize-none border border-white/15 bg-black/50 px-3 py-2 text-sm leading-relaxed text-white outline-none focus:border-[#D4AF37]/45"
        />
        <button
          type="button"
          disabled={busy}
          onClick={onSubmit}
          className="mt-4 border border-[#D4AF37]/45 bg-[#D4AF37]/12 px-5 py-2.5 font-serif text-sm text-[#D4AF37] disabled:opacity-60"
        >
          기록하기
        </button>
      </div>

      <div className="relative mt-12 pl-6">
        <div className="absolute bottom-0 left-[7px] top-0 w-px bg-gradient-to-b from-[#D4AF37]/65 via-[#D4AF37]/35 to-transparent" />
        <ul className="space-y-10">
          {sortedMemories.map((m) => (
            <li key={m.id} className="relative">
              <span className="absolute -left-[5px] top-1.5 h-2 w-2 -translate-x-[7px] rounded-full bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.55)]" />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-serif text-[1.05rem] text-[#D4AF37]">{formatIsoDots(m.date_iso)}</p>
                <button type="button" onClick={() => onDelete(m.id)} className="text-[11px] text-white/35 hover:text-white/60">
                  삭제
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/78">{m.text}</p>
            </li>
          ))}
        </ul>
        {sortedMemories.length === 0 && (
          <p className="font-sans text-sm text-white/40">아직 남긴 기억이 없어요. 첫 줄을 남겨 보세요.</p>
        )}
      </div>
    </div>
  )
}

function ArchivePanel({
  entries,
  onOpen,
}: {
  entries: ArchiveEntry[]
  onOpen: (e: ArchiveEntry) => void
}) {
  const sorted = useMemo(() => [...entries].sort((a, b) => b.arrived_at - a.arrived_at), [entries])
  return (
    <ul className="space-y-3">
      {sorted.map((e) => (
        <li key={e.id}>
          <button
            type="button"
            onClick={() => onOpen(e)}
            className="w-full border border-[#D4AF37]/18 bg-black/40 px-4 py-4 text-left transition hover:border-[#D4AF37]/40 hover:bg-[rgba(212,175,55,0.06)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs text-[#D4AF37]/75">
                {e.source === 'soultrace' ? 'Soultrace · 첫 편지' : '월간 편지'}
              </span>
              <span className="font-mono text-[11px] text-white/40">{formatDisplayDate(e.arrived_at)}</span>
            </div>
            {e.title && <p className="mt-2 font-serif text-sm text-[#D4AF37]/90">{e.title}</p>}
            <p className="mt-2 line-clamp-2 font-sans text-sm text-white/72">{e.body}</p>
            <span className="mt-3 inline-block font-sans text-[11px] text-[#D4AF37]/55">전체 보기 →</span>
          </button>
        </li>
      ))}
      {sorted.length === 0 && <li className="text-center text-sm text-white/45">저장된 편지가 없어요.</li>}
    </ul>
  )
}
