import { createHash, randomBytes } from 'crypto'
import { Prisma, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { Router, type RequestHandler } from 'express'
import multer from 'multer'
import { z } from 'zod'
import {
  clearAuthCookies,
  createOAuthSecret,
  getUserId,
  readCookies,
  secretsMatch,
} from '../../lib/auth'
import {
  issueAuthSession,
  revokeRefreshSession,
  rotateAuthSession,
} from '../../lib/auth-session'
import { asyncHandler } from '../../lib/async-handler'
import {
  AvatarUploadError,
  isAvatarContentType,
  uploadAvatar,
} from '../../lib/cloudflare-r2'
import { prisma } from '../../lib/prisma'

const router = Router()

const googleTokenSchema = z.object({
  access_token: z.string(),
})

const adminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

const usernameSchema = z.string().trim().min(1).max(50)
const maxAvatarSize = 5 * 1024 * 1024
const publicUserSelect = {
  id: true,
  email: true,
  username: true,
  avatarUrl: true,
  role: true,
  subscriptionUntil: true,
  isPremium: true,
} satisfies Prisma.UserSelect

type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>

function serializePublicUser(user: PublicUser) {
  const { avatarUrl, ...rest } = user
  return { ...rest, avatar: avatarUrl }
}

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxAvatarSize,
    files: 1,
    fields: 2,
  },
  fileFilter: (_req, file, callback) => {
    if (!isAvatarContentType(file.mimetype)) {
      callback(new AvatarUploadError('Avatar must be a JPG, PNG, or WebP image'))
      return
    }

    callback(null, true)
  },
})

const requireCurrentUser: RequestHandler = (req, res, next) => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  res.locals.userId = userId
  next()
}

const parseAvatarUpload: RequestHandler = (req, res, next) => {
  if (!req.is('multipart/form-data')) {
    next()
    return
  }

  avatarUpload.single('avatar')(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'Avatar must be 5MB or smaller'
        : 'Invalid avatar upload'
      res.status(400).json({ error: message })
      return
    }

    if (error instanceof AvatarUploadError) {
      res.status(400).json({ error: error.message })
      return
    }

    if (error) {
      next(error)
      return
    }

    next()
  })
}

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

  await issueAuthSession(res, user)
  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  })
}))

router.post('/refresh', asyncHandler(async (req, res) => {
  if (!(await rotateAuthSession(req, res))) {
    clearAuthCookies(res)
    return res.status(401).json({ error: 'Unauthorized' })
  }

  res.status(204).end()
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
        data: { avatarUrl: existingUser.avatarUrl || googleUser.picture || null },
      })
    : await prisma.user.create({
        data: {
          email: googleUser.email,
          username: `${googleUser.email.split('@')[0]}-${randomBytes(3).toString('hex')}`,
          avatarUrl: googleUser.picture || null,
        },
      })

  await issueAuthSession(res, user)
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
      role: true,
      subscriptionUntil: true,
    },
  })

  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json({ user })
}))

router.put('/me', requireCurrentUser, parseAvatarUpload, asyncHandler(async (req, res) => {
  const userId = res.locals.userId as string
  const body = req.body as Record<string, unknown> | undefined
  const hasUsername = Boolean(body && Object.prototype.hasOwnProperty.call(body, 'username'))
  const hasAvatar = Boolean(body && Object.prototype.hasOwnProperty.call(body, 'avatar'))
  let username: string | undefined

  if (hasUsername) {
    const parsedUsername = usernameSchema.safeParse(body?.username)
    if (!parsedUsername.success) {
      return res.status(400).json({ error: 'Username must be between 1 and 50 characters' })
    }
    username = parsedUsername.data

    const usernameOwner = await prisma.user.findUnique({ where: { username } })
    if (usernameOwner && usernameOwner.id !== userId) {
      return res.status(409).json({ error: 'Username is already in use' })
    }
  }

  const removeAvatar = hasAvatar && (body?.avatar === null || body?.avatar === '')
  if (hasAvatar && !removeAvatar && !req.file) {
    return res.status(400).json({ error: 'Avatar must be uploaded as an image file' })
  }

  if (!hasUsername && !req.file && !removeAvatar) {
    return res.status(400).json({ error: 'No valid profile fields provided' })
  }

  const data: Prisma.UserUpdateInput = {}
  if (username !== undefined) data.username = username

  if (req.file) {
    if (!isAvatarContentType(req.file.mimetype)) {
      return res.status(400).json({ error: 'Avatar must be a JPG, PNG, or WebP image' })
    }

    try {
      data.avatarUrl = await uploadAvatar(userId, req.file.buffer, req.file.mimetype)
    } catch (error) {
      if (error instanceof AvatarUploadError) {
        return res.status(400).json({ error: error.message })
      }
      throw error
    }
  } else if (removeAvatar) {
    data.avatarUrl = null
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: publicUserSelect,
    })
    res.json(serializePublicUser(user))
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Username is already in use' })
      }
      if (error.code === 'P2025') {
        return res.status(401).json({ error: 'Unauthorized' })
      }
    }
    throw error
  }
}))

router.delete('/me', requireCurrentUser, asyncHandler(async (_req, res) => {
  const result = await prisma.user.deleteMany({
    where: { id: res.locals.userId as string },
  })

  if (result.count === 0) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  clearAuthCookies(res)
  res.json({ success: true })
}))

router.post('/logout', asyncHandler(async (req, res) => {
  await revokeRefreshSession(req)
  clearAuthCookies(res)
  res.status(204).end()
}))

export default router
