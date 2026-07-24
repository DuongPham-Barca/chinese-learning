# Design Prompts for Chinese Learning App

## Style Guide Chung (dùng cho tất cả screens)

```
Color Palette:
- Primary: #3B82F6 (Blue) — buttons, headers, active states
- Secondary: #F6AD55 (Warm Orange) — accents, EXP, badges
- Background: #F8FAFC (Light Grayish White) — nền chính
- Surface: #FFFFFF — card, modal
- Text: #1A202C (Dark) — primary text
- Text Muted: #718096 (Gray) — secondary text
- Success: #48BB78 (Green) — correct answer
- Error: #F56565 (Red) — wrong answer
- Border: #E2E8F0

Typography:
- Font: Inter (sans-serif)
- Headings: Bold, letter-spacing -0.02em
- Body: Regular, 16px base
- Chinese characters: Noto Sans SC

Shadows:
- Card shadow: 0 2px 8px rgba(0,0,0,0.08)
- Modal shadow: 0 10px 40px rgba(0,0,0,0.15)

Border Radius:
- Cards: 12px
- Buttons: 8px
- Inputs: 8px
- Badges: 999px (pill)
```

---

## 1. Landing Page (Trang chủ)

**Tool:** Galileo AI hoặc v0.dev
**Prompt:**

```
Design a modern landing page for "Hana" — a Chinese language learning app with dictation and flashcard features.

Layout:
- Hero section: A clean hero with a warm illustration of Chinese language elements (lanterns, calligraphy, or a person studying). Headline: "Học tiếng Trung chủ động — Flashcard & Dictation trong tay bạn". Subheadline explaining the app. Two CTA buttons: "Bắt đầu học miễn phí" (primary red) and "Xem giáo trình" (outline).
- Features section: 3 feature cards in a row — "Flashcard thông minh" (with card flip icon), "Luyện nghe chép chính tả" (with ear/headphone icon), "Game hóa & Bảng xếp hạng" (with trophy icon). Each card has a small illustration, title, and short description.
- Levels section: 7 level badges/cards showing HSK1 through HSK6 and Giao Tiếp (Communication), with hover effect. Each shows level name and number of lessons.
- Footer: Minimal with app name, social links, copyright.

Color scheme: Warm white background (#FFFBF0), Chinese red (#E53E3E) as primary, warm orange (#F6AD55) as accent. Modern, clean, slightly playful but professional.

Make it responsive — desktop grid layout, mobile stacks vertically.
```

---

## 2. Login / Register

**Prompt:**

```
Design a login and registration page for a Chinese learning app called "Hana".

Layout:
- Split screen: Left side has a decorative Chinese-themed illustration (minimal bamboo or ink wash painting style) with the app logo and tagline.
- Right side: A centered card with tabs switching between "Đăng nhập" (Login) and "Đăng ký" (Register).
- Login form: Email input, password input with show/hide toggle, "Remember me" checkbox, "Đăng nhập" button (red), and a "Quên mật khẩu?" link.
- Register form: Username, email, password, confirm password inputs, a terms checkbox, "Đăng ký" button.
- Social login buttons (optional): Google, Facebook — but make them secondary.

Style: Clean, minimal. Card with white background, subtle shadow, rounded corners (12px). Background is warm off-white. Chinese red primary button.
```

---

## 3. Dashboard (Sau khi đăng nhập)

**Prompt:**

```
Design a dashboard for a Chinese learning app for logged-in users.

Layout:
- Top navigation bar: App logo left, search bar middle (for searching lessons/vocabulary), user avatar with EXP points badge and level indicator right.
- Main content area:
  - Greeting section: "Chào bạn, [username] 👋" with a daily streak counter (e.g., "3 ngày liên tiếp").
  - Quick stats row: 4 stat cards — "Bài đã học" (lessons completed), "Từ vựng đã thuộc" (words mastered), "EXP hôm nay" (today's EXP), "Xếp hạng" (rank #). Each with icon and number.
  - "Tiếp tục học" (Continue Learning) section: A horizontal scrollable card showing the last lesson user was studying, with a progress bar and "Học tiếp" button.
  - "Chọn cấp độ" (Choose Level) grid: 7 level cards in a 2-row grid (4 + 3). Each card shows level name (HSK1-6, Giao Tiếp), a small progress ring showing completion percentage, and number of lessons.

Style: Warm white background, red accents. Cards have subtle shadows. Progress ring uses red-to-orange gradient.
```

---

## 4. Level → Lesson List

**Prompt:**

```
Design the lesson list page for a specific HSK level in a Chinese learning app. Example: HSK1.

Layout:
- Back button + Level title at top: "HSK 1 — Cơ bản" with a subtitle "10 bài học".
- Progress overview bar: "Tiến độ: 3/10 bài đã hoàn thành" with a gradient progress bar.
- Lesson list: Vertical list of lesson cards (10 items). Each card shows:
  - Lesson number (e.g., "Bài 1")
  - Lesson title (e.g., "Chào hỏi cơ bản")
  - Tỉ lệ hoàn thành: small progress bar + percentage
  - Status badge: "Đã hoàn thành" (green pill), "Đang học" (orange pill), "Miễn phí" (gray pill), or "Có phí" (lock icon + "Pro" label)
  - Clickable → navigates to lesson detail.
- The first 3 lessons have a "Miễn phí" badge; from lesson 4 onward show a lock icon and "Pro" label (except if user is premium).
- Pull-to-refresh or subtle loading skeleton.

Style: Clean cards with divider lines. Locked lessons slightly more transparent. Scrollable.
```

---

## 5. Lesson Detail (Inside a Lesson)

**Prompt:**

```
Design the lesson overview page inside a Chinese learning lesson.

Layout:
- Top bar: Back arrow, lesson title "Bài 1: Chào hỏi cơ bản".
- Two large mode cards stacked vertically:

  Card 1: "Học từ vựng — Flashcard"
    - Illustration of a card flip
    - Description: "10 từ vựng trong bài"
    - Button: "Bắt đầu" (Start) — red primary

  Card 2: "Luyện câu — Dictation & Sắp xếp từ"
    - Illustration of a keyboard and puzzle pieces
    - Description: "5 câu luyện tập"
    - Badge showing "Nên học flashcard trước" (recommended to do flashcards first) — but button is still active.
    - Button: "Bắt đầu" — red outline

- If user already completed some parts, show checkmarks and "Đã hoàn thành" on the card.

Style: Large cards, generous spacing, easy to tap on mobile.
```

---

## 6. Flashcard Mode

**Prompt:**

```
Design a flashcard learning screen for Chinese vocabulary.

Layout:
- Top bar: Exit (X) button left, "Từ vựng 3/10" counter in center, progress bar below.
- Main card area: Large card centered on screen, slightly elevated with shadow.
  - Front face: Chinese character (hanzi) in large bold font, pinyin below in smaller text, and a speaker icon button for audio pronunciation.
  - Back face (after tap/flip): Vietnamese meaning in large text, example sentence in smaller text below.
- Interaction: Swipe right = "Đã thuộc" (Know), Swipe left = "Cần ôn" (Need to review). Or use two buttons at the bottom.
- Bottom buttons: "Cần ôn lại" (red) and "Đã thuộc" (green). Stats: "Đã thuộc: 2 | Cần ôn: 0 | Còn lại: 8".
- Optional: small card stack visualization at the back showing remaining cards.

Style: Clean, focus on the card. Background is subtle warm pattern or solid warm white. Card flip animation should be smooth. The Chinese character should be the star of the card — large, centered, elegant.
```

---

## 7. Dictation Mode (Nghe chép chính tả)

**Prompt:**

```
Design the dictation exercise screen for a Chinese learning app.

Layout:
- Top bar: Exit (X) left, "Dictation 1/5" counter center, score display right (⭐).
- Hint section: Vietnamese sentence as context hint — "Tôi là sinh viên" displayed in a subtle box.
- Audio player bar: Play button, progress bar (0:00 / 0:03), speed control button (icon turtle = 0.75x, default = 1x), repeat button. Styled like a podcast player.
- Input area: A text input box styled for Chinese characters. Placeholder text: "Gõ chữ Hán tại đây...". Below the input, show the pinyin of what user typed (optional real-time conversion hint).
- Check button: "Kiểm tra" (Check) — red primary button.
- Feedback area (after checking):
  - Correct: Box turns green, confetti or sparkle animation, "+10 EXP" toast notification, "Tiếp tục" (Continue) button appears.
  - Wrong: Box turns red, "Sai rồi! Hãy thử lại" message, keyboard stays open. No continue button until correct.
- Progress dots at bottom showing which sentences are completed/correct.

Style: Warm background, clean input area. Sound wave animation when audio is playing. The focus is on the input field.
```

---

## 8. Word Sorting Mode (Sắp xếp từ)

**Prompt:**

```
Design a word sorting exercise screen for a Chinese learning app.

Layout:
- Top bar: Exit (X) left, "Sắp xếp từ 1/5" counter center.
- Hint section: Vietnamese sentence hint — "Tôi là sinh viên" in a subtle box.
- Answer area: A horizontal dashed-line box showing placed words in order. Initially empty with a subtle "?" placeholder text.
- Word bank: A randomized set of Chinese word chips/chips below the answer area. Each chip is a rounded pill with a Chinese word. Example chips: "我", "是", "学生".
  - Tap a chip → it moves up to the answer area in the correct position.
  - Tap a chip in answer area → it goes back to the word bank.
- Check button: "Kiểm tra" — red, disabled until all words placed.
- Feedback:
  - Correct: Answer area turns green, "+EXP" toast, "Tiếp tục" button.
  - Wrong: Wrongly placed chips shake animation and turn red briefly, then reset for retry.
- Animation: Chips have a smooth spring animation when moving between bank and answer area.

Style: Playful but clean. Colorful chips (each chip could have a subtle background tint). Drag/drop or tap-to-move interaction.
```

---

## 9. Leaderboard (Bảng xếp hạng)

**Prompt:**

```
Design a leaderboard page for a Chinese learning app gamification.

Layout:
- Top bar: Title "Bảng xếp hạng", filter tabs: "Tuần này" | "Tháng này" | "Toàn thời gian" as segmented control.
- Podium section (Top 3): 3 cards arranged in 2-3-1 layout (1st center, 2nd left, 3rd right).
  - 1st place: Gold crown icon, large avatar, username, EXP number, special highlight card.
  - 2nd place: Silver style, medium size.
  - 3rd place: Bronze style, smaller.
- List section (4th-50th): Scrollable list of ranked users. Each row: rank number, user avatar, username, EXP points with small progress bar, level badge. Alternating row backgrounds.
- Current user highlight: The user's own row is highlighted with a subtle red-tinted background and "Bạn" (You) badge if within top 50. If not, show "—" divider and user's rank at bottom.
- Pull-to-refresh.

Style: Gamified feel — subtle confetti or sparkle on podium. Gold/silver/bronze colors for top 3. Modern and sporty but still matching the warm Chinese theme.
```

---

## 10. Paywall / Premium Modal

**Prompt:**

```
Design a payment/paywall modal for a Chinese learning app (VietQR payment).

Layout:
- Modal overlay with dark backdrop. Centered card.
- Card content:
  - Top: Decorative icon (locked lesson illustration or premium badge).
  - Title: "Bài học này yêu cầu nâng cấp" or "Mở khóa toàn bộ khóa học"
  - Subtitle: "Học không giới hạn tất cả HSK1-6 & Giao tiếp chỉ với 99.000đ"
  - Price highlight: Large price display "99.000đ" with "một lần duy nhất" (one-time payment) label.
  - Benefits list (3 items with checkmarks): "Tất cả 70+ bài học", "Toàn bộ từ vựng & câu luyện tập", "Không quảng cáo".
  - QR Code section: A placeholder QR code box with instruction "Quét mã QR bên dưới để thanh toán"
  - Bank info: "Ngân hàng: Vietcombank — STK: 123456789 — Nội dung: NAP TIEN APPCHINESE {userId}"
  - Status: "Đang chờ thanh toán..." with a subtle loading animation, or "Đã xác nhận!" with green checkmark.
  - "Tôi đã chuyển khoản" button (secondary), and "Đóng" link at bottom.
- Close button (X) top right.

Style: Premium feel, elegant. Red accents. The QR code is the focal point of the payment section.
```

---

## 11. Admin Dashboard

**Prompt:**

```
Design an admin dashboard page for managing a Chinese learning app.

Layout:
- Left sidebar: Narrow dark sidebar with admin logo, menu items — "Tổng quan" (Overview), "Bài học" (Lessons), "Từ vựng" (Vocabulary), "Câu luyện tập" (Sentences), "Người dùng" (Users), "Thanh toán" (Payments), "Cài đặt" (Settings). Active item highlighted with red accent.
- Top bar: Search bar, notification bell, admin avatar dropdown.
- Main content (depends on menu):
  - Overview: Stat cards — total users, total lessons, revenue this month, pending payments count. Small graph/chart area.
  - Lessons: Table with columns — ID, Level, Title, Order, Free Trial?, Word count, Actions (Edit/Delete). Plus "Thêm bài học" (Add Lesson) button top right.
  - Payments: Table — ID, User, Amount, QR Content, Status (PENDING/APPROVED/REJECTED with colored pills), Created At, Approve/Reject action buttons.
- Modal when clicking "Add Lesson" or "Edit": Form with fields — Level dropdown, Lesson Order number, Title input, Free Trial toggle.

Style: Clean, professional, admin-like. Dark sidebar, white main area. Red accent for active states and primary buttons.
```

---

## 12. EXP & Gamification Feedback (Micro-interactions)

Not a full screen, but describe for the AI:

**Prompt:**

```
Design a toast notification and animation system for EXP point gain in a Chinese learning app.

When user answers correctly:
- A floating "+10 EXP" text bubble appears near the top, with a star icon. It floats upward and fades out over 1.5 seconds. Color: orange-to-yellow gradient.
- If level up happens: A centered modal briefly shows "Lên cấp!" with a trophy, new level number, and a sparkle burst animation. Auto-dismiss after 2 seconds.
- The EXP bar in the header animates filling up with a smooth progress animation, red-to-orange gradient.

Show these as separate frame illustrations or animation descriptions.
```

---

## Cách sử dụng

1. Copy từng prompt vào **Galileo AI** → ra Figma design
2. Hoặc paste vào **v0.dev** → ra React code luôn
3. Hoặc **Visily AI** → prompt → wireframe/UI

Nên bắt đầu từ màn hình **Flashcard (#6)** và **Dictation (#7)** vì đây là core feature, khách dễ duyệt nhất.
