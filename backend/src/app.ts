import cors from 'cors'
import express from 'express'
import type { ErrorRequestHandler } from 'express'
import { adminGuard } from './lib/admin-guard'
import { setupTelegramHandlers } from './lib/telegram-handler'
import './lib/telegram-bot'
import adminContentRoutes from './modules/admin/admin-content.routes'
import adminDashboardRoutes from './modules/admin/admin-dashboard.routes'
import adminUsersRoutes from './modules/admin/admin-users.routes'
import authRoutes from './modules/auth/auth.routes'
import leaderboardRoutes from './modules/leaderboard/leaderboard.routes'
import lessonRoutes from './modules/lessons/lessons.routes'
import progressRoutes from './modules/progress/progress.routes'
import sentenceRoutes from './modules/sentences/sentences.routes'
import subscriptionRoutes from './modules/subscriptions/subscription.routes'
import vocabRoutes from './modules/vocabulary/vocabulary.routes'

export const app = express()

app.set('trust proxy', 1)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api', subscriptionRoutes)
// Defense-in-depth: every current or future /api/admin endpoint is protected centrally.
app.use('/api/admin', adminGuard)
app.use('/api/admin', adminContentRoutes)
app.use('/api/admin', adminDashboardRoutes)
app.use('/api/admin', adminUsersRoutes)
app.use('/api/lessons', lessonRoutes)
app.use('/api/vocabulary', vocabRoutes)
app.use('/api/sentences', sentenceRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/leaderboard', leaderboardRoutes)

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ error: 'Internal server error' })
}

app.use(errorHandler)

setupTelegramHandlers()
