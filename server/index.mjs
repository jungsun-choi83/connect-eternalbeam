import { randomBytes, timingSafeEqual } from 'crypto'
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import QRCode from 'qrcode'
import {
  initDb,
  findUserByEmail,
  findUserById,
  createUser,
  createUserFromOrder,
  findDevice,
  setDeviceOwner,
  setLatestMessage,
  insertDevice,
  listDevicesByOwner,
  appendAnonymousLetter,
  getAnonymousSession,
  bindAnonymousToUser,
  getUserLetters,
} from './db.mjs'
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  randomUUID,
} from './authUtil.mjs'
import { insertConnectLetter, listConnectLettersByDevice } from './lib/supabaseConnectLetters.mjs'
import { generatePetMessage } from './lib/petMessageGenerator.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')

initDb()

const PORT = Number(process.env.PORT) || 3001
const ADMIN_KEY = process.env.ADMIN_SECRET || ''
const PUBLIC_ORIGIN =
  process.env.PUBLIC_ORIGIN || 'https://connect.eternalbeam.com'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || ''
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET || ''
const CONNECT_DEVICE_API_KEY = process.env.CONNECT_DEVICE_API_KEY || ''

const ANON_ID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$|^[a-zA-Z0-9_-]{8,128}$/

const app = express()

if (process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1)
}

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
)
app.use(express.json({ limit: '512kb' }))

/** @type {Map<string, Set<import('express').Response>>} */
const sseSubscribers = new Map()

function broadcast(deviceSn, payload) {
  const set = sseSubscribers.get(deviceSn)
  if (!set?.size) return
  const line = `data: ${JSON.stringify(payload)}\n\n`
  for (const res of set) {
    try {
      res.write(line)
    } catch {
      set.delete(res)
    }
  }
}

const DEVICE_SN_RE = /^[a-zA-Z0-9_-]{4,128}$/

function validateDeviceSn(sn) {
  return typeof sn === 'string' && DEVICE_SN_RE.test(sn)
}

function authMiddleware(req, res, next) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다.' })
  }
  try {
    const token = h.slice(7)
    const decoded = verifyToken(token)
    req.user = { id: decoded.sub, email: decoded.email }
    next()
  } catch {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' })
  }
}

/** JWT가 있으면 사용자 정보 반환, 없거나 실패 시 null */
function tryAuthUser(req) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return null
  try {
    const decoded = verifyToken(h.slice(7))
    return { id: decoded.sub, email: decoded.email }
  } catch {
    return null
  }
}

/** 오렌지 파이 등 기기용 GET — CONNECT_DEVICE_API_KEY 와 비교 */
function deviceConnectApiKeyOk(req) {
  if (!CONNECT_DEVICE_API_KEY) return false
  const auth = req.headers.authorization
  const x = req.headers['x-connect-device-key']
  const token =
    typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : x
  if (typeof token !== 'string' || !token) return false
  const a = Buffer.from(CONNECT_DEVICE_API_KEY, 'utf8')
  const b = Buffer.from(token, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/** 회원가입 */
app.post('/api/auth/register', async (req, res) => {
  const email = req.body?.email
  const password = req.body?.password
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: '올바른 이메일을 입력해 주세요.' })
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' })
  }
  if (findUserByEmail(email)) {
    return res.status(409).json({ error: '이미 가입된 이메일입니다.' })
  }
  const id = randomUUID()
  const passwordHash = await hashPassword(password)
  createUser(id, email, passwordHash)
  const token = signToken({ sub: id, email: email.trim().toLowerCase() })
  res.status(201).json({
    token,
    user: { id, email: email.trim().toLowerCase() },
  })
})

/** 로그인 */
app.post('/api/auth/login', async (req, res) => {
  const email = req.body?.email
  const password = req.body?.password
  if (!email || !password) {
    return res.status(400).json({ error: '이메일과 비밀번호를 입력해 주세요.' })
  }
  const user = findUserByEmail(email)
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' })
  }
  const token = signToken({ sub: user.id, email: user.email })
  res.json({
    token,
    user: { id: user.id, email: user.email },
  })
})

/** 내 정보 */
app.get('/api/me', authMiddleware, (req, res) => {
  const u = findUserById(req.user.id)
  if (!u) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
  res.json({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    phone: u.phone ?? null,
    display_name: u.display_name ?? null,
  })
})

/** 내 기기 목록 */
app.get('/api/me/devices', authMiddleware, (req, res) => {
  const rows = listDevicesByOwner(req.user.id)
  res.json({ devices: rows })
})

/** 소울트레이스에서 귀속된 편지 기록 */
app.get('/api/me/letters', authMiddleware, (req, res) => {
  const letters = getUserLetters(req.user.id)
  res.json({ letters })
})

/**
 * 익명 편지 임시 저장 (가입 없이 소울트레이스)
 * POST { anon_id?, text } — anon_id 없으면 서버가 새 UUID 발급
 */
app.post('/api/anonymous/letters', (req, res) => {
  let anonId = req.body?.anon_id
  const text = req.body?.text
  if (text === undefined || text === null || typeof text !== 'string') {
    return res.status(400).json({ error: 'text required' })
  }
  if (text.length > 100_000) return res.status(413).json({ error: 'text too long' })
  if (!anonId) {
    anonId = randomUUID()
  } else if (typeof anonId !== 'string' || !ANON_ID_RE.test(anonId.trim())) {
    return res.status(400).json({ error: 'invalid anon_id' })
  }
  anonId = anonId.trim()
  const { letter_id, updated_at } = appendAnonymousLetter(anonId, text)
  res.status(201).json({ anon_id: anonId, letter_id, updated_at })
})

/** 익명 세션 편지 목록 (구매 페이지에서 미리보기) */
app.get('/api/anonymous/letters/:anonId', (req, res) => {
  const anonId = req.params.anonId
  if (!ANON_ID_RE.test(anonId)) {
    return res.status(400).json({ error: 'invalid anon_id' })
  }
  const session = getAnonymousSession(anonId)
  if (!session) {
    return res.json({ anon_id: anonId, letters: [], latest: null, updated_at: null })
  }
  const letters = session.letters ?? []
  const latest = letters.length ? letters[letters.length - 1] : null
  res.json({
    anon_id: anonId,
    letters,
    latest,
    updated_at: session.updated_at ?? null,
  })
})

/**
 * 로그인 후 익명 편지 → 계정으로 귀속 (Soft login 완료 시)
 */
app.post('/api/auth/bind-anonymous', authMiddleware, (req, res) => {
  const anonId = req.body?.anon_id
  if (!anonId || typeof anonId !== 'string' || !ANON_ID_RE.test(anonId.trim())) {
    return res.status(400).json({ error: 'invalid anon_id' })
  }
  const result = bindAnonymousToUser(anonId.trim(), req.user.id)
  res.json({ ok: true, migrated: result.migrated })
})

/**
 * 주문 완료와 동시에 계정 자동 생성 (배송·연락처 기반)
 */
app.post('/api/auth/register-order', async (req, res) => {
  const email = req.body?.email
  const phone = req.body?.phone
  const displayName = req.body?.displayName ?? req.body?.name ?? ''
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: '이메일이 필요합니다.' })
  }
  if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
    return res.status(400).json({ error: '연락처가 필요합니다.' })
  }
  const existing = findUserByEmail(email)
  if (existing) {
    return res.status(409).json({ error: '이미 가입된 이메일입니다. 로그인해 주세요.' })
  }
  const passwordHash = await hashPassword(randomBytes(24).toString('hex'))
  const created = createUserFromOrder({
    email,
    phone: phone.trim(),
    displayName: String(displayName).trim(),
    passwordHash,
  })
  if (created.error === 'email_exists') {
    return res.status(409).json({ error: '이미 가입된 이메일입니다.' })
  }
  const token = signToken({
    sub: created.id,
    email: created.email,
  })
  res.status(201).json({
    token,
    user: { id: created.id, email: created.email },
    order_auto: true,
  })
})

/** Google OAuth 시작 URL (프론트에서 window.location 할당) */
app.get('/api/auth/oauth/google/url', (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.json({ configured: false, url: null })
  }
  const redirectUri = `${PUBLIC_ORIGIN.replace(/\/$/, '')}/oauth/google/callback`
  const q = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  })
  res.json({
    configured: true,
    url: `https://accounts.google.com/o/oauth2/v2/auth?${q.toString()}`,
  })
})

/** Kakao — REST 키 설정 시 인가 URL 반환 */
app.get('/api/auth/oauth/kakao/url', (req, res) => {
  if (!KAKAO_REST_API_KEY) {
    return res.json({ configured: false, url: null })
  }
  const redirectUri = `${PUBLIC_ORIGIN.replace(/\/$/, '')}/oauth/kakao/callback`
  const q = new URLSearchParams({
    client_id: KAKAO_REST_API_KEY,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'profile_nickname account_email',
  })
  res.json({
    configured: true,
    url: `https://kauth.kakao.com/oauth/authorize?${q.toString()}`,
  })
})

/** Kakao code → JWT (REST API 키 + 선택적 client_secret) */
app.post('/api/auth/oauth/kakao/exchange', async (req, res) => {
  const code = req.body?.code
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'code required' })
  }
  if (!KAKAO_REST_API_KEY) {
    return res.status(503).json({ error: 'Kakao OAuth가 서버에 설정되지 않았습니다.' })
  }
  const redirectUri = `${PUBLIC_ORIGIN.replace(/\/$/, '')}/oauth/kakao/callback`
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: KAKAO_REST_API_KEY,
    redirect_uri: redirectUri,
    code,
  })
  if (KAKAO_CLIENT_SECRET) {
    body.set('client_secret', KAKAO_CLIENT_SECRET)
  }
  const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const tokens = await tokenRes.json()
  if (!tokens.access_token) {
    return res.status(400).json({ error: 'token_exchange_failed', detail: tokens })
  }
  const ui = await fetch('https://kapi.kakao.com/v2/user/me', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  }).then((r) => r.json())
  const email = ui.kakao_account?.email
  if (!email) {
    return res.status(400).json({ error: 'no_email_from_kakao' })
  }
  let user = findUserByEmail(email)
  if (!user) {
    const id = randomUUID()
    const passwordHash = await hashPassword(randomBytes(24).toString('hex'))
    const nickname = ui.kakao_account?.profile?.nickname || ''
    createUser(id, email, passwordHash, {
      display_name: nickname,
      oauth_provider: 'kakao',
    })
    user = findUserByEmail(email)
  }
  if (!user) return res.status(500).json({ error: 'user_create_failed' })
  const token = signToken({ sub: user.id, email: user.email })
  res.json({
    token,
    user: { id: user.id, email: user.email },
  })
})

/** Google code → JWT (서버에 GOOGLE_CLIENT_SECRET 필요) */
app.post('/api/auth/oauth/google/exchange', async (req, res) => {
  const code = req.body?.code
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'code required' })
  }
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ error: 'Google OAuth가 서버에 설정되지 않았습니다.' })
  }
  const redirectUri = `${PUBLIC_ORIGIN.replace(/\/$/, '')}/oauth/google/callback`
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const tokens = await tokenRes.json()
  if (!tokens.access_token) {
    return res.status(400).json({ error: 'token_exchange_failed', detail: tokens })
  }
  const ui = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  }).then((r) => r.json())
  const email = ui.email
  if (!email) {
    return res.status(400).json({ error: 'no_email_from_google' })
  }
  let user = findUserByEmail(email)
  if (!user) {
    const id = randomUUID()
    const passwordHash = await hashPassword(randomBytes(24).toString('hex'))
    createUser(id, email, passwordHash, {
      display_name: ui.name || '',
      oauth_provider: 'google',
    })
    user = findUserByEmail(email)
  }
  if (!user) return res.status(500).json({ error: 'user_create_failed' })
  const token = signToken({ sub: user.id, email: user.email })
  res.json({
    token,
    user: { id: user.id, email: user.email },
  })
})

/**
 * 관리자: 출고 시 시리얼만 DB에 넣기 (ADMIN_SECRET)
 * POST /api/admin/devices  { "device_sn": "EB-XXXX" }
 */
app.post('/api/admin/devices', (req, res) => {
  const key = req.headers['x-admin-key']
  if (!ADMIN_KEY) {
    return res.status(503).json({ error: '관리자 등록이 서버에 설정되지 않았습니다.' })
  }
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: '관리자 키가 올바르지 않습니다.' })
  }
  const deviceSn = req.body?.device_sn
  if (!validateDeviceSn(deviceSn)) {
    return res.status(400).json({ error: '유효하지 않은 시리얼 형식입니다.' })
  }
  const created = insertDevice(deviceSn)
  res.status(created ? 201 : 200).json({ device_sn: deviceSn, created })
})

/**
 * 최초 등록(클레임): QR로 들어온 사용자가 로그인 후 본인 계정과 기기를 연결
 * — 기기에 owner가 없을 때만 가능
 */
app.post('/api/devices/:deviceSn/claim', authMiddleware, (req, res) => {
  const { deviceSn } = req.params
  if (!validateDeviceSn(deviceSn)) {
    return res.status(400).json({ error: '유효하지 않은 시리얼입니다.' })
  }
  const row = findDevice(deviceSn)
  if (!row) {
    return res.status(404).json({ error: '등록되지 않은 기기입니다. 고객센터에 문의해 주세요.' })
  }
  if (row.owner_id && row.owner_id !== req.user.id) {
    return res.status(403).json({ error: '이미 다른 계정에 등록된 기기입니다.' })
  }
  if (row.owner_id === req.user.id) {
    return res.json({ ok: true, device_sn: deviceSn, already: true })
  }
  setDeviceOwner(deviceSn, req.user.id)
  res.json({ ok: true, device_sn: deviceSn })
})

/**
 * 편지 전송 — 소유자만 가능 (JWT 필수)
 */
app.post('/api/devices/:deviceSn/message', authMiddleware, (req, res) => {
  const { deviceSn } = req.params
  if (!validateDeviceSn(deviceSn)) {
    return res.status(400).json({ error: '유효하지 않은 시리얼입니다.' })
  }
  const text = req.body?.text
  if (text === undefined || text === null) {
    return res.status(400).json({ error: 'text required' })
  }
  if (typeof text !== 'string') {
    return res.status(400).json({ error: 'text must be string' })
  }
  if (text.length > 100_000) {
    return res.status(413).json({ error: 'text too long' })
  }

  const row = findDevice(deviceSn)
  if (!row) {
    return res.status(404).json({ error: '기기를 찾을 수 없습니다.' })
  }
  if (!row.owner_id || row.owner_id !== req.user.id) {
    return res.status(403).json({ error: '이 기기에 메시지를 보낼 권한이 없습니다. 먼저 기기를 등록해 주세요.' })
  }

  const updatedAt = setLatestMessage(deviceSn, text)
  const payload = { latest_message: text, updated_at: updatedAt }
  broadcast(deviceSn, payload)
  res.json({ ok: true, ...payload })
})

/** 디스플레이용 (공개 읽기) */
app.get('/api/devices/:deviceSn/message', (req, res) => {
  const { deviceSn } = req.params
  if (!validateDeviceSn(deviceSn)) {
    return res.status(400).json({ error: 'invalid device_sn' })
  }
  const row = findDevice(deviceSn)
  if (!row) {
    return res.json({ latest_message: '', updated_at: null })
  }
  res.json({
    latest_message: row.latest_message ?? '',
    updated_at: row.updated_at ?? null,
  })
})

app.get('/api/devices/:deviceSn/stream', (req, res) => {
  const { deviceSn } = req.params
  if (!validateDeviceSn(deviceSn)) {
    return res.status(400).json({ error: 'invalid device_sn' })
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  if (res.flushHeaders) res.flushHeaders()

  if (!sseSubscribers.has(deviceSn)) sseSubscribers.set(deviceSn, new Set())
  sseSubscribers.get(deviceSn).add(res)

  const row = findDevice(deviceSn)
  res.write(
    `data: ${JSON.stringify({
      latest_message: row?.latest_message ?? '',
      updated_at: row?.updated_at ?? null,
    })}\n\n`,
  )

  const keepAlive = setInterval(() => {
    try {
      res.write(': ping\n\n')
    } catch {
      clearInterval(keepAlive)
    }
  }, 25000)

  req.on('close', () => {
    clearInterval(keepAlive)
    sseSubscribers.get(deviceSn)?.delete(res)
  })
})

/**
 * QR 코드 PNG — 라벨 인쇄용 (URL만 인코딩, 시리얼 자체는 공개되어도 등록·전송은 인증 필요)
 * GET /api/devices/:deviceSn/qr.png
 */
app.get('/api/devices/:deviceSn/qr.png', async (req, res) => {
  const { deviceSn } = req.params
  if (!validateDeviceSn(deviceSn)) {
    return res.status(400).send('invalid device_sn')
  }
  const registerUrl = `${PUBLIC_ORIGIN.replace(/\/$/, '')}/register/${encodeURIComponent(deviceSn)}`
  try {
    const png = await QRCode.toBuffer(registerUrl, {
      type: 'png',
      width: 512,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    })
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.send(png)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'qr generation failed' })
  }
})

/** JSON으로 QR 데이터 URL (미리보기용) */
app.get('/api/devices/:deviceSn/qr', async (req, res) => {
  const { deviceSn } = req.params
  if (!validateDeviceSn(deviceSn)) {
    return res.status(400).json({ error: 'invalid device_sn' })
  }
  const registerUrl = `${PUBLIC_ORIGIN.replace(/\/$/, '')}/register/${encodeURIComponent(deviceSn)}`
  try {
    const dataUrl = await QRCode.toDataURL(registerUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    })
    res.json({ device_sn: deviceSn, register_url: registerUrl, data_url: dataUrl })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'qr generation failed' })
  }
})

/**
 * 소울트레이스 → 커넥트 편지 저장 (Supabase connect_letters)
 * POST { user_email, letter_content, device_id? } — 선택적으로 Authorization: Bearer JWT
 */
app.post('/api/connect/letters', async (req, res) => {
  const user_email = req.body?.user_email
  const letter_content = req.body?.letter_content
  const device_id = req.body?.device_id
  if (!user_email || typeof user_email !== 'string' || !user_email.includes('@')) {
    return res.status(400).json({ error: '올바른 user_email이 필요합니다.' })
  }
  if (letter_content === undefined || letter_content === null || typeof letter_content !== 'string') {
    return res.status(400).json({ error: 'letter_content가 필요합니다.' })
  }
  if (letter_content.length > 100_000) {
    return res.status(413).json({ error: 'letter_content too long' })
  }
  const authUser = tryAuthUser(req)
  let user_id = null
  if (authUser && /^[0-9a-f-]{36}$/i.test(authUser.id)) {
    user_id = authUser.id
  }
  const did =
    device_id === undefined || device_id === null || device_id === ''
      ? null
      : String(device_id)
  if (did !== null && !validateDeviceSn(did)) {
    return res.status(400).json({ error: 'device_id 형식이 올바르지 않습니다.' })
  }
  const result = await insertConnectLetter({
    user_email,
    letter_content,
    device_id: did,
    user_id,
  })
  if (!result.ok) {
    if (result.error === 'supabase_not_configured') {
      return res.status(503).json({ error: 'Supabase가 서버에 설정되지 않았습니다.' })
    }
    return res.status(500).json({ error: result.error })
  }
  res.status(201).json({
    ok: true,
    id: result.id,
    created_at: result.created_at,
  })
})

/**
 * 기기(오렌지 파이 등)가 device_id 기준 편지 목록 조회
 * GET /api/connect/letters?device_id=EB-xxx
 * Header: Authorization: Bearer <CONNECT_DEVICE_API_KEY> 또는 X-Connect-Device-Key
 */
app.get('/api/connect/letters', async (req, res) => {
  if (!CONNECT_DEVICE_API_KEY) {
    return res.status(503).json({ error: 'CONNECT_DEVICE_API_KEY가 서버에 설정되지 않았습니다.' })
  }
  if (!deviceConnectApiKeyOk(req)) {
    return res.status(401).json({ error: '기기 API 키가 올바르지 않습니다.' })
  }
  const device_id = req.query?.device_id
  if (!device_id || typeof device_id !== 'string' || !validateDeviceSn(device_id)) {
    return res.status(400).json({ error: 'device_id 쿼리가 필요합니다.' })
  }
  const out = await listConnectLettersByDevice(device_id)
  if (!out.ok) {
    if (out.error === 'supabase_not_configured') {
      return res.status(503).json({ error: 'Supabase가 서버에 설정되지 않았습니다.' })
    }
    return res.status(500).json({ error: out.error })
  }
  res.json({ letters: out.letters })
})

/**
 * 아이 메시지 생성 API
 * POST /generate-message
 * body: {
 *   time, emotion, memory, user_action,
 *   character: { personality, tone }
 * }
 */
app.post('/generate-message', (req, res) => {
  const body = req.body ?? {}
  const input = {
    time: body.time,
    emotion: body.emotion,
    memory: body.memory,
    user_action: body.user_action,
    character: {
      personality: body.character?.personality,
      tone: body.character?.tone,
    },
  }
  const out = generatePetMessage(input)
  res.json({
    message: out.message,
    resolved: out.resolved,
    system_prompt: out.system_prompt,
  })
})

// API prefix 버전도 같은 동작 제공
app.post('/api/generate-message', (req, res) => {
  const body = req.body ?? {}
  const input = {
    time: body.time,
    emotion: body.emotion,
    memory: body.memory,
    user_action: body.user_action,
    character: {
      personality: body.character?.personality,
      tone: body.character?.tone,
    },
  }
  const out = generatePetMessage(input)
  res.json({
    message: out.message,
    resolved: out.resolved,
    system_prompt: out.system_prompt,
  })
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(distDir, 'index.html'), (err) => {
      if (err) next(err)
    })
  })
}

app.listen(PORT, () => {
  console.log(`[eternalbeam-api] http://localhost:${PORT}`)
  if (!ADMIN_KEY) console.warn('[eternalbeam-api] ADMIN_SECRET not set — admin routes disabled')
})
