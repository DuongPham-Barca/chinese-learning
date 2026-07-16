import TelegramBot from 'node-telegram-bot-api'

let bot: TelegramBot | null = null

export function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_ADMIN_CHAT_ID?.trim())
}

export function getBot() {
  if (bot) return bot

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured')

  bot = new TelegramBot(token, { polling: true })
  return bot
}

export function getAdminChatId() {
  const chatId = Number(process.env.TELEGRAM_ADMIN_CHAT_ID)
  if (!Number.isFinite(chatId)) throw new Error('TELEGRAM_ADMIN_CHAT_ID is not configured')
  return chatId
}
