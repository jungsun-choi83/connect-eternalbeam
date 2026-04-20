import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', '..', 'data')
const storePath = path.join(dataDir, 'reply-push-v2.json')

function dayKey(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function normalizeStore(raw) {
  return {
    replies: Array.isArray(raw?.replies) ? raw.replies : [],
    push_subscriptions:
      raw?.push_subscriptions && typeof raw.push_subscriptions === 'object'
        ? raw.push_subscriptions
        : {},
    push_jobs: Array.isArray(raw?.push_jobs) ? raw.push_jobs : [],
    user_activity: raw?.user_activity && typeof raw.user_activity === 'object' ? raw.user_activity : {},
  }
}

function normalizeActivity(raw, nowTs = Date.now()) {
  const dk = dayKey(nowTs)
  const out = {
    last_seen_at: Number(raw?.last_seen_at ?? 0),
    last_message_time: Number(raw?.last_message_time ?? 0),
    next_message_time: Number(raw?.next_message_time ?? 0),
    message_count_today: Number(raw?.message_count_today ?? 0),
    day_key: String(raw?.day_key ?? dk),
    last_inactive_push_at: raw?.last_inactive_push_at ? Number(raw.last_inactive_push_at) : undefined,
    main_scheduled_day_key: raw?.main_scheduled_day_key,
    memory_event_day_key: raw?.memory_event_day_key,
  }
  if (out.day_key !== dk) {
    out.day_key = dk
    out.message_count_today = 0
    out.next_message_time = 0
  }
  return out
}

function loadStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(storePath)) {
    const empty = normalizeStore({})
    fs.writeFileSync(storePath, JSON.stringify(empty, null, 2), 'utf8')
    return empty
  }
  try {
    return normalizeStore(JSON.parse(fs.readFileSync(storePath, 'utf8')))
  } catch {
    return normalizeStore({})
  }
}

function saveStore(s) {
  fs.writeFileSync(storePath, JSON.stringify(s, null, 2), 'utf8')
}

export function initReplyPushStore() {
  loadStore()
}

export function touchUserSeen(userId, ts = Date.now()) {
  const s = loadStore()
  const prev = normalizeActivity(s.user_activity[userId], ts)
  s.user_activity[userId] = normalizeActivity({ ...prev, last_seen_at: ts }, ts)
  saveStore(s)
}

export function ensureActivityRow(userId, ts = Date.now()) {
  const s = loadStore()
  const row = normalizeActivity(s.user_activity[userId], ts)
  s.user_activity[userId] = row
  saveStore(s)
  return row
}

export function clearNextMessageTime(userId, ts = Date.now()) {
  const s = loadStore()
  const prev = normalizeActivity(s.user_activity[userId], ts)
  s.user_activity[userId] = normalizeActivity({ ...prev, next_message_time: 0 }, ts)
  saveStore(s)
}

export function createReplyWaiting(p) {
  const s = loadStore()
  const row = {
    id: randomUUID(),
    user_id: p.user_id,
    user_message: p.user_message,
    time: p.time,
    emotion: p.emotion,
    memory: p.memory,
    character: p.character,
    status: 'waiting_reply',
    next_message_time: p.next_message_time,
    created_at: Date.now(),
  }
  s.replies.push(row)
  saveStore(s)
  return row
}

export function listDueWaitingReplies(nowTs) {
  const s = loadStore()
  return s.replies.filter((r) => r.status === 'waiting_reply' && r.next_message_time <= nowTs)
}

export function markReplyDelivered(replyId, message, ts = Date.now()) {
  const s = loadStore()
  const row = s.replies.find((r) => r.id === replyId)
  if (!row) return null
  row.status = 'delivered'
  row.ai_message = message
  row.delivered_at = ts
  saveStore(s)
  return row
}

export function getLatestReplyByUser(userId) {
  const s = loadStore()
  const rows = s.replies.filter((r) => r.user_id === userId)
  rows.sort((a, b) => b.created_at - a.created_at)
  return rows[0] ?? null
}

export function upsertPushSubscription(userId, sub) {
  const s = loadStore()
  if (!s.push_subscriptions[userId]) s.push_subscriptions[userId] = []
  const list = s.push_subscriptions[userId]
  const key = sub.endpoint || sub.token || sub.id
  const existing = list.find((x) => (x.endpoint || x.token || x.id) === key)
  if (existing) {
    existing.endpoint = sub.endpoint
    existing.token = sub.token
    existing.platform = sub.platform
    existing.updated_at = Date.now()
  } else {
    list.push({
      id: randomUUID(),
      user_id: userId,
      endpoint: sub.endpoint,
      token: sub.token,
      platform: sub.platform ?? 'web',
      created_at: Date.now(),
      updated_at: Date.now(),
    })
  }
  s.user_activity[userId] = normalizeActivity(s.user_activity[userId], Date.now())
  saveStore(s)
}

export function getPushSubscriptions(userId) {
  const s = loadStore()
  return [...(s.push_subscriptions[userId] ?? [])]
}

export function enqueuePushJob(p) {
  const s = loadStore()
  const row = {
    id: randomUUID(),
    user_id: p.user_id,
    type: p.type,
    emotion: p.emotion,
    message: p.message,
    deep_link: p.deep_link,
    deliver_at: p.deliver_at,
    status: 'pending',
    created_at: Date.now(),
  }
  s.push_jobs.push(row)
  saveStore(s)
  return row
}

export function listDuePushJobs(nowTs, limit = 20) {
  const s = loadStore()
  return s.push_jobs
    .filter((j) => j.status === 'pending' && j.deliver_at <= nowTs)
    .sort((a, b) => a.deliver_at - b.deliver_at)
    .slice(0, limit)
}

export function markPushSent(jobId, ts = Date.now()) {
  const s = loadStore()
  const row = s.push_jobs.find((j) => j.id === jobId)
  if (!row) return
  row.status = 'sent'
  row.sent_at = ts
  const a = normalizeActivity(s.user_activity[row.user_id], ts)
  a.last_message_time = ts
  a.message_count_today += 1
  s.user_activity[row.user_id] = a
  saveStore(s)
}

export function markPushFailed(jobId, error) {
  const s = loadStore()
  const row = s.push_jobs.find((j) => j.id === jobId)
  if (!row) return
  row.status = 'failed'
  row.error = error
  saveStore(s)
}

export function canSendPushNow(userId, nowTs, maxPerDay = 2, minGapMs = 60 * 60 * 1000) {
  const s = loadStore()
  const a = normalizeActivity(s.user_activity[userId], nowTs)
  s.user_activity[userId] = a
  saveStore(s)
  if (a.message_count_today >= maxPerDay) return false
  if (a.last_message_time > 0 && nowTs - a.last_message_time < minGapMs) return false
  return true
}

export function listUserActivities(nowTs = Date.now()) {
  const s = loadStore()
  const ids = new Set([
    ...Object.keys(s.user_activity),
    ...Object.keys(s.push_subscriptions),
    ...s.replies.map((r) => r.user_id),
  ])
  const out = []
  for (const user_id of ids) {
    const row = normalizeActivity(s.user_activity[user_id], nowTs)
    s.user_activity[user_id] = row
    out.push({ user_id, ...row })
  }
  saveStore(s)
  return out
}

export function patchUserActivity(userId, patch) {
  const s = loadStore()
  const prev = normalizeActivity(s.user_activity[userId], Date.now())
  s.user_activity[userId] = normalizeActivity({ ...prev, ...patch }, Date.now())
  saveStore(s)
}
