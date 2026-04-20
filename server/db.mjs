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
 * @typedef {{ users: Record<string, UserRow>, devices: Record<string, DeviceRow>, anonymous: Record<string, AnonSession>, user_letters: Record<string, { id: string, text: string, created_at: number, migrated_from_anon?: string }[]> }} DbShape
 */

function normalize(/** @type {Partial<DbShape>} */ j) {
  if (!j.users) j.users = {}
  if (!j.devices) j.devices = {}
  if (!j.anonymous) j.anonymous = {}
  if (!j.user_letters) j.user_letters = {}
  return /** @type {DbShape} */ (j)
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
