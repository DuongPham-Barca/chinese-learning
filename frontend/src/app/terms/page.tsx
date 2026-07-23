import type { Metadata } from "next"
import Link from "next/link"
import SiteNavbar from "@/components/site-navbar"
import styles from "./legal.module.css"

export const metadata: Metadata = {
  title: "Điều khoản sử dụng | ChineseDict",
  description: "Điều khoản sử dụng nền tảng học tiếng Trung ChineseDict.",
}

const sections = [
  [
    "Phạm vi dịch vụ",
    "ChineseDict cung cấp bài học, từ vựng, câu mẫu và các bài luyện tập tiếng Trung. Người chưa có gói Pro còn hiệu lực được học miễn phí 3 bài đầu của từng cấp HSK. Khi gói Pro được kích hoạt, toàn bộ bài học đang xuất bản được mở đến ngày hết hạn; sau thời điểm đó, các bài ngoài phạm vi miễn phí sẽ tự động khóa lại.",
  ],
  [
    "Tài khoản",
    "Bạn chịu trách nhiệm bảo vệ quyền truy cập tài khoản và cung cấp thông tin hồ sơ chính xác. Không được chia sẻ, bán lại hoặc dùng tài khoản để cho người khác truy cập trái phép vào nội dung có giới hạn.",
  ],
  [
    "Thanh toán và kích hoạt",
    "Yêu cầu nâng cấp được ghi nhận sau khi bạn gửi thông tin chuyển khoản. Gói Pro chỉ có hiệu lực khi giao dịch được quản trị viên xác nhận. Nếu gia hạn khi gói hiện tại còn hạn, thời gian mới được cộng tiếp từ ngày hết hạn hiện tại; nếu gói đã hết hạn, thời gian được tính từ lúc xác nhận.",
  ],
  [
    "Sử dụng hợp lệ",
    "Bạn không được can thiệp vào hệ thống, vượt cơ chế phân quyền, tự động thu thập nội dung, phát tán mã độc hoặc sử dụng dịch vụ theo cách gây ảnh hưởng đến người dùng khác. ChineseDict có thể giới hạn hoặc chấm dứt quyền truy cập khi phát hiện hành vi lạm dụng.",
  ],
  [
    "Nội dung và quyền sở hữu",
    "Nội dung học tập, giao diện và tài nguyên do ChineseDict cung cấp chỉ dành cho mục đích học tập cá nhân, trừ khi có thỏa thuận khác. Việc mua gói không chuyển giao quyền sở hữu hoặc quyền phân phối lại nội dung.",
  ],
  [
    "Tính sẵn sàng và thay đổi",
    "Dịch vụ có thể tạm gián đoạn để bảo trì, xử lý sự cố hoặc cập nhật nội dung. ChineseDict có thể điều chỉnh tính năng và điều khoản khi cần; phiên bản mới sẽ được công bố tại trang này cùng ngày cập nhật.",
  ],
] as const

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <SiteNavbar />
      <header className={styles.hero} data-motion-page>
        <div className={styles.container}>
          <p className={styles.eyebrow}>Thông tin pháp lý</p>
          <h1>Điều khoản sử dụng</h1>
          <p>Quy định về tài khoản, quyền truy cập bài học và gói ChineseDict Pro.</p>
          <time dateTime="2026-07-16">Cập nhật ngày 16/07/2026</time>
        </div>
      </header>

      <main className={`${styles.container} ${styles.layout}`} data-motion-page>
        <nav className={styles.index} aria-label="Mục lục điều khoản">
          <strong>Nội dung</strong>
          {sections.map(([title], index) => (
            <a key={title} href={`#term-${index + 1}`}>{title}</a>
          ))}
        </nav>

        <article className={styles.content}>
          <p className={styles.intro}>
            Bằng việc đăng nhập hoặc sử dụng ChineseDict, bạn đồng ý tuân thủ các điều khoản dưới đây.
          </p>
          {sections.map(([title, body], index) => (
            <section id={`term-${index + 1}`} key={title}>
              <h2>{index + 1}. {title}</h2>
              <p>{body}</p>
            </section>
          ))}
          <section>
            <h2>7. Quyền riêng tư và xóa tài khoản</h2>
            <p>
              Cách ChineseDict thu thập và sử dụng dữ liệu được mô tả trong <Link href="/privacy">Chính sách quyền riêng tư</Link>. Bạn có thể yêu cầu xóa tài khoản và dữ liệu liên quan từ phần Cài đặt tài khoản.
            </p>
          </section>
        </article>
      </main>
    </div>
  )
}
