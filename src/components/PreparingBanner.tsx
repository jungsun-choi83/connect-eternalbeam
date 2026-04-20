import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

function decodeParam(value: string | null): string | null {
  if (!value?.trim()) return null
  try {
    return decodeURIComponent(value.trim())
  } catch {
    return value.trim()
  }
}

export function PreparingBanner() {
  const [params] = useSearchParams()

  const { line, sub } = useMemo(() => {
    const letterId = decodeParam(params.get('letterId'))
    const petName =
      decodeParam(params.get('petName')) ?? decodeParam(params.get('name'))
    const anonId = decodeParam(params.get('anonId'))

    if (anonId) {
      const short = anonId.length > 14 ? `${anonId.slice(0, 10)}…` : anonId
      return {
        line: '소울트레이스에서 이어온 편지를 불러왔습니다.',
        sub: `대화 기록 · ${short}`,
      }
    }

    if (petName) {
      return {
        line: `${petName}를 위한 이터널 커넥트를 준비 중입니다.`,
        sub: letterId ? `편지 ID · ${letterId}` : null,
      }
    }

    if (letterId) {
      return {
        line: '이터널 커넥트를 준비 중입니다.',
        sub: `편지 ID · ${letterId}`,
      }
    }

    return { line: null, sub: null }
  }, [params])

  if (!line) return null

  return (
    <div className="border-b border-[#D4AF37]/15 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl flex-col gap-0.5 px-8 py-4 text-center sm:flex-row sm:items-center sm:justify-center sm:gap-4 sm:text-left">
        <p className="text-sm font-medium tracking-wide text-[#D4AF37]">{line}</p>
        {sub && (
          <p className="text-xs font-normal text-white/40 sm:border-l sm:border-white/10 sm:pl-4">
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}
