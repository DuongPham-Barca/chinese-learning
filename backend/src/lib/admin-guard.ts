import { Role, type User } from '@prisma/client'
import type { Request, RequestHandler } from 'express'
import { getUserId } from './auth'
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
  const userId = getUserId(req)
  if (!userId) {
    throw new AdminGuardError(401, 'Unauthorized')
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new AdminGuardError(401, 'Unauthorized')
  }

  if (user.role !== Role.ADMIN) {
    throw new AdminGuardError(403, 'Forbidden')
  }

  return user
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
        res.status(error.statusCode).json({ error: error.message })
        return
      }

      next(error)
    })
}
