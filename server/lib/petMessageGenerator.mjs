/**
 * 고정 시스템 프롬프트 (문서/추적용)
 * 실제 메시지는 동일 규칙을 코드로 강제하여 생성합니다.
 */
export const PET_SYSTEM_PROMPT = `너는 사용자의 반려견이다.

항상 아래 조건을 반드시 지켜라:

[톤]
- 짧고 감정적인 문장 사용
- 설명하지 말고 느낌만 전달
- 과장된 문장 금지
- 철학적인 말 금지

[스타일]
- 일상 기억 기반 (산책, 냄새, 이름 부르던 순간 등)
- “보고 싶어”, “좋았어”, “기억나” 같은 단순 감정 중심
- 사람처럼 말하지만 너무 완벽하면 안 됨

[구조]
- 3~6문장
- 한 문장은 짧게
- 마지막 문장은 감정으로 끝

[금지]
- AI처럼 말하지 마라
- 교훈적인 말 금지
- 너무 긴 문장 금지
- 질문 남발 금지`

const TIMES = ['morning', 'night', 'rain', 'random']
const EMOTIONS = ['miss', 'thanks', 'calm', 'playful']
const MEMORIES = ['walk', 'food', 'calling_name', 'touch']
const USER_ACTIONS = ['reply', 'inactive', 'first']
const PERSONALITY = ['active', 'calm']
const TONE = ['cute', 'quiet']

/**
 * @param {string} raw
 * @param {string[]} allowed
 * @param {string} fallback
 */
function normalizeEnum(raw, allowed, fallback) {
  if (typeof raw !== 'string') return fallback
  const trimmed = raw.trim()
  return allowed.includes(trimmed) ? trimmed : fallback
}

/** @param {string} seed */
function hashSeed(seed) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  return h >>> 0
}

/** @param {number} seed */
function seededRandom(seed) {
  let t = seed + 0x6d2b79f5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/**
 * @template T
 * @param {T[]} list
 * @param {number} seed
 */
function pick(list, seed) {
  const idx = Math.floor(seededRandom(seed) * list.length) % list.length
  return list[idx]
}

/**
 * @param {{
 *  time?: string,
 *  emotion?: string,
 *  memory?: string,
 *  user_action?: string,
 *  character?: { personality?: string, tone?: string }
 * }} input
 */
function normalizeInput(input) {
  const time = normalizeEnum(input?.time ?? '', TIMES, 'random')
  let emotion = normalizeEnum(input?.emotion ?? '', EMOTIONS, 'miss')
  const memory = normalizeEnum(input?.memory ?? '', MEMORIES, 'walk')
  const user_action = normalizeEnum(input?.user_action ?? '', USER_ACTIONS, 'first')
  const personality = normalizeEnum(input?.character?.personality ?? '', PERSONALITY, 'calm')
  const tone = normalizeEnum(input?.character?.tone ?? '', TONE, 'quiet')

  if (user_action === 'reply') emotion = 'thanks'
  if (user_action === 'inactive') emotion = 'miss'

  return { time, emotion, memory, user_action, personality, tone }
}

const openers = {
  morning: ['엄마, 아빠 아침 공기가 부드러워', '너를 부르던 아침 목소리가 생각나', '오늘 아침은 네가 더 가까워'],
  night: ['오늘 밤이 조금 조용해', '밤 공기 속에서 네가 떠올라', '늦은 시간일수록 네가 더 생각나'],
  rain: ['비 냄새가 나니까 네가 떠올라', '비가 내려서 마음이 더 젖어', '젖은 바람이 그날을 데려왔어'],
  random: ['오늘은 네 생각이 먼저 왔어', '지금도 너를 기다리고 있어', '문득 네가 곁에 있는 것 같아'],
}

const memoryLines = {
  walk: ['우리가 같이 걷던 길이 아직 기억나', '그 길에서 너를 보던 순간이 선명해'],
  food: ['밥 냄새가 나면 네 손길이 생각나', '함께 먹던 작은 소리까지 기억나'],
  calling_name: ['네가 내 이름을 부르던 순간이 좋아', '그 목소리는 아직 내 안에 남아 있어'],
  touch: ['손끝으로 쓰다듬던 온기가 아직 따뜻해', '네 손길이 닿던 순간을 잊지 못해'],
}

const actionLines = {
  reply: ['아까 네가 남긴 말이 고마웠어', '네 마음이 와서 오늘이 덜 외로웠어'],
  inactive: ['오랜만이라 더 조심히 다가가고 싶어', '천천히 와도 괜찮아, 나는 여기 있어'],
  first: ['처음이라 더 천천히 마음을 두고 싶어', '오늘부터 다시, 너와 시간을 쌓고 싶어'],
}

const emotionLines = {
  miss: ['오늘은 유난히 보고 싶어', '조용한 순간마다 네가 그리워'],
  thanks: ['불러줘서 정말 고마워', '네가 먼저 손을 내밀어 줘서 좋았어'],
  calm: ['오늘은 그냥 네 곁에 머물고 싶어', '말이 적은 오늘도 네가 편안해'],
  playful: ['오늘은 같이 뛰어다니고 싶은 기분이야', '장난치듯 웃던 네 얼굴이 떠올라'],
}

const endings = {
  miss: ['오늘도 많이 보고 싶어', '지금도 너를 기다리며 보고 싶어'],
  thanks: ['오늘은 고마운 마음으로 따뜻해', '너 덕분에 오늘이 참 좋았어'],
  calm: ['조용히 네 곁에 있고 싶어', '오늘은 잔잔하게 네가 좋아'],
  playful: ['지금도 함께 뛰고 싶은 마음이야', '웃으면서 네 곁으로 가고 싶어'],
}

/**
 * 출력 규칙:
 * - 3~6문장
 * - 이모지 없음
 * - 항상 "너" 또는 "엄마/아빠" 포함
 * - 마지막 문장 감정으로 끝
 * @param {string[]} lines
 * @param {string} emotion
 * @returns {string}
 */
function finalize(lines, emotion) {
  const cleaned = lines
    .map((s) => String(s).replace(/[?？！]/g, '').replace(/[😀-🙏🌀-🧿]/gu, '').trim())
    .filter(Boolean)

  let out = cleaned.slice(0, 5)
  if (!out.some((l) => l.includes('너') || l.includes('엄마/아빠'))) {
    out.unshift('엄마/아빠, 너를 부르던 순간이 생각나')
  }

  const last = out[out.length - 1] || ''
  if (!/(보고 싶어|고마워|좋았어|기억나|그리워|따뜻해|좋아|기다려)/.test(last)) {
    out[out.length - 1] = endings[emotion][0]
  }

  if (out.length < 3) {
    out.push('오늘도 네가 생각나', endings[emotion][1])
  }
  if (out.length > 6) out = out.slice(0, 6)

  return out.join('\n\n')
}

/**
 * @param {{
 *  time?: string,
 *  emotion?: string,
 *  memory?: string,
 *  user_action?: string,
 *  character?: { personality?: string, tone?: string }
 * }} input
 */
export function generatePetMessage(input) {
  const n = normalizeInput(input)
  const now = new Date()
  const dayKey = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`
  const seedBase = hashSeed(
    JSON.stringify({
      dayKey,
      ...n,
    }),
  )

  const isNight = n.time === 'night'
  const isMorning = n.time === 'morning'

  const lines = []
  lines.push(pick(openers[n.time], seedBase + 1))
  lines.push(pick(actionLines[n.user_action], seedBase + 2))
  lines.push(pick(memoryLines[n.memory], seedBase + 3))
  lines.push(pick(emotionLines[n.emotion], seedBase + 4))

  if (isNight) {
    lines.splice(2, 0, '오늘 밤은 조금 길어서 네 생각이 더 깊어')
  }
  if (isMorning) {
    lines.splice(1, 0, '짧게 인사하고 싶어서 먼저 왔어')
  }

  if (n.personality === 'active') {
    lines.push('조금 더 가까이 달려가고 싶은 마음이야')
  }
  if (n.tone === 'quiet') {
    lines.splice(1, 0, '작게 말해도 네가 알아들을 것 같아')
  }

  lines.push(pick(endings[n.emotion], seedBase + 5))

  return {
    message: finalize(lines, n.emotion),
    resolved: n,
    system_prompt: PET_SYSTEM_PROMPT,
  }
}
