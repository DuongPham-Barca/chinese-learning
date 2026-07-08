# Chinese Learning & Dictation Application

## Kiến trúc

- `frontend/`: Next.js chỉ phụ trách giao diện và gọi HTTP API. Không chứa Prisma, schema database, OAuth secret hoặc server auth route.
- `backend/`: Express sở hữu Google OAuth, JWT cookie, business logic, Prisma migrations và kết nối Supabase PostgreSQL.
- Google OAuth callback: `http://localhost:4000/api/auth/google/callback`.
- Frontend API URL: `NEXT_PUBLIC_API_URL=http://localhost:4000/api`.

## Database migration

Sau khi pull code có migration mới, chạy lệnh sau từ thư mục gốc của project:

```powershell
cd backend
npm.cmd run db:migrate
```

Script trên sẽ chạy `prisma migrate deploy` và áp dụng các migration chưa có lên Supabase PostgreSQL.

> Trên PowerShell Windows, dùng `npm.cmd` nếu `npm` bị chặn bởi Execution Policy. Trên macOS/Linux có thể chạy `npm run db:migrate`.

Ứng dụng học tiếng Trung (Phân cấp HSK 1 - HSK 6 & Tiếng Trung Giao Tiếp) kết hợp phương pháp học từ vựng qua Flashcard và luyện phản xạ/nghe chép chính tả (Dictation) tương tác cao. Hệ thống tích hợp Gamification (Tính điểm EXP, Bảng xếp hạng) và mô hình Freemium (Thanh toán qua QR Code để mở khóa bài học).

---

## 🚀 Tính năng cốt lõi (Core Features)

### 1. Cấu trúc bài học (Content Hierarchy)

- **Phân cấp:** HSK 1, HSK 2, HSK 3, HSK 4, HSK 5, HSK 6 và Tiếng Trung Giao Tiếp.
- **Số lượng:** Mỗi cấp độ chứa ~10 bài học nhỏ (Lessons).
- **Cấu trúc mỗi bài:** Gồm 2 phần chính: **Học từ vựng (Flashcard)** ➡️ **Luyện câu (Dictation & Sorting)**.

### 2. Học từ vựng bằng Flashcard

- **Mặt trước:** Chữ Hán, Phiên âm (Pinyin), nút Phát âm Audio.
- **Mặt sau:** Nghĩa tiếng Việt, ví dụ minh họa.
- **Tương tác:** Vuốt/Đánh dấu từ đã thuộc hoặc cần ôn lại.

### 3. Luyện câu tương tác (Dictation & Sorting)

Hệ thống cung cấp câu tiếng Việt làm ngữ cảnh (Hint) và triển khai 2 chế độ luyện tập:

- **Chế độ Nghe chép chính tả (Dictation Mode):** Máy phát audio tiếng Trung ➡️ Học viên nghe và gõ lại đúng chữ Hán vào ô trống. Có nút tua chậm (icon Rùa) để nghe kỹ.
- **Chế độ Sắp xếp từ (Word Sorting Mode):** Các block chữ Hán bị xáo trộn ➡️ Học viên click chọn theo đúng thứ tự câu.
- **Logic kiểm tra:**
  - 🟢 **Đúng:** Khung đổi sang màu **Xanh**, phát âm thanh chúc mừng, cộng EXP, mở nút "Tiếp tục".
  - 🔴 **Sai:** Khung đổi sang màu **Đỏ**, báo lỗi và **khóa nút tiếp tục** cho đến khi học viên sửa đúng hoàn toàn.

### 4. Hệ thống Game hóa (Gamification)

- **EXP System:** Cộng điểm khi hoàn thành Flashcard hoặc trả lời đúng câu hỏi (Đúng lần đầu nhận nhiều EXP hơn câu phải sửa sai).
- **Leaderboard (Bảng xếp hạng):** Hiển thị Top thành viên có EXP cao nhất theo Tuần/Tháng/Toàn thời gian.

### 5. Cơ chế khóa bài & Thanh toán (Freemium & Paywall)

- **Chính sách:** Miễn phí 3 bài đầu tiên của cấp độ đầu tiên để trải nghiệm. Từ bài thứ 4 trở đi tự động khóa.
- **Paywall UI:** Khi click vào bài bị khóa, hệ thống hiển thị thông báo yêu cầu nâng cấp và hiện **mã VietQR động**.
- **Nội dung CK fixed:** `NAP TIEN APPCHINESE [USER_ID]` để hỗ trợ đối soát tự động (Webhook) hoặc duyệt tay qua Admin Dashboard.

---

<!--
## 📊 Kiến trúc Cơ sở Dữ liệu (Database Schema)

Dưới đây là các bảng (Tables) cốt lõi thiết kế cho dự án:

```sql
-- Bảng người dùng
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    exp_points INT DEFAULT 0,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng danh mục bài học
CREATE TABLE Lessons (
    lesson_id INT PRIMARY KEY AUTO_INCREMENT,
    level_type ENUM('HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'COMMUNICATION') NOT NULL,
    lesson_order INT NOT NULL, -- Ví dụ: Bài 1, Bài 2...
    title VARCHAR(100) NOT NULL
);

-- Bảng từ vựng (Dùng cho Flashcard)
CREATE TABLE Vocabulary (
    vocab_id INT PRIMARY KEY AUTO_INCREMENT,
    lesson_id INT,
    hanzi VARCHAR(50) NOT NULL,
    pinyin VARCHAR(100) NOT NULL,
    meaning_vi TEXT NOT NULL,
    audio_url VARCHAR(255),
    FOREIGN KEY (lesson_id) REFERENCES Lessons(lesson_id)
);

-- Bảng câu luyện tập (Dùng cho Dictation/Sorting)
CREATE TABLE Sentences (
    sentence_id INT PRIMARY KEY AUTO_INCREMENT,
    lesson_id INT,
    sentence_vi TEXT NOT NULL, -- Câu tiếng Việt làm hint
    sentence_zh TEXT NOT NULL, -- Câu chữ Hán đáp án đúng
    audio_url VARCHAR(255),    -- File phát âm tiếng Trung
    FOREIGN KEY (lesson_id) REFERENCES Lessons(lesson_id)
);
``` -->
