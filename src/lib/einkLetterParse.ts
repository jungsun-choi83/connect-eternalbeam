/** Waveshare 3-color Red / 일반 레드에 맞춘 포인트 컬러 */
export const EINK_RED = '#B30000'

function isTagLine(line: string): boolean {
  const t = line.trim()
  if (!t || !t.includes('#')) return false
  const parts = t.split(/\s+/).filter(Boolean)
  return parts.length > 0 && parts.every((p) => p.startsWith('#'))
}

export type ParsedEInkLetter = {
  /** 상단 이름·지문 (레드) */
  sign: string
  /** 본문 줄 (블랙) */
  bodyLines: string[]
  /** 하단 해시태그 줄 (레드) */
  tagsLine: string
}

/**
 * 규칙:
 * - 첫 줄 → sign (이름/지문)
 * - 마지막 줄이 `#태그`만으로 이루어지면 → tagsLine, 그 위까지가 본문
 * - 그 외 → 첫 줄 제외 나머지 전부 본문
 */
export function parseEInkLetter(raw: string): ParsedEInkLetter {
  const lines = raw.trim().split('\n')
  if (lines.length === 0 || !raw.trim()) {
    return { sign: '', bodyLines: [], tagsLine: '' }
  }
  const sign = lines[0]?.trim() ?? ''
  const rest = lines.slice(1)
  if (rest.length === 0) {
    return { sign, bodyLines: [], tagsLine: '' }
  }
  const last = rest[rest.length - 1] ?? ''
  if (isTagLine(last)) {
    return {
      sign,
      bodyLines: rest.slice(0, -1).map((l) => l.trimEnd()),
      tagsLine: last.trim(),
    }
  }
  return {
    sign,
    bodyLines: rest.map((l) => l.trimEnd()),
    tagsLine: '',
  }
}
