import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

const JWT_EXPIRES = process.env.JWT_EXPIRES || '30d'
const BCRYPT_ROUNDS = 12

const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'production' ? null : 'dev-only-change-JWT_SECRET-in-production')

if (!JWT_SECRET) {
  console.error('[auth] FATAL: set JWT_SECRET in production')
  process.exit(1)
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash)
}

/**
 * @param {{ sub: string, email: string }} payload
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

/**
 * @param {string} token
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

export { randomUUID }
