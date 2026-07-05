import { randomBytes, timingSafeEqual } from 'crypto'
import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'

const AUTH_COOKIE = 'auth_token'

export interface AuthTokenPayload {
  userId: string
  email: string | null
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return secret
}

export function createAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' })
}

export function readCookies(req: Request): Record<string, string> {
  const cookies: Record<string, string> = {}

  for (const part of (req.headers.cookie || '').split(';')) {
    const separator = part.indexOf('=')
    if (separator < 0) continue

    const key = part.slice(0, separator).trim()
    const value = part.slice(separator + 1).trim()
    if (key) cookies[key] = decodeURIComponent(value)
  }

  return cookies
}

export function getUserId(req: Request): string | null {
  const bearerToken = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  const token = bearerToken || readCookies(req)[AUTH_COOKIE]
  if (!token) return null

  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthTokenPayload
    return payload.userId
  } catch {
    return null
  }
}

function cookieSecurityAttributes(): string {
  const sameSite = (process.env.COOKIE_SAME_SITE || 'Lax').toLowerCase()
  const normalizedSameSite = sameSite === 'none' ? 'None' : sameSite === 'strict' ? 'Strict' : 'Lax'
  const secure = process.env.NODE_ENV === 'production' || normalizedSameSite === 'None'
  const domain = process.env.COOKIE_DOMAIN ? `; Domain=${process.env.COOKIE_DOMAIN}` : ''

  return `; HttpOnly; SameSite=${normalizedSameSite}${secure ? '; Secure' : ''}${domain}`
}

export function setAuthCookie(res: Response, token: string): void {
  const maxAge = 7 * 24 * 60 * 60
  res.append('Set-Cookie', `${AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}${cookieSecurityAttributes()}`)
}

export function clearAuthCookie(res: Response): void {
  res.append('Set-Cookie', `${AUTH_COOKIE}=; Path=/; Max-Age=0${cookieSecurityAttributes()}`)
}

export function createOAuthSecret(): string {
  return randomBytes(32).toString('base64url')
}

export function secretsMatch(left?: string, right?: string): boolean {
  if (!left || !right) return false
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}
