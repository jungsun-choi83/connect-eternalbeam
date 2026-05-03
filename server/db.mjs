import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, '..', 'data')
const dbPath = path.join(dataDir, 'db.json')

/**
 * @typedef {{ email: string, password_hash: string, created_at: number, phone?: string, display_name?: string, oauth_provider?: string, order_auto?: boolean }} UserRow
 * @typedef {{ owner_id: string | null, latest_message: string, updated_at: number }} DeviceRow
 * @typedef {{ letters: { id: string, text: string, created_at: number }[], created_at: number, updated_at: number }} AnonSession
 * @typedef {{ active: boolean, since: number }} SubscriptionRow
 * @typedef {{ id: string, source: 'soultrace' | 'monthly', body: string, arrived_at: number, title?: string, cycle_index?: number }} ArchiveEntry
 * @typedef {{ id: string, data_url: string, created_at: number }} SubscriberPhoto
 * @typedef {{ id: string, date_iso: string, text: string, created_at: number }} SubscriberMemory
 * @typedef {{
 *   child_name: string,
 *   profile_photo: string | null,
 *   archive_entries: ArchiveEntry[],
 *   soultrace_imported: boolean,
 *   photos: SubscriberPhoto[],
 *   memories: SubscriberMemory[],
 * }} SubscriberDashboardRow
 * @typedef {{
 *   users: Record<string, UserRow>,
 *   devices: Record<string, DeviceRow>,
 *   anonymous: Record<string, AnonSession>,
 *   user_letters: Record<string, { id: string, text: string, created_at: number, migrated_from_anon?: string }[]>,
 *   subscriptions: Record<string, SubscriptionRow>,
 *   subscriber_dashboard: Record<string, SubscriberDashboardRow>,
 * }} DbShape
 */

function normalize(/** @type {Partial<DbShape>} */ j) {
  if (!j.users) j.users = {}
  if (!j.devices) j.devices = {}
  if (!j.anonymous) j.anonymous = {}
  if (!j.user_letters) j.user_letters = {}
  if (!j.subscriptions) j.subscriptions = {}
  if (!j.subscriber_dashboard) j.subscriber_dashboard = {}
  return /** @type {DbShape} */ (j)
}

/** @param {string} email */
function normEmail(email) {
  return email.trim().toLowerCase()
}

/** @returns {SubscriberDashboardRow} */
function defaultSubscriberDashboard() {
  return {
    child_name: '우리 아이',
    profile_photo: null,
    archive_entries: [],
    soultrace_imported: false,
    photos: [],
    memories: [],
  }
}

function load() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(dbPath)) {
    const empty = normalize({})
    save(empty)
    return empty
  }
  const raw = fs.readFileSync(dbPath, 'utf8')
  try {
    const j = JSON.parse(raw)
    return normalize(j)
  } catch {
    return normalize({})
  }
}

/** @param {DbShape} data */
function save(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8')
}

export function initDb() {
  load()
}

/** @param {string} email */
export function findUserByEmail(email) {
  const data = load()
  const e = email.trim().toLowerCase()
  for (const id of Object.keys(data.users)) {
    const u = data.users[id]
    if (u.email === e) {
      return { id, email: u.email, password_hash: u.password_hash, created_at: u.created_at }
    }
  }
  return undefined
}

/** @param {string} id */
export function findUserById(id) {
  const data = load()
  const u = data.users[id]
  if (!u) return undefined
  return {
    id,
    email: u.email,
    created_at: u.created_at,
    phone: u.phone,
    display_name: u.display_name,
  }
}

/**
 * @param {string} id
 * @param {string} email
 * @param {string} passwordHash
 * @param {Partial<Pick<UserRow, 'phone' | 'display_name' | 'order_auto'>>} [extra]
 */
export function createUser(id, email, passwordHash, extra = {}) {
  const data = load()
  const now = Date.now()
  data.users[id] = {
    email: email.trim().toLowerCase(),
    password_hash: passwordHash,
    created_at: now,
    ...extra,
  }
  save(data)
}

/** @param {string} anonId */
export function getAnonymousSession(anonId) {
  const data = load()
  return data.anonymous[anonId] ?? null
}

/**
 * @param {string} anonId
 * @param {string} text
 */
export function appendAnonymousLetter(anonId, text) {
  const data = load()
  const now = Date.now()
  if (!data.anonymous[anonId]) {
    data.anonymous[anonId] = {
      letters: [],
      created_at: now,
      updated_at: now,
    }
  }
  const letterId = randomUUID()
  data.anonymous[anonId].letters.push({
    id: letterId,
    text,
    created_at: now,
  })
  data.anonymous[anonId].updated_at = now
  save(data)
  return { letter_id: letterId, updated_at: now }
}

/**
 * @param {string} anonId
 * @param {string} userId
 */
export function bindAnonymousToUser(anonId, userId) {
  const data = load()
  const session = data.anonymous[anonId]
  if (!session) return { migrated: 0 }
  if (!data.user_letters[userId]) data.user_letters[userId] = []
  let n = 0
  for (const L of session.letters) {
    data.user_letters[userId].push({
      id: randomUUID(),
      text: L.text,
      created_at: L.created_at,
      migrated_from_anon: anonId,
    })
    n++
  }
  delete data.anonymous[anonId]
  save(data)
  return { migrated: n }
}

/** @param {string} userId */
export function getUserLetters(userId) {
  const data = load()
  return [...(data.user_letters[userId] ?? [])].sort((a, b) => a.created_at - b.created_at)
}

/**
 * 주문 완료 시 배송 정보로 계정 자동 생성 (비밀번호는 임의 — 이후 재설정·OAuth 권장)
 * @param {{ email: string, phone: string, displayName: string, passwordHash: string }} p
 */
export function createUserFromOrder(p) {
  const data = load()
  const email = p.email.trim().toLowerCase()
  if (findUserByEmail(email)) {
    return { error: 'email_exists' }
  }
  const id = randomUUID()
  data.users[id] = {
    email,
    password_hash: p.passwordHash,
    created_at: Date.now(),
    phone: p.phone.trim(),
    display_name: p.displayName.trim(),
    order_auto: true,
  }
  save(data)
  return { id, email }
}

/** @param {string} deviceSn */
export function findDevice(deviceSn) {
  const data = load()
  const d = data.devices[deviceSn]
  if (!d) return undefined
  return {
    device_sn: deviceSn,
    owner_id: d.owner_id ?? null,
    latest_message: d.latest_message ?? '',
    updated_at: d.updated_at ?? 0,
  }
}

/**
 * @param {string} deviceSn
 * @param {string | null} ownerId
 */
export function setDeviceOwner(deviceSn, ownerId) {
  const data = load()
  if (!data.devices[deviceSn]) return
  data.devices[deviceSn].owner_id = ownerId
  save(data)
}

/**
 * @param {string} deviceSn
 * @param {string} text
 */
export function setLatestMessage(deviceSn, text) {
  const data = load()
  if (!data.devices[deviceSn]) {
    throw new Error('device not found')
  }
  const now = Date.now()
  data.devices[deviceSn].latest_message = text
  data.devices[deviceSn].updated_at = now
  save(data)
  return now
}

/** @param {string} deviceSn */
export function insertDevice(deviceSn) {
  const data = load()
  if (data.devices[deviceSn]) return false
  data.devices[deviceSn] = {
    owner_id: null,
    latest_message: '',
    updated_at: 0,
  }
  save(data)
  return true
}

/** @param {string} userId */
export function listDevicesByOwner(userId) {
  const data = load()
  const out = []
  for (const deviceSn of Object.keys(data.devices)) {
    const d = data.devices[deviceSn]
    if (d.owner_id === userId) {
      out.push({
        device_sn: deviceSn,
        latest_message: d.latest_message ?? '',
        updated_at: d.updated_at ?? 0,
      })
    }
  }
  out.sort((a, b) => a.device_sn.localeCompare(b.device_sn))
  return out
}

/** @param {string} email */
export function getSubscriptionByEmail(email) {
  const data = load()
  const e = normEmail(email)
  return data.subscriptions[e] ?? null
}

/**
 * @param {string} email
 * @param {boolean} [active]
 */
export function setSubscriptionActive(email, active = true) {
  const data = load()
  const e = normEmail(email)
  const existing = data.subscriptions[e]
  if (!active) {
    data.subscriptions[e] = { active: false, since: existing?.since ?? Date.now() }
  } else {
    const since = existing?.active ? existing.since : Date.now()
    data.subscriptions[e] = { active: true, since }
  }
  save(data)
  return data.subscriptions[e]
}

/** @param {string} userId */
export function getSubscriberDashboardRow(userId) {
  const data = load()
  if (!data.subscriber_dashboard[userId]) {
    data.subscriber_dashboard[userId] = defaultSubscriberDashboard()
    save(data)
  }
  return data.subscriber_dashboard[userId]
}

/**
 * @param {string} userId
 * @param {Partial<Pick<SubscriberDashboardRow, 'child_name' | 'profile_photo'>>} patch
 */
export function patchSubscriberProfile(userId, patch) {
  const data = load()
  const row = getSubscriberDashboardRow(userId)
  if (typeof patch.child_name === 'string' && patch.child_name.trim()) {
    row.child_name = patch.child_name.trim().slice(0, 80)
  }
  if (patch.profile_photo === null) {
    row.profile_photo = null
  } else if (typeof patch.profile_photo === 'string') {
    row.profile_photo = patch.profile_photo.slice(0, 2_500_000)
  }
  data.subscriber_dashboard[userId] = row
  save(data)
  return row
}

/**
 * @param {string} userId
 * @param {SubscriberPhoto} photo
 */
export function addSubscriberPhoto(userId, photo) {
  const data = load()
  const row = getSubscriberDashboardRow(userId)
  row.photos.push(photo)
  data.subscriber_dashboard[userId] = row
  save(data)
}

/** @param {string} userId @param {string} photoId */
export function removeSubscriberPhoto(userId, photoId) {
  const data = load()
  const row = getSubscriberDashboardRow(userId)
  row.photos = row.photos.filter((p) => p.id !== photoId)
  data.subscriber_dashboard[userId] = row
  save(data)
}

/**
 * @param {string} userId
 * @param {SubscriberMemory} memory
 */
export function addSubscriberMemory(userId, memory) {
  const data = load()
  const row = getSubscriberDashboardRow(userId)
  row.memories.push(memory)
  data.subscriber_dashboard[userId] = row
  save(data)
}

/** @param {string} userId @param {string} memoryId */
export function removeSubscriberMemory(userId, memoryId) {
  const data = load()
  const row = getSubscriberDashboardRow(userId)
  row.memories = row.memories.filter((m) => m.id !== memoryId)
  data.subscriber_dashboard[userId] = row
  save(data)
}

const MONTHLY_CYCLE_MS = 30 * 24 * 60 * 60 * 1000

/** @param {number} cycleIndex */
function monthlyLetterBody(cycleIndex) {
  const lines = [
    '오늘도 너를 생각하며 조용히 이름을 불러 보았어.\n너의 빛나던 순간들이 아직도 마음 한쪽에 부드럽게 남아 있어.',
    '바람이 살랑일 때마다, 네가 좋아하던 그 길을 함께 걷던 기억이 떠올라.\n그 시간들이 나에게는 가장 따뜻한 선물이야.',
    '가끔 하늘을 보면 네가 웃던 얼굴이 겹쳐 보여.\n그 미소가 여전히 나를 포근하게 감싸 줘.',
    '오늘은 너와 나눴던 작은 일상이 그리워.\n그 소소한 행복이 얼마나 큰 힘이었는지 이제야 더 선명해져.',
    '밤이 되면 별빛 아래에서 네 이야기를 조용히 떠올려.\n멀리 있어도 마음만은 늘 곁에 있는 것 같아.',
  ]
  return lines[cycleIndex % lines.length] ?? lines[0]
}

/**
 * Soultrace 첫 편지 + 30일 주기 월간 편지를 반영합니다.
 * @param {string} userId
 * @param {string} userEmail
 * @param {() => { id: string, text: string, created_at: number }[]} getLetters
 */
export function syncSubscriberArchiveFromSources(userId, userEmail, getLetters) {
  const sub = getSubscriptionByEmail(userEmail)
  const data = load()
  const row = getSubscriberDashboardRow(userId)
  const now = Date.now()

  if (!row.soultrace_imported) {
    const letters = getLetters()
    if (letters.length > 0) {
      const sorted = [...letters].sort((a, b) => a.created_at - b.created_at)
      const first = sorted[0]
      const dup = row.archive_entries.some(
        (e) => e.source === 'soultrace' && e.body === first.text && e.arrived_at === first.created_at,
      )
      if (!dup) {
        row.archive_entries.push({
          id: randomUUID(),
          source: 'soultrace',
          body: first.text,
          arrived_at: first.created_at,
          title: '소울트레이스에서 온 첫 편지',
        })
      }
      row.soultrace_imported = true
    }
  }

  if (sub?.active) {
    let c = 0
    while (c < 240) {
      const releaseAt = sub.since + c * MONTHLY_CYCLE_MS
      if (releaseAt > now) break
      const exists = row.archive_entries.some(
        (e) => e.source === 'monthly' && e.cycle_index === c,
      )
      if (!exists) {
        row.archive_entries.push({
          id: randomUUID(),
          source: 'monthly',
          body: monthlyLetterBody(c),
          arrived_at: releaseAt,
          title: c === 0 ? '구독으로 이어지는 첫 편지' : `함께한 ${c + 1}번째 달의 편지`,
          cycle_index: c,
        })
      }
      c++
    }
  }

  data.subscriber_dashboard[userId] = row
  save(data)
  return row
}

/**
 * @param {string} userEmail
 * @param {number} now
 */
export function computeNextLetterEtaMs(userEmail, now = Date.now()) {
  const sub = getSubscriptionByEmail(userEmail)
  if (!sub?.active) return null
  const elapsed = now - sub.since
  const nextIdx = Math.floor(elapsed / MONTHLY_CYCLE_MS) + 1
  const nextAt = sub.since + nextIdx * MONTHLY_CYCLE_MS
  if (nextAt > now) return nextAt - now
  return null
}
