# 🗺️ BACKEND PLAN — ChineseDict

## ✅ Hiện tại đã làm được

### Database (Prisma + PostgreSQL)
- 7 models: User, Account, Session, VerificationToken, Lesson, Vocabulary, Sentence, Progress
- 2 migrations đã apply
- Seed: 3 bài HSK1 (30 từ vựng + 6 câu)

### Auth (`/api/auth`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/auth/google` | Redirect Google OAuth PKCE |
| GET | `/auth/google/callback` | Callback, tạo user, set JWT cookie |
| GET | `/auth/me` | Lấy user hiện tại |
| POST | `/auth/logout` | Xoá cookie |

### Lessons (`/api/lessons`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/lessons?level=` | List bài học, kèm _count |
| GET | `/lessons/:id` | Chi tiết + vocab + sentences |

> **Lưu ý**: App không có premium locking lessons — tất cả nội dung đều mở. Chỉ có **gia hạn theo gói (2/6/12 tháng)** để sử dụng app trong thời gian đó. User có `subscriptionUntil` để biết hạn dùng.

### Vocabulary (`/api/vocabulary`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/vocabulary/:lessonId` | List từ vựng theo bài |

### Sentences (`/api/sentences`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/sentences/:lessonId` | List câu theo bài |

### Progress (`/api/progress`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/progress` | Ghi tiến độ + cộng EXP |
| GET | `/progress/:userId` | Lịch sử học (owner only) |

### Leaderboard (`/api/leaderboard`)
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/leaderboard?period=` | Top 50 (all/week/month) |

---

## ❌ Thiếu / Cần làm

| Mục | Trạng thái |
|-----|-----------|
| Admin CRUD (users, lessons, vocab, sentences) | ❌ Chưa có |
| Admin Dashboard stats | ❌ Chưa có |
| Payment / Premium flow | ❌ Chưa có |
| Update profile (`PUT /auth/me`) | ❌ Chưa có |
| Admin guard middleware | ❌ Chưa có |
| Role field trên User | ❌ Chưa có |
| premiumUntil field | ❌ Chưa có |
| Seed data mở rộng (HSK2-6) | ❌ Thiếu |
| Progress DELETE | ❌ Chưa có |

---

## 📋 Plan chi tiết (theo phase)

---

### Phase 1: Schema & Seed (nền tảng)

**1.1 — Cập nhật Prisma schema**
- Thêm `role` vào User: `enum Role { USER ADMIN }` — mặc định `USER`
- Thêm `subscriptionUntil` (`DateTime?`) vào User — hạn dùng app, null = chưa từng gia hạn
- Đổi tên `isPremium` → có thể giữ lại và tính virtual, hoặc bỏ đi, hoặc giữ làm cache. Tốt nhất giữ lại và cập nhật khi confirm payment
- Thêm model `Subscription`:

```
model Subscription {
  id              String           @id @default(cuid())
  userId          String
  planId          String           ("2months"|"6months"|"12months")
  amount          Int              (VND)
  status          SubStatus        @default(PENDING)
  transferContent String           (nội dung CK: SUB-{userId}-{planId})
  startedAt       DateTime?
  expiresAt       DateTime?        (ngày hết hạn)
  confirmedAt     DateTime?
  confirmedBy     String?          (adminId)
  createdAt       DateTime         @default(now())
  user            User             @relation(fields: [userId], references: [id])
}
enum SubStatus { PENDING CONFIRMED REJECTED }
```

**Giải thích**: Không có "mở khóa bài học" — user mua gói để **gia hạn thời gian sử dụng app**. `subscriptionUntil` là ngày hết hạn, được extend khi mua thêm.

**1.2 — Migration**: `prisma migrate dev`

**1.3 — Seed**: Admin user + HSK1 bài 4-6 + HSK2 bài 1-3

---

### Phase 2: Admin middleware

- `src/lib/admin-guard.ts` — check JWT → role ADMIN → 403

---

### Phase 3: Auth bổ sung

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| PUT | `/api/auth/me` | Update username, avatar |
| DELETE | `/api/auth/me` | Xoá tài khoản |

---

### Phase 4: Admin API (`/api/admin/*`)

**Dashboard**
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/admin/dashboard/stats` | Tổng user, active, còn hạn, doanh thu tháng, bài học |
| GET | `/api/admin/dashboard/revenue` | Biểu đồ 30 ngày |
| GET | `/api/admin/dashboard/activity` | Activity feed |

**Users**
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/admin/users` | List paginated + search + filter |
| GET | `/api/admin/users/:id` | Chi tiết (kèm subscription history) |
| PUT | `/api/admin/users/:id` | Sửa user |
| DELETE | `/api/admin/users/:id` | Xoá user |
| POST | `/api/admin/users/:id/grant` | Grant subscription → tạo Subscription CONFIRMED + extend hạn |

**Lessons**
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/admin/lessons` | List paginated + filter + search |
| POST | `/api/admin/lessons` | Tạo lesson (kèm vocab + sentences) |
| GET | `/api/admin/lessons/:id` | Chi tiết |
| PUT | `/api/admin/lessons/:id` | Sửa lesson |
| DELETE | `/api/admin/lessons/:id` | Xoá lesson |

**Vocabulary**
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/admin/vocabulary` | Tạo vocab |
| PUT | `/api/admin/vocabulary/:id` | Sửa |
| DELETE | `/api/admin/vocabulary/:id` | Xoá |

**Sentences**
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/admin/sentences` | Tạo sentence |
| PUT | `/api/admin/sentences/:id` | Sửa |
| DELETE | `/api/admin/sentences/:id` | Xoá |

---

### Phase 5: Subscription (`/api/subscriptions`)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/api/subscriptions/plans` | No | Danh sách gói + giá (2mo/6mo/12mo) |
| POST | `/api/subscriptions` | User | User gửi yêu cầu gia hạn (sau khi chuyển khoản) |
| GET | `/api/subscriptions/my` | User | Lịch sử gia hạn của user |

### Phase 6: Admin Subscription (`/api/admin/subscriptions`)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | `/api/admin/subscriptions` | Admin | List tất cả subscription (PENDING trước) |
| PUT | `/api/admin/subscriptions/:id/confirm` | Admin | Xác nhận → extend `subscriptionUntil` (cộng dồn nếu còn hạn) |
| PUT | `/api/admin/subscriptions/:id/reject` | Admin | Từ chối |

---

### Phase 7: Admin Users — Unlock (grant subscription)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/api/admin/users/:id/grant` | Admin | Admin cấp subscription thủ công → tạo Subscription CONFIRMED + extend hạn |

---

### Phase 8: Public API cập nhật

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/auth/me` | Thêm `role`, `subscriptionUntil` |
| DELETE | `/api/progress/:id` | Xoá progress item |

---

## 🔁 Luồng dữ liệu

```
User mua gói → chuyển khoản → POST /api/subscriptions (tạo PENDING)
  → Admin xem ở /api/admin/subscriptions
  → Admin confirm → PUT .../confirm
  → User.subscriptionUntil = max(current, now + planMonths)

Admin grant thủ công → POST /api/admin/users/:id/grant
  → Tạo Subscription CONFIRMED + extend subscriptionUntil

Admin CRUD lessons/vocab/sentences
  → API CRUD đơn giản + admin guard
```

### Logic tính hạn

```
Nếu user chưa có hạn (null):
  subscriptionUntil = now + planMonths

Nếu đã có hạn (còn sống):
  subscriptionUntil = subscriptionUntil + planMonths  (cộng dồn)

Nếu hết hạn:
  subscriptionUntil = now + planMonths  (reset từ hiện tại)
```
