import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import type { Request, RequestHandler, Response } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

const AUTH_COOKIE = 'auth_token'
const REFRESH_COOKIE = 'refresh_token'
const ADMIN_SESSION_COOKIE = 'admin_session'
export const REFRESH_TOKEN_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000

export interface AuthTokenPayload {
  userId: string
  email: string | null
}

export type RequestUser = {
  id: string
  email: string | null
  username: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser
    }
  }
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET
  if (!secret) throw new Error('JWT_SECRET is not configured')
  return secret
}

export function createAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '15m' })
}

export function createRefreshToken(): string {
  return randomBytes(48).toString('base64url')
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
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
    const payload = jwt.verify(token, getJwtSecret())
    return typeof payload !== 'string' && typeof payload.userId === 'string'
      ? payload.userId
      : null
  } catch {
    return null
  }
}

export const requireUser: RequestHandler = (req, res, next) => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  void prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true, role: true },
  })
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }

      req.user = user
      next()
    })
    .catch(next)
}

function cookieSecurityAttributes(): string {
  const sameSite = (process.env.COOKIE_SAME_SITE || 'Lax').toLowerCase()
  const normalizedSameSite = sameSite === 'none' ? 'None' : sameSite === 'strict' ? 'Strict' : 'Lax'
  const secure = process.env.NODE_ENV === 'production' || normalizedSameSite === 'None'
  const domain = process.env.COOKIE_DOMAIN ? `; Domain=${process.env.COOKIE_DOMAIN}` : ''

  return `; HttpOnly; SameSite=${normalizedSameSite}${secure ? '; Secure' : ''}${domain}`
}

export function setAuthCookie(res: Response, token: string): void {
  const maxAge = 15 * 60
  res.append('Set-Cookie', `${AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}${cookieSecurityAttributes()}`)
}

export function getRefreshToken(req: Request): string | null {
  return readCookies(req)[REFRESH_COOKIE] || null
}

export function getAdminSessionToken(req: Request): string | null {
  return readCookies(req)[ADMIN_SESSION_COOKIE] || null
}

export function setRefreshCookie(res: Response, token: string): void {
  const maxAge = Math.floor(REFRESH_TOKEN_LIFETIME_MS / 1000)
  res.append('Set-Cookie', `${REFRESH_COOKIE}=${encodeURIComponent(token)}; Path=/api/auth; Max-Age=${maxAge}${cookieSecurityAttributes()}`)
}

export function setAdminSessionCookie(res: Response, token: string): void {
  // Deliberately omit Max-Age so closing the browser also ends the admin login.
  res.append('Set-Cookie', `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/api${cookieSecurityAttributes()}`)
}

export function clearAuthCookie(res: Response): void {
  res.append('Set-Cookie', `${AUTH_COOKIE}=; Path=/; Max-Age=0${cookieSecurityAttributes()}`)
}

export function clearRefreshCookie(res: Response): void {
  res.append('Set-Cookie', `${REFRESH_COOKIE}=; Path=/api/auth; Max-Age=0${cookieSecurityAttributes()}`)
}

export function clearAdminSessionCookie(res: Response): void {
  res.append('Set-Cookie', `${ADMIN_SESSION_COOKIE}=; Path=/api; Max-Age=0${cookieSecurityAttributes()}`)
}

export function clearAuthCookies(res: Response): void {
  clearAuthCookie(res)
  clearRefreshCookie(res)
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
