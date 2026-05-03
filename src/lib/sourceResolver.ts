import { safeDecodeParam } from './soulTraceIngest'

function decodeRepeatedly(value: string | null, maxDepth = 4): string | null {
  if (!value) return null
  let current = value
  for (let i = 0; i < maxDepth; i += 1) {
    const decoded = safeDecodeParam(current)
    if (!decoded || decoded === current) break
    current = decoded
  }
  return current
}

function extractSourceFromText(text: string | null): string | null {
  if (!text) return null
  const normalized = decodeRepeatedly(text)
  if (!normalized) return null
  const sourceMatch = normalized.match(/(?:^|[?&])source=([^&#]+)/i)
  if (sourceMatch?.[1]) return sourceMatch[1].trim().toLowerCase()
  return null
}

export function resolveSourceFromLocation(
  searchParams: URLSearchParams,
  locationSearch?: string,
  locationHref?: string,
): string | null {
  const currentSearch =
    locationSearch ??
    (typeof window === 'undefined' ? '' : window.location.search)
  const currentHref =
    locationHref ??
    (typeof window === 'undefined' ? '' : window.location.href)

  const direct = decodeRepeatedly(
    currentSearch ? new URLSearchParams(currentSearch).get('source') : searchParams.get('source'),
  )
  if (direct) return direct.trim().toLowerCase()

  if (!currentSearch && !currentHref) return null

  const windowParams = new URLSearchParams(currentSearch)
  for (const [key, value] of windowParams.entries()) {
    const fromKey = extractSourceFromText(key)
    if (fromKey) return fromKey
    const fromValue = extractSourceFromText(value)
    if (fromValue) return fromValue
  }

  return extractSourceFromText(currentHref)
}

export function runSourceResolverChecks(): void {
  if (!import.meta.env.DEV) return

  const cases: Array<{ label: string; query: string; href: string; expected: string | null }> = [
    {
      label: 'plain query',
      query: '?source=tag&petName=%EB%AF%B8%EB%AF%B8',
      href: 'https://connect.eternalbeam.com/?source=tag&petName=%EB%AF%B8%EB%AF%B8',
      expected: 'tag',
    },
    {
      label: 'encoded key carries source',
      query: '?src_url=%3Fsource%3Dtag%26tagId%3Dabc',
      href: 'https://connect.eternalbeam.com/?src_url=%3Fsource%3Dtag%26tagId%3Dabc',
      expected: 'tag',
    },
    {
      label: 'double encoded source in href',
      query: '?redirect=%253Fsource%253Dtag',
      href: 'https://connect.eternalbeam.com/?redirect=%253Fsource%253Dtag',
      expected: 'tag',
    },
    {
      label: 'missing source',
      query: '?petName=%EB%AF%B8%EB%AF%B8',
      href: 'https://connect.eternalbeam.com/?petName=%EB%AF%B8%EB%AF%B8',
      expected: null,
    },
  ]

  for (const t of cases) {
    const actual = resolveSourceFromLocation(new URLSearchParams(t.query), t.query, t.href)
    if (actual !== t.expected) {
      console.error('[source-check] failed:', t.label, { expected: t.expected, actual, query: t.query })
    }
  }
}
