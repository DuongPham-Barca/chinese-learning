import { AdminButton, PageHeader, StatCard } from "@/components/admin/admin-ui"
import styles from "./dashboard.module.css"

function RevenueChart() {
  return <section className={styles.chartCard}><header><h2>Biểu đồ Doanh thu (30 ngày)</h2><span><i />Doanh thu</span></header><div className={styles.lineChart}><svg viewBox="0 0 620 250" preserveAspectRatio="none"><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2563eb" stopOpacity=".28"/><stop offset="1" stopColor="#2563eb" stopOpacity="0"/></linearGradient></defs><path className={styles.gridLine} d="M0 50H620M0 100H620M0 150H620M0 200H620"/><path className={styles.area} d="M0 208 62 184 124 157 186 170 248 91 310 121 372 67 434 96 496 47 558 60 620 25V235H0Z"/><path className={styles.line} d="M0 208 62 184 124 157 186 170 248 91 310 121 372 67 434 96 496 47 558 60 620 25"/><circle cx="372" cy="67" r="5" /></svg><div className={styles.tooltip}><small>24 Oct</small><strong>2.450.000đ</strong></div></div><footer><span>1 OCT</span><span>8 OCT</span><span>15 OCT</span><span>22 OCT</span><span>30 OCT</span></footer></section>
}

function BarChart() {
  const bars = [42,70,94,112,64,48,35]
  return <section className={styles.barCard}><header><h2>Người dùng mới (Tuần)</h2></header><div className={styles.bars}>{bars.map((height,index) => <div key={index}><span className={index === 3 ? styles.activeBar : ""} style={{ height }} />{index === 3 && <b>250</b>}<small>{["T2","T3","T4","T5","T6","T7","CN"][index]}</small></div>)}</div></section>
}

function ActivityCard() {
  const activities = [["User mới đăng ký","Lê Văn Hùng vừa gia nhập cộng đồng.","2 phút trước"],["Thanh toán thành công","Đơn hàng #CD-4920 đã được xác nhận.","15 phút trước"],["Bài học mới được đăng","Admin Minh Anh vừa xuất bản bài học HSK 4.","1 giờ trước"],["Chỉnh sửa hệ thống","Cập nhật quy tắc tính điểm Quiz hàng tuần.","3 giờ trước"]]
  return <section className={styles.activityCard}><header><h2>Hoạt động gần đây</h2><a href="#all">Xem tất cả</a></header><div>{activities.map(([title,text,time],index) => <article key={title}><i>{index === 1 ? "✓" : index === 2 ? "▣" : "●"}</i><span><strong>{title}</strong><small>{text}</small></span><time>{time}</time></article>)}</div></section>
}

function SystemHealthCard() {
  const metrics = [["Tốc độ phản hồi",98],["Tỉ lệ chuyển đổi",42],["Lượng bài tập hoàn thành",76]] as const
  return <section className={styles.healthCard}><h2>Sức khỏe hệ thống</h2><p>Dựa trên dữ liệu 7 ngày qua, hệ thống đang hoạt động ở mức tối ưu.</p><div>{metrics.map(([label,value]) => <article key={label}><header><span>{label}</span><b>{value}%</b></header><i><em style={{ width: `${value}%` }} /></i></article>)}</div></section>
}

export default function AdminDashboardPage() {
  return <><PageHeader title="Tổng quan" subtitle={<>Xin chào Admin 👋. Chào mừng bạn trở lại bảng điều khiển.</>} actions={<><AdminButton icon="calendar" secondary>30 NGÀY QUA</AdminButton><AdminButton icon="download">XUẤT BÁO CÁO</AdminButton></>} /><section className={styles.statsGrid}><StatCard icon="users" label="Người dùng" value="12,540" meta="+8%" /><StatCard icon="book" label="Bài học" value="72" meta="Hiện hành" /><StatCard icon="wallet" label="Doanh thu tháng" value="12.5Md" meta="+12.4%" /><StatCard icon="alert" label="Chờ duyệt" value="18" meta="Cần xử lý" tone="red" /></section><section className={styles.chartsGrid}><RevenueChart /><BarChart /></section><section className={styles.bottomGrid}><ActivityCard /><SystemHealthCard /></section></>
}
