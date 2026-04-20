import { generatePetMessage } from './petMessageGenerator.mjs'

const DOG_SYSTEM_PROMPT = `너는 사용자의 반려견이다.
짧고 감정적인 답장을 3~6문장으로 작성한다.
설명 대신 느낌을 전달하고, 마지막 문장은 감정으로 끝낸다.
이모지는 쓰지 않는다.`

/**
 * @param {{
 *  userMessage: string,
 *  fallbackInput: {
 *    time?: string,
 *    emotion?: string,
 *    memory?: string,
 *    user_action?: string,
 *    character?: { personality?: string, tone?: string }
 *  }
 * }} p
 */
export async function generatePetReplyFromUserMessage(p) {
  const userMessage = String(p.userMessage ?? '').trim()
  if (!userMessage) {
    return generatePetMessage({
      ...p.fallbackInput,
      user_action: 'reply',
    }).message
  }

  const apiKey = process.env.OPENAI_API_KEY || ''
  if (!apiKey) {
    return generatePetMessage({
      ...p.fallbackInput,
      user_action: 'reply',
    }).message
  }

  const userPrompt = `사용자가 다음과 같은 말을 남겼습니다:\n\n'${userMessage}'\n\n이 상황에서 강아지가 답장을 보내주세요.`

  try {
    const model = process.env.OPENAI_REPLY_MODEL || 'gpt-4o-mini'
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          { role: 'system', content: [{ type: 'text', text: DOG_SYSTEM_PROMPT }] },
          { role: 'user', content: [{ type: 'text', text: userPrompt }] },
        ],
      }),
    })
    const json = await res.json().catch(() => ({}))
    const out = String(json?.output_text ?? '').trim()
    if (!res.ok || !out) throw new Error(`openai_${res.status}`)
    return out
  } catch {
    return generatePetMessage({
      ...p.fallbackInput,
      user_action: 'reply',
    }).message
  }
}
