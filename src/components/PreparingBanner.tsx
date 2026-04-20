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
    const petName =
      decodeParam(params.get('petName')) ?? decodeParam(params.get('name'))
    const anonId = decodeParam(params.get('anonId'))

    if (anonId) {
      return {
        line: '이전에 남긴 편지가 다시 도착했습니다.',
        sub: '사라지지 않도록, 이곳에 이어집니다.',
      }
    }

    if (petName) {
      return {
        line: `${petName}와 다시 만나는 시간을 준비하고 있습니다.`,
        sub: '오늘의 메시지가 내일에도 남도록 이어집니다.',
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
