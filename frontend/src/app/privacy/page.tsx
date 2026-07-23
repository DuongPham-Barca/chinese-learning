import type { Metadata } from "next"
import Link from "next/link"
import SiteNavbar from "@/components/site-navbar"
import styles from "../terms/legal.module.css"

export const metadata: Metadata = {
  title: "Chính sách quyền riêng tư | ChineseDict",
  description: "Chính sách thu thập và sử dụng dữ liệu của ChineseDict.",
}

const sections = [
  [
    "Dữ liệu được thu thập",
    "ChineseDict lưu thông tin tài khoản và hồ sơ như tên, email, ảnh đại diện; lịch sử học, tiến độ và điểm kinh nghiệm; trạng thái gói, yêu cầu thanh toán và ngày hết hạn; cùng dữ liệu kỹ thuật cần thiết để đăng nhập, bảo mật và vận hành dịch vụ.",
  ],
  [
    "Mục đích sử dụng",
    "Dữ liệu được dùng để xác thực tài khoản, cung cấp bài học phù hợp với quyền truy cập, đồng bộ tiến độ, vận hành bảng xếp hạng, xử lý yêu cầu nâng cấp, hỗ trợ người dùng và bảo vệ hệ thống khỏi lạm dụng.",
  ],
  [
    "Thanh toán",
    "ChineseDict chỉ lưu thông tin cần thiết để đối chiếu yêu cầu nâng cấp như gói đã chọn, số tiền, nội dung chuyển khoản và trạng thái xác nhận. Hệ thống không yêu cầu hoặc lưu mật khẩu ngân hàng, mã OTP hay thông tin đăng nhập ngân hàng của bạn.",
  ],
  [
    "Dịch vụ hỗ trợ",
    "Dữ liệu có thể được xử lý bởi các nhà cung cấp hạ tầng cần thiết cho hoạt động của ứng dụng, gồm đăng nhập Google, cơ sở dữ liệu Supabase, lưu trữ tệp Cloudflare R2, dịch vụ email và thông báo Telegram cho quản trị viên. Chỉ dữ liệu cần thiết cho từng chức năng được chia sẻ.",
  ],
  [
    "Lưu trữ và bảo mật",
    "Dữ liệu được lưu trong thời gian tài khoản hoạt động hoặc lâu hơn khi cần để giải quyết giao dịch, ngăn gian lận và thực hiện nghĩa vụ hợp pháp. ChineseDict áp dụng kiểm soát truy cập và các biện pháp kỹ thuật hợp lý, nhưng không hệ thống trực tuyến nào có thể bảo đảm an toàn tuyệt đối.",
  ],
  [
    "Quyền của bạn",
    "Bạn có thể xem và cập nhật thông tin hồ sơ, xóa từng tiến độ học hoặc yêu cầu xóa toàn bộ tài khoản trong phần Cài đặt. Việc xóa tài khoản sẽ loại bỏ dữ liệu cá nhân gắn với tài khoản, ngoại trừ dữ liệu phải giữ lại trong phạm vi pháp luật yêu cầu.",
  ],
] as const

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <SiteNavbar />
      <header className={styles.hero} data-motion-page>
        <div className={styles.container}>
          <p className={styles.eyebrow}>Thông tin pháp lý</p>
          <h1>Chính sách quyền riêng tư</h1>
          <p>Cách ChineseDict thu thập, sử dụng và bảo vệ dữ liệu của người học.</p>
          <time dateTime="2026-07-16">Cập nhật ngày 16/07/2026</time>
        </div>
      </header>

      <main className={`${styles.container} ${styles.layout}`} data-motion-page>
        <nav className={styles.index} aria-label="Mục lục chính sách quyền riêng tư">
          <strong>Nội dung</strong>
          {sections.map(([title], index) => (
            <a key={title} href={`#privacy-${index + 1}`}>{title}</a>
          ))}
        </nav>

        <article className={styles.content}>
          <p className={styles.intro}>
            Chính sách này áp dụng cho dữ liệu được xử lý khi bạn truy cập và sử dụng ChineseDict.
          </p>
          {sections.map(([title, body], index) => (
            <section id={`privacy-${index + 1}`} key={title}>
              <h2>{index + 1}. {title}</h2>
              <p>{body}</p>
            </section>
          ))}
          <section>
            <h2>7. Thay đổi chính sách</h2>
            <p>
              Khi chính sách thay đổi, phiên bản mới và ngày cập nhật sẽ được công bố tại trang này. Việc sử dụng dịch vụ cũng chịu sự điều chỉnh của <Link href="/terms">Điều khoản sử dụng</Link>.
            </p>
          </section>
        </article>
      </main>
    </div>
  )
}
