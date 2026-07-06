import AdminIcon from "@/components/admin/admin-icons"
import { AdminButton, AdminTable, PageHeader, Pagination } from "@/components/admin/admin-ui"
import styles from "./lessons.module.css"

const lessons = [
  { id:"#L101",level:"HSK1",order:"01",title:"Chào hỏi cơ bản",subtitle:"Basic Greetings & Introductions",vocab:12,sentences:8,free:true,date:"24/05/2024" },
  { id:"#L102",level:"HSK1",order:"02",title:"Bạn tên là gì?",subtitle:"Asking for names and nationality",vocab:15,sentences:10,free:true,date:"22/05/2024" },
  { id:"#L305",level:"HSK3",order:"14",title:"Kế hoạch cuối tuần",subtitle:"Weekend plans & leisure activities",vocab:28,sentences:15,free:false,date:"18/05/2024",featured:true },
  { id:"#L210",level:"HSK2",order:"05",title:"Ăn tối ở đâu?",subtitle:"Ordering food at a restaurant",vocab:20,sentences:12,free:true,date:"15/05/2024" },
  { id:"#L402",level:"HSK4",order:"--",title:"Thị trường lao động",subtitle:"Discussing job markets & economy",vocab:42,sentences:0,free:false,date:"10/05/2024",draft:true },
]

function FiltersCard() {
  return <section className={styles.filters}><label><AdminIcon name="search" /><input placeholder="Tìm kiếm theo tiêu đề bài học hoặc nội dung..." /></label><div><select defaultValue=""><option value="">Cấp độ (Level)</option><option>HSK1</option><option>HSK2</option><option>HSK3</option></select><select defaultValue=""><option value="">Trạng thái</option><option>Published</option><option>Draft</option></select><select defaultValue=""><option value="">Free/Pro</option><option>Free</option><option>Pro</option></select><select defaultValue="new"><option value="new">Sắp xếp: Mới nhất</option><option>Cũ nhất</option></select></div></section>
}

export default function AdminLessonsPage() {
  return <><PageHeader eyebrow={<span>Dashboard › <b>Bài học</b></span>} title="Bài học" actions={<AdminButton icon="plus">Thêm bài học</AdminButton>} /><FiltersCard /><section className={styles.tableCard}><AdminTable><thead><tr><th>ID</th><th>Cấp độ</th><th>Thứ tự</th><th>Tiêu đề bài học</th><th>Nội dung</th><th>Free</th><th>Cập nhật</th><th>Actions</th></tr></thead><tbody>{lessons.map((lesson) => <tr key={lesson.id}><td><b>{lesson.id}</b></td><td><span className={styles.levelBadge}>{lesson.level}</span></td><td>{lesson.order}</td><td><div className={styles.lessonTitle}><strong>{lesson.title}</strong>{lesson.featured && <i>★</i>}{lesson.draft && <em>DRAFT</em>}<small>{lesson.subtitle}</small></div></td><td><span className={styles.contentCounts}>☆ {lesson.vocab}　☵ {lesson.sentences}</span></td><td>{lesson.free ? <span className={styles.freeYes}>✓ Yes</span> : <span className={styles.freeNo}>⊗ No</span>}</td><td>{lesson.date}</td><td><div className={styles.actions}><button type="button" aria-label="Xem"><AdminIcon name="eye" /></button><button type="button" aria-label="Sửa"><AdminIcon name="edit" /></button></div></td></tr>)}</tbody></AdminTable><footer><span>Đang xem 1 đến 10 trong số 48 bài học</span><Pagination /></footer></section></>
}
