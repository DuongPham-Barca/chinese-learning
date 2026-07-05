import { PrismaClient } from '@prisma/client'

const runtimeUrl = process.env.NODE_ENV === 'production'
  ? process.env.DATABASE_URL
  : process.env.DIRECT_URL || process.env.DATABASE_URL

export const prisma = new PrismaClient({
  datasources: runtimeUrl ? { db: { url: runtimeUrl } } : undefined,
})
