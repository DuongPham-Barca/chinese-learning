import { Role, type User } from '@prisma/client'
import type { Request, RequestHandler } from 'express'
import { clearAdminSessionCookie, getAdminSessionToken, hashRefreshToken } from './auth'
import { prisma } from './prisma'

export class AdminGuardError extends Error {
  constructor(
    public readonly statusCode: 401 | 403,
    message: 'Unauthorized' | 'Forbidden',
  ) {
    super(message)
    this.name = 'AdminGuardError'
  }
}

/**
 * Verifies the current JWT and returns the latest admin record from the database.
 * A valid token for a deleted user is treated as unauthorized.
 */
export async function requireAdmin(req: Request): Promise<User> {
  const sessionToken = getAdminSessionToken(req)
  if (!sessionToken) {
    throw new AdminGuardError(401, 'Unauthorized')
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken: hashRefreshToken(sessionToken) },
    include: { user: true },
  })
  if (!session || session.expires <= new Date()) {
    if (session) await prisma.session.deleteMany({ where: { id: session.id } })
    throw new AdminGuardError(401, 'Unauthorized')
  }

  if (session.user.role !== Role.ADMIN) {
    throw new AdminGuardError(403, 'Forbidden')
  }

  return session.user
}

/**
 * Express middleware variant. Protected routes can read the verified user from
 * `res.locals.admin` after this middleware succeeds.
 */
export const adminGuard: RequestHandler = (req, res, next) => {
  void requireAdmin(req)
    .then((admin) => {
      res.locals.admin = admin
      next()
    })
    .catch((error: unknown) => {
      if (error instanceof AdminGuardError) {
        clearAdminSessionCookie(res)
        res.status(error.statusCode).json({
          success: false,
          message: error.statusCode === 403
            ? 'Bạn không có quyền thực hiện thao tác này'
            : 'Chưa đăng nhập',
        })
        return
      }

      next(error)
    })
}
