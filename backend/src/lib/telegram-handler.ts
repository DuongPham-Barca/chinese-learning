import { confirmSubscription, rejectSubscription } from '../modules/subscriptions/subscription.service'
import { getAdminChatId, getBot } from './telegram-bot'

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

let handlersReady = false

function escapeMarkdown(value: unknown) {
  return String(value ?? '-').replace(/([_*`[\]])/g, '\\$1')
}

function formatMoney(amount: number) {
  return `${amount.toLocaleString('vi-VN')}đ`
}

function parseCallbackData(data?: string) {
  if (!data) return null
  const [action, id] = data.split(':')
  if (!id) return null
  if (action !== 'subscription_confirm' && action !== 'subscription_reject') return null
  return { action, id }
}

async function editCallbackMessage(bot: ReturnType<typeof getBot>, query: TelegramCallbackQuery, text: string) {
  if (!query.message) return
  await bot.editMessageText(text, {
    chat_id: query.message.chat.id,
    message_id: query.message.message_id,
    parse_mode: 'Markdown',
  })
}

export function setupTelegramHandlers() {
  if (handlersReady) return

  const bot = getBot()
  const adminChatId = getAdminChatId()
  handlersReady = true

  bot.on('callback_query', async (query) => {
    const chatId = query.message?.chat.id
    if (chatId !== adminChatId) {
      await bot.answerCallbackQuery(query.id, { text: 'Bạn không phải admin' })
      return
    }

    const parsed = parseCallbackData(query.data)
    if (!parsed) {
      await bot.answerCallbackQuery(query.id, { text: 'Không nhận diện được hành động' })
      return
    }

    try {
      if (parsed.action === 'subscription_confirm') {
        await confirmSubscription(parsed.id, 'telegram_admin')
        await bot.answerCallbackQuery(query.id, { text: 'Đã xác nhận nâng cấp Pro' })
        await editCallbackMessage(bot, query, `✅ *Đã xác nhận nâng cấp Pro*\n\nID: \`${escapeMarkdown(parsed.id)}\``)
        return
      }

      await rejectSubscription(parsed.id, 'telegram_admin')
      await bot.answerCallbackQuery(query.id, { text: 'Đã từ chối yêu cầu' })
      await editCallbackMessage(bot, query, `❌ *Đã từ chối yêu cầu nâng cấp Pro*\n\nID: \`${escapeMarkdown(parsed.id)}\``)
    } catch (error) {
      console.error('Telegram callback handler failed:', error)
      await bot.answerCallbackQuery(query.id, { text: 'Không xử lý được yêu cầu' })
    }
  })
}

export async function notifyNewSubscription(data: NewSubscriptionNotification) {
  const bot = getBot()
  const adminChatId = getAdminChatId()
  const user = data.user ?? data.username ?? '-'
  const plan = data.plan ?? data.planId ?? '-'

  const message = [
    '*Yêu cầu nâng cấp Pro mới*',
    '',
    `User: ${escapeMarkdown(user)}`,
    `Email: ${escapeMarkdown(data.email)}`,
    `Gói: ${escapeMarkdown(plan)}`,
    `Số tiền: ${escapeMarkdown(formatMoney(data.amount))}`,
    `Nội dung CK: \`${escapeMarkdown(data.transferContent)}\``,
    `ID: \`${escapeMarkdown(data.id)}\``,
  ].join('\n')

  await bot.sendMessage(adminChatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Xác nhận', callback_data: `subscription_confirm:${data.id}` },
        { text: '❌ Từ chối', callback_data: `subscription_reject:${data.id}` },
      ]],
    },
  })
}
