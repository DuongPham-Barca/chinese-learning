# Kế Hoạch Chi Tiết A-Z — Chinese Learning App

## Thứ tự làm từng file — KHÔNG conflict

---

## Phase 1: Backend trước (xây xong hết API mới đụng Frontend)

### Bước 1 — Docker + Config

```
① docker-compose.yml
② backend/package.json
③ backend/tsconfig.json
④ backend/.env
```

Chạy: `docker compose up -d`

### Bước 2 — Schema + Migration

```
⑤ backend/prisma/schema.prisma
```

Chạy: `npx prisma migrate dev --name init`

### Bước 3 — Seed data

```
⑥ backend/prisma/seed.ts
```

Chạy: `npx prisma db seed`

### Bước 4 — Server + Middleware

```
⑦ backend/src/server.ts                   (entry point, express app)
⑧ backend/src/middleware/authMiddleware.ts (JWT verify)
```

### Bước 5 — API routes (từng module độc lập)

```
⑨  backend/src/modules/auth/auth.routes.ts
⑩  backend/src/modules/lessons/lessons.routes.ts
⑪  backend/src/modules/vocabulary/vocabulary.routes.ts
⑫  backend/src/modules/sentences/sentences.routes.ts
⑬  backend/src/modules/progress/progress.routes.ts
⑭  backend/src/modules/leaderboard/leaderboard.routes.ts
```

Test từng cái bằng Postman/Curl xong hẵng qua FE.

---

## Phase 2: Frontend (sau khi API chạy ngon)

### Bước 6 — Setup FE

```
⑮ frontend/package.json      (create-next-app)
⑯ frontend/src/lib/api.ts    (axios instance)
⑰ frontend/src/store/userStore.ts (Zustand store)
```

### Bước 7 — Auth FE

```
⑱ frontend/src/app/login/page.tsx
⑲ frontend/src/app/register/page.tsx
⑳ frontend/src/hooks/useAuth.ts
```

### Bước 8 — Layout + Dashboard

```
㉑ frontend/src/components/Navbar.tsx
㉒ frontend/src/app/page.tsx              (Home)
㉓ frontend/src/app/dashboard/page.tsx
```

### Bước 9 — Lesson list + detail

```
㉔ frontend/src/app/lessons/[level]/page.tsx
㉕ frontend/src/app/lessons/[level]/[id]/page.tsx
```

### Bước 10 — Flashcard

```
㉖ frontend/src/components/FlashCard.tsx
㉗ frontend/src/app/lessons/[level]/[id]/flashcard/page.tsx
```

### Bước 11 — Dictation + Sorting

```
㉘ frontend/src/components/DictationBox.tsx
㉙ frontend/src/app/lessons/[level]/[id]/dictation/page.tsx
㉚ frontend/src/components/WordSorting.tsx
```

> **Lưu ý:** Dictation và Sorting không conflict, có thể code song song.

### Bước 12 — Gamification

```
㉛ frontend/src/components/ExpBar.tsx
㉜ frontend/src/components/LeaderboardTable.tsx
㉝ frontend/src/app/leaderboard/page.tsx
```

---

## Nguyên tắc vàng

> **Không chạm FE trước khi API của module đó chạy được.**
> Xây từ dưới lên: **DB → API → Component → Page**

## Scope v1

- [x] 2 folder riêng: `backend/` + `frontend/`
- [x] PostgreSQL qua Docker
- [x] Flashcard (lật thẻ, đã thuộc/cần ôn)
- [x] Dictation (gõ chữ Hán, check xanh/đỏ)
- [x] Word Sorting (chip sắp xếp)
- [x] Auth (register/login JWT)
- [x] EXP system (cộng điểm, thanh progress)
- [x] Leaderboard all-time (Top)
- [ ] ❌ Audio (dùng Web Speech API tạm)
- [ ] ❌ Thanh toán (bỏ qua)
- [ ] ❌ Admin CRUD (bỏ qua)
