import { AdminButton, AdminTable, PageHeader, Pagination, PaymentStatusBadge, StatCard } from "@/components/admin/admin-ui"
import styles from "./payments.module.css"

const transactions = [
  { id:"#PAY-99281",name:"Nguyễn Văn An",email:"an.nguyen@email.com",initials:"NA",amount:"500.000đ",content:"AN Nguyen CD-PREMIUM-1Y",date:"12/10/2023 14:32",status:"Pending" as const },
  { id:"#PAY-99280",name:"Trần Thị Bình",email:"binh.ng@gmail.com",initials:"TB",amount:"1.200.000đ",content:"CD-BINH-PREMIUM-LIFETIME",date:"12/10/2023 10:15",status:"Approved" as const },
  { id:"#PAY-99279",name:"Lê Quang Cường",email:"cuong.lq@edu.vn",initials:"LC",amount:"500.000đ",content:"Thanh toán khóa học",date:"11/10/2023 21:05",status:"Rejected" as const },
  { id:"#PAY-99278",name:"Phạm Mỹ Dung",email:"dung.pham@design.co",initials:"PD",amount:"300.000đ",content:"Premium 3 months",date:"11/10/2023 16:40",status:"Approved" as const },
]

function TransactionTable() {
  return <section className={styles.transactionCard}><header><h2>Danh sách giao dịch</h2><div><button className={styles.activeTab} type="button">Tất cả</button><button type="button">Hôm nay</button><button type="button">Tháng này</button></div></header><AdminTable><thead><tr><th>Payment ID</th><th>Người dùng</th><th>Số tiền</th><th>Nội dung chuyển khoản</th><th>Ngày tạo</th><th>Trạng thái</th></tr></thead><tbody>{transactions.map((item) => <tr key={item.id}><td><b className={styles.paymentId}>{item.id}</b></td><td><div className={styles.person}><i>{item.initials}</i><span><strong>{item.name}</strong><small>{item.email}</small></span></div></td><td><b className={styles.amount}>{item.amount}</b></td><td><em className={styles.transferContent}>“{item.content}”</em></td><td><span className={styles.date}>{item.date}</span></td><td><PaymentStatusBadge status={item.status} /></td></tr>)}</tbody></AdminTable><footer><span>Hiển thị 1 - 4 trong 425 giao dịch</span><Pagination /></footer></section>
}

function PaymentInfoCards() {
  return <section className={styles.infoGrid}><article><i>✦</i><div><h3>Đối soát tự động</h3><p>Hệ thống đang hoạt động và tự động nhận diện nội dung chuyển khoản từ các ngân hàng đối tác.</p></div></article><article><i>◉</i><div><h3>Cần hỗ trợ thanh toán?</h3><p>Nếu có khiếu nại về giao dịch hoặc trạng thái, hãy xem chi tiết và liên hệ bộ phận kỹ thuật.</p></div></article></section>
}

export default function AdminPaymentsPage() {
  return <><PageHeader title="Thanh toán" subtitle="Quản lý các giao dịch đăng ký gói học viên Premium" actions={<><AdminButton icon="filter" secondary>Lọc dữ liệu</AdminButton><AdminButton icon="download">Xuất báo cáo</AdminButton></>} /><section className={styles.statsGrid}><StatCard icon="wallet" label="TỔNG DOANH THU" value="428.500k" meta="+12%" /><StatCard icon="clock" label="ĐANG CHỜ XỬ LÝ" value="12.400k" meta="24 chờ duyệt" tone="orange" /><StatCard icon="check" label="ĐÃ PHÊ DUYỆT" value="395.200k" meta="382 thành công" tone="green" /><StatCard icon="alert" label="ĐÃ TỪ CHỐI" value="20.900k" meta="15 từ chối" tone="red" /></section><TransactionTable /><PaymentInfoCards /></>
}
