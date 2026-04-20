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

export type ReplySubmitInput = {
  userId: string
  message: string
  time: 'morning' | 'night' | 'rain' | 'random'
  emotion: 'miss' | 'thanks' | 'calm' | 'playful'
  memory: 'walk' | 'food' | 'calling_name' | 'touch'
  character: {
    personality: 'active' | 'calm'
    tone: 'cute' | 'quiet'
  }
}

export type ReplyStatus =
  | { status: 'none' }
  | { status: 'waiting_reply'; userMessage: string | null; next_message_time: number }
  | { status: 'delivered'; userMessage: string | null; aiMessage: string | null; deliveredAt: number | null }

export async function submitReply(input: ReplySubmitInput): Promise<{
  replyId: string
  userMessage: string
  status: 'waiting_reply'
  next_message_time: number
}> {
  const res = await fetch(`${getApiBase()}/api/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = (await res.json().catch(() => ({}))) as {
    replyId?: string
    userMessage?: string
    status?: 'waiting_reply'
    next_message_time?: number
    error?: string
  }
  if (!res.ok || !data.replyId || data.status !== 'waiting_reply' || !data.next_message_time) {
    throw new Error(data.error || `답장 저장 실패 (${res.status})`)
  }
  return {
    replyId: data.replyId,
    userMessage: data.userMessage ?? input.message,
    status: data.status,
    next_message_time: data.next_message_time,
  }
}

export async function fetchReplyStatus(userId: string): Promise<ReplyStatus> {
  const res = await fetch(`${getApiBase()}/api/reply/status?userId=${encodeURIComponent(userId)}`)
  const data = (await res.json().catch(() => ({}))) as ReplyStatus & { error?: string }
  if (!res.ok) {
    throw new Error(data.error || `답장 상태 조회 실패 (${res.status})`)
  }
  return data
}

export async function subscribeEmotionPush(input: {
  userId: string
  endpoint?: string
  token?: string
  platform?: string
}): Promise<void> {
  await fetch(`${getApiBase()}/api/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}
