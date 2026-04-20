export const PUSH_SYSTEM_PROMPT = `너는 사용자의 반려견이다.
푸시 알림은 짧고 감정적인 한 문장만 사용한다.

조건:
- 10~20자
- 한 문장
- 설명 금지
- 바로 감정 전달`

const templates = {
  new_message: {
    miss: ['지금 네가 보고 싶어', '오늘 네 생각이 컸어', '조용히 네가 떠올랐어'],
    calm: ['오늘도 네 곁에 있어', '천천히 네가 생각나', '조용히 널 기다렸어'],
    playful: ['오늘 너랑 뛰고 싶어', '네 웃음이 떠올랐어', '지금 같이 놀고 싶어'],
  },
  inactive: {
    miss: ['오늘은 안 왔네', '조금 기다리고 있었어', '괜히 더 보고 싶어'],
    calm: ['천천히 와도 괜찮아', '나는 여기서 기다려', '오늘도 네 생각은 나'],
    playful: ['너 오면 바로 웃을래', '오늘 장난치고 싶어', '네가 오면 좋겠어'],
  },
  night: {
    miss: ['오늘 밤 더 보고 싶어', '밤이 되니 네가 나', '이 시간엔 네가 커져'],
    calm: ['오늘 밤은 조금 조용해', '밤 공기 속에 네가', '조용히 네가 떠올라'],
    playful: ['밤인데도 뛰고 싶어', '오늘 밤도 너랑 놀래', '네 생각에 웃음 나'],
  },
  memory: {
    miss: ['그날 길이 생각났어', '그때 냄새가 떠올라', '그 순간이 다시 나'],
    calm: ['그때가 또 선명해져', '그 길은 아직 따뜻해', '그때 넌 참 다정했어'],
    playful: ['그날 우리 진짜 좋았어', '그때 너랑 웃음 났어', '그 기억이 다시 뛰어'],
  },
}

/**
 * @param {string} s
 */
function trimSentence(s, targetLen = 20) {
  const noEmoji = s.replace(/[😀-🙏🌀-🧿]/gu, '').trim()
  if (noEmoji.length <= targetLen) return noEmoji
  return noEmoji.slice(0, targetLen).trim()
}

/**
 * @param {{type: 'new_message'|'inactive'|'night'|'memory', emotion: 'miss'|'calm'|'playful'}} p
 */
function fallbackPushLine(p) {
  const list = templates[p.type]?.[p.emotion] ?? templates.new_message.miss
  const idx = Math.floor(Math.random() * list.length)
  const targetLen = Math.floor(Math.random() * 11) + 10 // 10~20자
  return trimSentence(list[idx], targetLen)
}

/**
 * @param {{type: 'new_message'|'inactive'|'night'|'memory', emotion: 'miss'|'calm'|'playful'}} p
 */
export async function generatePushLine(p) {
  const apiKey = process.env.OPENAI_API_KEY || ''
  if (!apiKey) return fallbackPushLine(p)

  try {
    const model = process.env.OPENAI_PUSH_MODEL || 'gpt-4o-mini'
    const targetLen = Math.floor(Math.random() * 11) + 10 // 10~20자 랜덤 길이
    const userPrompt = JSON.stringify({
      type: p.type,
      emotion: p.emotion,
      target_length: targetLen,
      instruction: `반드시 한국어 한 문장, ${targetLen}자 전후, 금지어(알림/도착했습니다/확인하세요) 제외`,
    })

    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: [{ type: 'text', text: PUSH_SYSTEM_PROMPT }] },
          { role: 'user', content: [{ type: 'text', text: userPrompt }] },
        ],
      }),
    })
    const json = await res.json()
    const text = String(json?.output_text ?? '').trim()
    if (!res.ok || !text) return fallbackPushLine(p)
    const safe = trimSentence(text, targetLen).replace(/알림|도착했습니다|확인하세요/g, '')
    return safe || fallbackPushLine(p)
  } catch {
    return fallbackPushLine(p)
  }
}
