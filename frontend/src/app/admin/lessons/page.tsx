"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import AdminIcon from "@/components/admin/admin-icons"
import { AdminButton, AdminTable, PageHeader, Pagination } from "@/components/admin/admin-ui"
import styles from "./lessons.module.css"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const } },
}

type Lesson = typeof lessons[number]
type LevelTab = "all" | "HSK1" | "HSK2" | "HSK3" | "HSK4" | "HSK5" | "HSK6"

const levelTabs: LevelTab[] = ["all", "HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6"]

const lessons: Array<{ id:string; level:string; order:string; title:string; subtitle:string; vocab:number; sentences:number; free:boolean; date:string; featured?:boolean; draft?:boolean }> = [
  { id:"#L101",level:"HSK1",order:"01",title:"Chào hỏi cơ bản",subtitle:"Basic Greetings & Introductions",vocab:12,sentences:8,free:true,date:"24/05/2024" },
  { id:"#L102",level:"HSK1",order:"02",title:"Bạn tên là gì?",subtitle:"Asking for names and nationality",vocab:15,sentences:10,free:true,date:"22/05/2024" },
  { id:"#L103",level:"HSK1",order:"03",title:"Số đếm và tuổi tác",subtitle:"Numbers, ages & basic counting",vocab:18,sentences:12,free:true,date:"20/05/2024" },
  { id:"#L201",level:"HSK2",order:"01",title:"Lịch trình hằng ngày",subtitle:"Daily schedules & routines",vocab:20,sentences:10,free:true,date:"28/05/2024" },
  { id:"#L202",level:"HSK2",order:"02",title:"Thời tiết và mùa",subtitle:"Weather & seasons vocabulary",vocab:16,sentences:8,free:true,date:"26/05/2024" },
  { id:"#L203",level:"HSK2",order:"03",title:"Hỏi đường",subtitle:"Asking for directions",vocab:14,sentences:12,free:true,date:"25/05/2024" },
  { id:"#L210",level:"HSK2",order:"05",title:"Ăn tối ở đâu?",subtitle:"Ordering food at a restaurant",vocab:20,sentences:12,free:true,date:"15/05/2024" },
  { id:"#L301",level:"HSK3",order:"01",title:"Kỳ nghỉ cuối tuần",subtitle:"Weekend plans & activities",vocab:24,sentences:14,free:false,date:"30/05/2024" },
  { id:"#L302",level:"HSK3",order:"02",title:"Sức khỏe và thể thao",subtitle:"Health, fitness & sports",vocab:26,sentences:15,free:false,date:"29/05/2024" },
  { id:"#L305",level:"HSK3",order:"14",title:"Kế hoạch cuối tuần",subtitle:"Weekend plans & leisure activities",vocab:28,sentences:15,free:false,date:"18/05/2024",featured:true },
  { id:"#L401",level:"HSK4",order:"01",title:"Môi trường làm việc",subtitle:"Workplace environment & communication",vocab:32,sentences:18,free:false,date:"01/06/2024" },
  { id:"#L402",level:"HSK4",order:"--",title:"Thị trường lao động",subtitle:"Discussing job markets & economy",vocab:42,sentences:0,free:false,date:"10/05/2024",draft:true },
  { id:"#L501",level:"HSK5",order:"01",title:"Kinh tế và xã hội",subtitle:"Economics & social issues",vocab:38,sentences:20,free:false,date:"05/06/2024" },
  { id:"#L601",level:"HSK6",order:"01",title:"Văn học đương đại",subtitle:"Contemporary Chinese literature",vocab:45,sentences:22,free:false,date:"10/06/2024" },
]

function LevelTabs({ active, onChange }: { active: LevelTab; onChange: (tab: LevelTab) => void }) {
  return <div className={styles.tabs}>{levelTabs.map((tab) => <button key={tab} type="button" className={`${styles.tab} ${active === tab ? styles.activeTab : ""}`} onClick={() => onChange(tab)}>{tab === "all" ? "Tất cả" : tab}</button>)}</div>
}

function FiltersCard() {
  return <section className={styles.filters}><label><AdminIcon name="search" /><input placeholder="Tìm kiếm theo tiêu đề bài học hoặc nội dung..." /></label><div><select defaultValue=""><option value="">Trạng thái</option><option>Published</option><option>Draft</option></select><select defaultValue=""><option value="">Free/Pro</option><option>Free</option><option>Pro</option></select><select defaultValue="new"><option value="new">Sắp xếp: Mới nhất</option><option>Cũ nhất</option></select></div></section>
}

export default function AdminLessonsPage() {
  const [activeLevel, setActiveLevel] = useState<LevelTab>("all")

  const filtered = activeLevel === "all" ? lessons : lessons.filter((l) => l.level === activeLevel)

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <PageHeader eyebrow={<span>Dashboard › <b>Bài học</b></span>} title="Bài học" actions={<AdminButton icon="plus">Thêm bài học</AdminButton>} />
      </motion.div>
      <motion.div variants={itemVariants}>
        <section className={styles.tabCard}><LevelTabs active={activeLevel} onChange={setActiveLevel} /></section>
      </motion.div>
      <motion.div variants={itemVariants}><FiltersCard /></motion.div>
      <motion.div variants={itemVariants}>
        <section className={styles.tableCard}><AdminTable><thead><tr><th>ID</th><th>Cấp độ</th><th>Thứ tự</th><th>Tiêu đề bài học</th><th>Nội dung</th><th>Free</th><th>Cập nhật</th><th>Actions</th></tr></thead><tbody>{filtered.map((lesson) => <tr key={lesson.id}><td><b>{lesson.id}</b></td><td><span className={styles.levelBadge}>{lesson.level}</span></td><td>{lesson.order}</td><td><div className={styles.lessonTitle}><strong>{lesson.title}</strong>{lesson.featured && <i>★</i>}{lesson.draft && <em>DRAFT</em>}<small>{lesson.subtitle}</small></div></td><td><span className={styles.contentCounts}>☆ {lesson.vocab}　☵ {lesson.sentences}</span></td><td>{lesson.free ? <span className={styles.freeYes}>✓ Yes</span> : <span className={styles.freeNo}>⊗ No</span>}</td><td>{lesson.date}</td><td><div className={styles.actions}><button type="button" aria-label="Xem"><AdminIcon name="eye" /></button><button type="button" aria-label="Sửa"><AdminIcon name="edit" /></button></div></td></tr>)}</tbody></AdminTable><footer><span>Đang xem 1 đến {filtered.length} trong số {lessons.length} bài học</span><Pagination /></footer></section>
      </motion.div>
    </motion.div>
  )
}
