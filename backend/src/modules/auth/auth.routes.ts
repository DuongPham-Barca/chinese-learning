import { createHash, randomBytes } from 'crypto'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import {
  clearAuthCookie,
  createAuthToken,
  createOAuthSecret,
  getUserId,
  readCookies,
  secretsMatch,
  setAuthCookie,
} from '../../lib/auth'
import { asyncHandler } from '../../lib/async-handler'
import { prisma } from '../../lib/prisma'

const router = Router()

const googleTokenSchema = z.object({
  access_token: z.string(),
})

const adminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

const googleUserSchema = z.object({
  email: z.string().email(),
  email_verified: z.boolean(),
  name: z.string().optional(),
  picture: z.string().url().optional(),
})

function getGoogleConfig(req: Parameters<typeof getCallbackUrl>[0]) {
  const clientId = process.env.AUTH_GOOGLE_ID
  const clientSecret = process.env.AUTH_GOOGLE_SECRET
  if (!clientId || !clientSecret) throw new Error('Google OAuth is not configured')

  return {
    clientId,
    clientSecret,
    callbackUrl: getCallbackUrl(req),
  }
}

function getCallbackUrl(req: import('express').Request): string {
  return process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`
}

function setTemporaryCookie(res: import('express').Response, name: string, value: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.append('Set-Cookie', `${name}=${encodeURIComponent(value)}; Path=/api/auth/google; Max-Age=600; HttpOnly; SameSite=Lax${secure}`)
}

function clearTemporaryCookies(res: import('express').Response): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.append('Set-Cookie', `oauth_state=; Path=/api/auth/google; Max-Age=0; HttpOnly; SameSite=Lax${secure}`)
  res.append('Set-Cookie', `oauth_verifier=; Path=/api/auth/google; Max-Age=0; HttpOnly; SameSite=Lax${secure}`)
}

router.post('/admin/login', asyncHandler(async (req, res) => {
  const credentials = adminLoginSchema.safeParse(req.body)
  if (!credentials.success) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }

  const user = await prisma.user.findUnique({
    where: { username: credentials.data.username },
  })

  if (
    !user
    || user.role !== Role.ADMIN
    || !user.passwordHash
    || !(await bcrypt.compare(credentials.data.password, user.passwordHash))
  ) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }

  setAuthCookie(res, createAuthToken({ userId: user.id, email: user.email }))
  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  })
}))

router.get('/google', (req, res) => {
  const { clientId, callbackUrl } = getGoogleConfig(req)
  const state = createOAuthSecret()
  const verifier = createOAuthSecret()
  const challenge = createHash('sha256').update(verifier).digest('base64url')

  setTemporaryCookie(res, 'oauth_state', state)
  setTemporaryCookie(res, 'oauth_verifier', verifier)

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  })

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
})

router.get('/google/callback', asyncHandler(async (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code : undefined
  const state = typeof req.query.state === 'string' ? req.query.state : undefined
  const cookies = readCookies(req)

  clearTemporaryCookies(res)

  if (!code || !secretsMatch(state, cookies.oauth_state) || !cookies.oauth_verifier) {
    return res.status(400).json({ error: 'Invalid OAuth callback' })
  }

  const { clientId, clientSecret, callbackUrl } = getGoogleConfig(req)
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
      code_verifier: cookies.oauth_verifier,
    }),
  })

  if (!tokenResponse.ok) throw new Error(`Google token exchange failed (${tokenResponse.status})`)
  const tokenData = googleTokenSchema.parse(await tokenResponse.json())

  const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  if (!userResponse.ok) throw new Error(`Google user lookup failed (${userResponse.status})`)
  const googleUser = googleUserSchema.parse(await userResponse.json())
  if (!googleUser.email_verified) return res.status(403).json({ error: 'Google email is not verified' })

  const existingUser = await prisma.user.findUnique({ where: { email: googleUser.email } })
  if (existingUser?.role === Role.ADMIN) {
    return res.status(403).json({ error: 'Admin accounts must use username and password' })
  }

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: { avatarUrl: googleUser.picture || existingUser.avatarUrl },
      })
    : await prisma.user.create({
        data: {
          email: googleUser.email,
          username: `${googleUser.email.split('@')[0]}-${randomBytes(3).toString('hex')}`,
          avatarUrl: googleUser.picture || null,
        },
      })

  setAuthCookie(res, createAuthToken({ userId: user.id, email: user.email }))
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`)
}))

router.get('/me', asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      expPoints: true,
      isPremium: true,
    },
  })

  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ user })
}))

router.post('/logout', (_req, res) => {
  clearAuthCookie(res)
  res.status(204).end()
})

export default router
