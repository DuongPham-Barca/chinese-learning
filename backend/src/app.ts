import cors from 'cors'
import express from 'express'
import type { ErrorRequestHandler } from 'express'
import authRoutes from './modules/auth/auth.routes'
import leaderboardRoutes from './modules/leaderboard/leaderboard.routes'
import lessonRoutes from './modules/lessons/lessons.routes'
import progressRoutes from './modules/progress/progress.routes'
import sentenceRoutes from './modules/sentences/sentences.routes'
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
