# Backend Status - Hana

> Cập nhật: 16/07/2026. Tài liệu này phản ánh trạng thái đã triển khai, không phải danh sách tính năng còn thiếu.

## Kiến trúc

- Express + TypeScript, Prisma và PostgreSQL/Supabase.
- Google OAuth, JWT lưu trong cookie HTTP-only.
- Phân quyền `USER`/`ADMIN` và middleware bảo vệ API quản trị.
- Cloudflare R2 cho tệp nội dung; email và Telegram là các tích hợp tùy chọn.

## Chức năng đã có

| Module                                                   | Trạng thái |
| -------------------------------------------------------- | ---------- |
| Auth, cập nhật hồ sơ, xóa tài khoản                      | Hoàn thành |
| Danh sách/cụ thể bài học, từ vựng, câu mẫu               | Hoàn thành |
| Tiến độ, EXP, xóa/reset tiến độ                          | Hoàn thành |
| Bảng xếp hạng all/week/month                             | Hoàn thành |
| Admin dashboard, user, lesson, vocabulary, sentence CRUD | Hoàn thành |
| Import Excel và quản lý nội dung luyện tập               | Hoàn thành |
| Tạo, xác nhận, từ chối và gia hạn subscription           | Hoàn thành |
| Xác nhận payment từ admin và Telegram                    | Hoàn thành |

## Quy tắc truy cập bài học

- Mỗi cấp HSK có đúng 3 bài đầu miễn phí.
- Người chưa đăng nhập hoặc chưa có Pro còn hiệu lực chỉ truy cập được các bài miễn phí.
- Pro chỉ hợp lệ khi `isPremium = true` và `subscriptionUntil` lớn hơn thời điểm hiện tại.
- Khi Pro hết hạn, bài thứ 4 trở đi của từng HSK tự động bị khóa lại.
- API bài học, từ vựng, câu mẫu và tiến độ đều kiểm tra quyền truy cập ở backend; frontend chỉ phản ánh kết quả đó.
- Cấp HSK hoặc bài học chưa xuất bản không xuất hiện ở public API.

## Quy tắc subscription

1. Người dùng gửi một yêu cầu `PENDING` sau khi chuyển khoản.
2. Mỗi người chỉ có tối đa một yêu cầu `PENDING` tại một thời điểm.
3. Admin hoặc Telegram xác nhận atomically để tránh hai callback cùng gia hạn hai lần.
4. Nếu gói hiện tại còn hạn, thời gian mới được cộng từ `subscriptionUntil`; nếu đã hết hạn, tính từ lúc xác nhận.
5. Từ chối chỉ có hiệu lực với yêu cầu còn `PENDING`.

## Migration quan trọng

- `20260716170000_align_lesson_free_access`: chuẩn hóa 3 bài miễn phí đầu mỗi HSK.
- `20260716190000_prevent_duplicate_pending_and_progress`: dọn dữ liệu trùng và thêm unique index cho yêu cầu payment đang chờ cùng tiến độ module.

## Kiểm tra trước khi phát hành

```powershell
cd backend
npm run db:migrate
node_modules\.bin\tsc.cmd --noEmit

cd ..\frontend
npm run lint
npm run build
```
