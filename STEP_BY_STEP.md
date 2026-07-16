# ChineseDict - Trạng thái triển khai

> Cập nhật: 16/07/2026. Kế hoạch ban đầu đã hoàn tất và được thay bằng checklist vận hành dưới đây.

## Phạm vi hiện có

- [x] Backend Express/TypeScript và PostgreSQL qua Prisma
- [x] Frontend Next.js App Router
- [x] Google OAuth, hồ sơ và cài đặt tài khoản
- [x] HSK1-HSK6, flashcard, dictation, word arrangement, quiz và speaking
- [x] Audio qua Web Speech API hoặc tệp audio của nội dung
- [x] EXP, tiến độ và bảng xếp hạng
- [x] Admin dashboard và CRUD nội dung/người dùng
- [x] Thanh toán chuyển khoản, QR, lịch sử subscription và xác nhận admin/Telegram
- [x] 3 bài miễn phí đầu mỗi HSK; Pro còn hạn mở toàn bộ

## Thứ tự chạy local

1. Cấu hình biến môi trường trong `backend/.env` và `frontend/.env.local`.
2. Chạy migration Prisma từ thư mục `backend`.
3. Khởi động backend tại cổng 4000.
4. Khởi động frontend tại cổng 3000.
5. Kiểm tra đăng nhập, một bài miễn phí, một bài khóa và luồng gửi yêu cầu thanh toán.

```powershell
cd backend
npm run db:migrate
npm run dev

cd ..\frontend
npm run dev
```

## Checklist phát hành

- [ ] Migration production đã ở trạng thái applied
- [ ] Backend typecheck thành công
- [ ] Frontend lint và production build thành công
- [ ] API từ chối level/period không hợp lệ bằng HTTP 400
- [ ] Bài 1-3 từng HSK mở miễn phí; bài 4 trở đi trả HTTP 403 nếu chưa có Pro
- [ ] Pro còn hạn truy cập được toàn bộ; Pro hết hạn bị khóa lại
- [ ] Một user không thể tạo hai yêu cầu payment `PENDING`
- [ ] Xác nhận lặp lại không cộng hạn hai lần
