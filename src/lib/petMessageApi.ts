import { getApiBase } from './apiBase'

export type GenerateMessageInput = {
  time: 'morning' | 'night' | 'rain' | 'random'
  emotion: 'miss' | 'thanks' | 'calm' | 'playful'
  memory: 'walk' | 'food' | 'calling_name' | 'touch'
  user_action: 'reply' | 'inactive' | 'first'
  character: {
    personality: 'active' | 'calm'
    tone: 'cute' | 'quiet'
  }
}

export async function generatePetMessage(input: GenerateMessageInput): Promise<string> {
  const res = await fetch(`${getApiBase()}/generate-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string }
  if (!res.ok) {
    throw new Error(data.error || `메시지 생성 실패 (${res.status})`)
  }
  if (!data.message || typeof data.message !== 'string') {
    throw new Error('메시지 생성 응답이 올바르지 않습니다.')
  }
  return data.message
}
