# Kế hoạch tích hợp Telegram Bot xác nhận thanh toán

## Mục tiêu

Khi người dùng bấm "Xác nhận đã chuyển khoản" trên Web, gửi thông báo đến Telegram bot, admin có thể bấm nút xác nhận/từ chối ngay trên Telegram để kích hoạt Pro.

---

## Kiến trúc

```
User (Web)                   Backend (Express)                  Telegram Bot
    |                             |                                |
    |--- POST /api/subscriptions -|                                |
    |      { planId, content }    |                                |
    |                             |--- notifyNewSubscription() --->|
    |                             |     Tạo PENDING subscription   |--- Gửi tin nhắn + nút
    |                             |                                |    [✅ Xác nhận] [❌ Từ chối]
    |                             |                                |
    |                             |<--- callback_query: confirm ---|
    |                             |     subscription_confirm:id    |
    |                             |                                |
    |                             |--- Cập nhật DB ----------------|
    |                             |     status → CONFIRMED         |
    |                             |     user.isPremium → true      |
    |                             |                                |
    |                             |---> replySuccess() ----------->| reply: ✅ Đã kích hoạt!
```

---

## Các thay đổi

### 1. Backend — Thêm biến môi trường

**File: `backend/.env`**

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ADMIN_CHAT_ID=your_chat_id_here
```

### 2. Backend — Cài thư viện

```bash
cd backend
pnpm add node-telegram-bot-api
pnpm add -D @types/node-telegram-bot-api
```

### 3. Backend — File mới: `backend/src/lib/telegram-bot.ts`

- Khởi tạo bot với token từ env
- Export `notifyNewSubscription(data)` gửi tin nhắn đến `TELEGRAM_ADMIN_CHAT_ID`
- Tin nhắn gồm: username, email, gói, số tiền, nội dung chuyển khoản
- Kèm inline keyboard: [✅ Xác nhận] [❌ Từ chối]

### 4. Backend — File mới: `backend/src/lib/telegram-handler.ts`

- Lắng nghe `callback_query` từ Telegram
- Parse action: `subscription_confirm:<id>` hoặc `subscription_reject:<id>`
- Gọi subscription service tương ứng
- Trả lời tin nhắn kết quả

### 5. Backend — File mới: `backend/src/modules/subscriptions/subscription.routes.ts`

| Method | Endpoint                | Mô tả                                     |
| ------ | ----------------------- | ----------------------------------------- |
| POST   | `/api/subscriptions`    | User tạo yêu cầu nâng cấp (requires auth) |
| GET    | `/api/subscriptions/my` | User xem lịch sử subscription             |

**Body `POST /api/subscriptions`:**

```json
{
  "planId": "6months",
  "transferContent": "[username - user@email.com]"
}
```

### 6. Backend — File mới: `backend/src/modules/subscriptions/subscription.service.ts`

| Function                                              | Mô tả                                         |
| ----------------------------------------------------- | --------------------------------------------- |
| `createSubscription(userId, planId, transferContent)` | Tạo PENDING + gọi notifyTelegram              |
| `confirmSubscription(subscriptionId, adminUserId)`    | CONFIRMED + set isPremium + subscriptionUntil |
| `rejectSubscription(subscriptionId, adminUserId)`     | REJECTED                                      |

### 7. Backend — Sửa `backend/src/app.ts`

Mount subscription routes:

```ts
import subscriptionRoutes from "./modules/subscriptions/subscription.routes";
app.use("/api", subscriptionRoutes);
```

Import & init Telegram bot/handler:

```ts
import "./lib/telegram-bot";
import "./lib/telegram-handler";
```

### 8. Frontend — Sửa `frontend/src/components/qr-payment-modal.tsx`

**Hiện tại:** `handleConfirm` là mock (fake delay 600ms, không gọi API).

**Sửa thành:**

- `handleConfirm` gọi `POST /api/subscriptions` với `{ planId, transferContent }`
- `transferContent` sinh động: `[${user.email || user.username} - ${planId}]`
- Show trạng thái: loading → gửi thành công → "Yêu cầu đã được gửi đến admin, vui lòng chờ xác nhận qua Telegram"
- Xử lý lỗi nếu API fail

Cần thêm `useAuth()` để lấy thông tin user hiện tại.

---

## Flow chi tiết

### User gửi yêu cầu

1. User mở modal QR, chuyển khoản xong
2. User bấm "Xác nhận đã chuyển khoản"
3. Frontend gọi `POST /api/subscriptions`
4. Backend tạo `Subscription { status: PENDING }`
5. Backend gửi Telegram cho admin

### Admin xác nhận trên Telegram

1. Admin nhận tin nhắn:

   ```
   📦 Yêu cầu nâng cấp Pro mới
   👤 User: username (email@example.com)
   📋 Gói: 6 tháng
   💰 Số tiền: 119,000đ

   [✅ Xác nhận] [❌ Từ chối]
   ```

2. Admin bấm ✅ Xác nhận
3. Bot nhận callback → gọi `confirmSubscription(id, adminId)`
4. DB update: `status → CONFIRMED`, `user.isPremium → true`
5. Bot reply: `✅ Đã kích hoạt Pro cho username!`

### Admin từ chối

1. Admin bấm ❌ Từ chối
2. Bot nhận callback → gọi `rejectSubscription(id, adminId)`
3. DB update: `status → REJECTED`
4. Bot reply: `❌ Đã từ chối yêu cầu của username`

---

## Các file cần tạo/sửa

| Hành động  | File                                                             |
| ---------- | ---------------------------------------------------------------- |
| ✨ Tạo mới | `backend/src/lib/telegram-bot.ts`                                |
| ✨ Tạo mới | `backend/src/lib/telegram-handler.ts`                            |
| ✨ Tạo mới | `backend/src/modules/subscriptions/subscription.routes.ts`       |
| ✨ Tạo mới | `backend/src/modules/subscriptions/subscription.service.ts`      |
| 🔧 Sửa     | `backend/.env` — thêm TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID |
| 🔧 Sửa     | `backend/src/app.ts` — mount routes, init bot                    |
| 🔧 Sửa     | `frontend/src/components/qr-payment-modal.tsx` — gọi API thật    |

---

## Ghi chú

- Bot token lấy từ [@BotFather](https://t.me/BotFather) trên Telegram
- Admin chat ID lấy bằng cách gửi tin nhắn cho bot rồi dùng API `getUpdates`
- User cần đăng nhập mới gửi được yêu cầu (middleware auth)
- Chỉ user premium mới thấy nút Xác nhận (hoặc kiểm tra chưa có subscription active)
