import { confirmSubscription, rejectSubscription } from '../modules/subscriptions/subscription.service'
import { getAdminChatId, getBot, isTelegramConfigured } from './telegram-bot'

type NewSubscriptionNotification = {
  id: string
  user?: string | null
  username?: string | null
  email?: string | null
  plan?: string | null
  planId?: string | null
  amount: number
  transferContent: string
}

type TelegramCallbackQuery = {
  id: string
  data?: string
  message?: {
    message_id: number
    chat: { id: number }
  }
}

type SubscriptionResult = {
  id: string
  userId: string
  planId: unknown
  amount: number
  transferContent: string
  expiresAt?: Date | null
}

let handlersReady = false

function escapeMarkdown(value: unknown) {
  return String(value ?? '-').replace(/([_*`[\]])/g, '\\$1')
}

function formatMoney(amount: number) {
  return `${amount.toLocaleString('vi-VN')} VND`
}

function formatPlan(plan: unknown) {
  if (plan === 'SIX_MONTHS') return '6months'
  if (plan === 'TWELVE_MONTHS') return '12months'
  if (plan === 'TWO_MONTHS') return '2months'
  return plan
}

function parseCallbackData(data?: string) {
  if (!data) return null
  const [action, id] = data.split(':')
  if (!id) return null
  if (action !== 'subscription_confirm' && action !== 'subscription_reject') return null
  return { action, id }
}

async function answerCallbackSafely(
  bot: ReturnType<typeof getBot>,
  queryId: string,
  text: string,
) {
  try {
    await bot.answerCallbackQuery(queryId, { text })
  } catch (error) {
    console.warn('Failed to answer Telegram callback query:', error)
  }
}

async function editCallbackMessageSafely(
  bot: ReturnType<typeof getBot>,
  query: TelegramCallbackQuery,
  text: string,
) {
  if (!query.message) return

  try {
    await bot.editMessageText(text, {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id,
      parse_mode: 'Markdown',
    })
  } catch (error) {
    console.warn('Failed to edit Telegram callback message:', error)
  }
}

async function sendSubscriptionResultMessage(
  bot: ReturnType<typeof getBot>,
  chatId: number,
  status: 'confirmed' | 'rejected',
  subscription: SubscriptionResult,
) {
  const isConfirmed = status === 'confirmed'
  const message = [
    isConfirmed ? '*Subscription confirmed*' : '*Subscription rejected*',
    '',
    `ID: \`${escapeMarkdown(subscription.id)}\``,
    `User ID: \`${escapeMarkdown(subscription.userId)}\``,
    `Plan: ${escapeMarkdown(formatPlan(subscription.planId))}`,
    `Amount: ${escapeMarkdown(formatMoney(subscription.amount))}`,
    `Transfer content: \`${escapeMarkdown(subscription.transferContent)}\``,
    ...(isConfirmed && subscription.expiresAt
      ? [`Expires at: ${escapeMarkdown(subscription.expiresAt.toLocaleDateString('vi-VN'))}`]
      : []),
  ].join('\n')

  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
}

export function setupTelegramHandlers() {
  if (handlersReady) return
  if (!isTelegramConfigured()) return

  const bot = getBot()
  const adminChatId = getAdminChatId()
  handlersReady = true

  bot.on('callback_query', async (query) => {
    const chatId = query.message?.chat.id
    if (chatId !== adminChatId) {
      await answerCallbackSafely(bot, query.id, 'Not allowed')
      return
    }

    const parsed = parseCallbackData(query.data)
    if (!parsed) {
      await answerCallbackSafely(bot, query.id, 'Invalid action')
      return
    }

    await answerCallbackSafely(bot, query.id, 'Processing request...')

    try {
      if (parsed.action === 'subscription_confirm') {
        const subscription = await confirmSubscription(parsed.id, 'telegram_admin')
        await editCallbackMessageSafely(bot, query, `*Subscription confirmed*\n\nID: \`${escapeMarkdown(parsed.id)}\``)
        await sendSubscriptionResultMessage(bot, adminChatId, 'confirmed', subscription)
        return
      }

      const subscription = await rejectSubscription(parsed.id, 'telegram_admin')
      await editCallbackMessageSafely(bot, query, `*Subscription rejected*\n\nID: \`${escapeMarkdown(parsed.id)}\``)
      await sendSubscriptionResultMessage(bot, adminChatId, 'rejected', subscription)
    } catch (error) {
      console.error('Telegram callback handler failed:', error)

      const text = error instanceof Error && error.message === 'Subscription is not pending'
        ? `Request was already processed.\n\nID: \`${escapeMarkdown(parsed.id)}\``
        : `Could not process request.\n\nID: \`${escapeMarkdown(parsed.id)}\``

      await editCallbackMessageSafely(bot, query, text)
    }
  })
}

export async function notifyNewSubscription(data: NewSubscriptionNotification) {
  const bot = getBot()
  const adminChatId = getAdminChatId()
  const user = data.user ?? data.username ?? '-'
  const plan = data.plan ?? data.planId ?? '-'

  const message = [
    '*New Pro upgrade request*',
    '',
    `User: ${escapeMarkdown(user)}`,
    `Email: ${escapeMarkdown(data.email)}`,
    `Plan: ${escapeMarkdown(plan)}`,
    `Amount: ${escapeMarkdown(formatMoney(data.amount))}`,
    `Transfer content: \`${escapeMarkdown(data.transferContent)}\``,
    `ID: \`${escapeMarkdown(data.id)}\``,
  ].join('\n')

  await bot.sendMessage(adminChatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: 'Confirm', callback_data: `subscription_confirm:${data.id}` },
        { text: 'Reject', callback_data: `subscription_reject:${data.id}` },
      ]],
    },
  })
}
