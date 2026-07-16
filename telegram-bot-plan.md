# Telegram Bot - Xác nhận thanh toán

> Trạng thái: đã triển khai. Cập nhật ngày 16/07/2026.

## Luồng hoạt động

1. Người dùng đăng nhập, quét QR và gửi `POST /api/subscriptions`.
2. Backend tạo subscription `PENDING` và gửi thông báo tới chat quản trị.
3. Admin chọn xác nhận hoặc từ chối trong Telegram.
4. Callback gọi chung subscription service với API admin.
5. Xác nhận chuyển trạng thái sang `CONFIRMED`, bật Pro và cộng dồn `subscriptionUntil`.
6. Từ chối chuyển trạng thái sang `REJECTED`.

Xử lý callback là atomic: cùng một subscription chỉ được chuyển khỏi `PENDING` một lần, nên callback lặp không thể gia hạn hai lần.

## Biến môi trường

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ADMIN_CHAT_ID=your_chat_id_here
```

Telegram là tích hợp tùy chọn. Nếu thiếu một trong hai biến trên, backend vẫn khởi động và các API/admin web vẫn hoạt động; chỉ việc gửi và xử lý thông báo Telegram được bỏ qua.

## File liên quan

| File | Vai trò |
| --- | --- |
| `backend/src/lib/telegram-bot.ts` | Khởi tạo bot và gửi thông báo |
| `backend/src/lib/telegram-handler.ts` | Nhận callback xác nhận/từ chối |
| `backend/src/modules/subscriptions/subscription.routes.ts` | API tạo và xem yêu cầu |
| `backend/src/modules/subscriptions/subscription.service.ts` | Xử lý trạng thái và thời hạn |
| `frontend/src/components/qr-payment-modal.tsx` | Gửi yêu cầu thật từ giao diện QR |

## Kiểm tra vận hành

- Token và chat ID thuộc đúng bot/chat quản trị.
- Bot đã được khởi động bằng `/start` và có quyền gửi tin.
- Một user không thể có đồng thời hai yêu cầu `PENDING`.
- Nút Telegram đã bấm lần hai phải báo yêu cầu không còn chờ xử lý.
- Hạn mới được cộng từ hạn cũ nếu gói hiện tại vẫn còn hiệu lực.
