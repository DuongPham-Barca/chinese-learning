import { Prisma } from '@prisma/client'
import type { Request, Response } from 'express'
import {
  clearAuthCookies,
  clearAdminSessionCookie,
  createAuthToken,
  createRefreshToken,
  getRefreshToken,
  getAdminSessionToken,
  hashRefreshToken,
  REFRESH_TOKEN_LIFETIME_MS,
  setAuthCookie,
  setAdminSessionCookie,
  setRefreshCookie,
} from './auth'
import { prisma } from './prisma'

type SessionUser = {
  id: string
  email: string | null
}

function refreshExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_LIFETIME_MS)
}

function setSessionCookies(res: Response, user: SessionUser, refreshToken: string): void {
  setAuthCookie(res, createAuthToken({ userId: user.id, email: user.email }))
  setRefreshCookie(res, refreshToken)
}

export async function issueAuthSession(res: Response, user: SessionUser): Promise<void> {
  const refreshToken = createRefreshToken()

  await prisma.session.create({
    data: {
      userId: user.id,
      sessionToken: hashRefreshToken(refreshToken),
      expires: refreshExpiry(),
    },
  })

  setSessionCookies(res, user, refreshToken)
}

export async function issueAdminSession(res: Response, user: SessionUser): Promise<void> {
  const sessionToken = createRefreshToken()

  await prisma.session.create({
    data: {
      userId: user.id,
      sessionToken: hashRefreshToken(sessionToken),
      // Safety ceiling only. The frontend revokes this session immediately
      // whenever the administrator leaves the /admin area.
      expires: new Date(Date.now() + 30 * 60 * 1000),
    },
  })

  setAdminSessionCookie(res, sessionToken)
}

export async function rotateAuthSession(req: Request, res: Response): Promise<boolean> {
  const currentToken = getRefreshToken(req)
  if (!currentToken) return false

  const session = await prisma.session.findUnique({
    where: { sessionToken: hashRefreshToken(currentToken) },
    select: {
      id: true,
      expires: true,
      user: { select: { id: true, email: true } },
    },
  })

  if (!session || session.expires <= new Date()) {
    if (session) await prisma.session.deleteMany({ where: { id: session.id } })
    return false
  }

  const nextToken = createRefreshToken()

  try {
    await prisma.$transaction([
      prisma.session.delete({ where: { id: session.id } }),
      prisma.session.create({
        data: {
          userId: session.user.id,
          sessionToken: hashRefreshToken(nextToken),
          expires: refreshExpiry(),
        },
      }),
    ])
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError
      && ['P2002', 'P2025'].includes(error.code)
    ) {
      return false
    }
    throw error
  }

  setSessionCookies(res, session.user, nextToken)
  return true
}

export async function revokeRefreshSession(req: Request): Promise<void> {
  const refreshToken = getRefreshToken(req)
  if (!refreshToken) return

  await prisma.session.deleteMany({
    where: { sessionToken: hashRefreshToken(refreshToken) },
  })
}

export async function revokeAdminSession(req: Request, res: Response): Promise<void> {
  const sessionToken = getAdminSessionToken(req)
  if (sessionToken) {
    await prisma.session.deleteMany({
      where: { sessionToken: hashRefreshToken(sessionToken) },
    })
  }

  clearAdminSessionCookie(res)
}

export function rejectAuthSession(res: Response): void {
  clearAuthCookies(res)
}
