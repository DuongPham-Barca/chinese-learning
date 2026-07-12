"use client"

import { useState } from "react"
import AdminIcon from "@/components/admin/admin-icons"
import { AdminButton, AdminTable } from "@/components/admin/admin-ui"
import type { AdminLevel } from "@/services/admin-level.service"
import { Field, LessonModal, UploadDropzone } from "./LessonShared"
import type { ImportDataType, ImportPreviewRow, ImportStep, LessonTopic } from "./types"
import styles from "../lessons.module.css"

const previewRows: ImportPreviewRow[] = [
  { id: "1", status: "valid", chinese: "爸爸", pinyin: "baba", vietnamese: "bo", issue: "Hop le" },
  { id: "2", status: "warning", chinese: "妈妈", pinyin: "mama", vietnamese: "me", issue: "Thieu audio" },
  { id: "3", status: "error", chinese: "", pinyin: "gege", vietnamese: "anh trai", issue: "Thieu chu Han" },
  { id: "4", status: "duplicate", chinese: "老师", pinyin: "laoshi", vietnamese: "giao vien", issue: "Trung du lieu" },
]

const templates: Record<ImportDataType, string[]> = {
  vocabulary: ["chinese", "pinyin", "vietnamese", "exampleZh", "exampleVi", "imageUrl", "audioUrl", "order"],
  sentences: ["sentenceVi", "sentenceZh", "audioUrl", "pronunciationEnabled", "dictationEnabled", "arrangeEnabled", "reactionEnabled", "order"],
  lessons: ["hskLevel", "topicName", "lessonName", "description", "estimatedMinutes", "order", "status"],
}

export function ExcelImportWizard({
  levels,
  topics,
  defaultLevelId,
  defaultTopicId,
  defaultLessonName,
  defaultType = "vocabulary",
  onClose,
}: {
  levels: AdminLevel[]
  topics: LessonTopic[]
  defaultLevelId: string
  defaultTopicId?: string
  defaultLessonName?: string
  defaultType?: ImportDataType
  onClose: () => void
}) {
  const [step, setStep] = useState<ImportStep>(1)
  const [type, setType] = useState<ImportDataType>(defaultType)
  const [levelId, setLevelId] = useState(defaultLevelId)
  const [topicId, setTopicId] = useState(defaultTopicId || "")
  const [filter, setFilter] = useState("all")
  const visibleRows = previewRows.filter((row) => filter === "all" || row.status === filter)
  const selectedLevelTopics = topics.filter((topic) => topic.levelId === levelId)

  function next() { setStep((current) => Math.min(7, current + 1) as ImportStep) }
  function back() { setStep((current) => Math.max(1, current - 1) as ImportStep) }

  return (
    <LessonModal title="Import Excel" size="xl" onClose={onClose}>
      <div className={styles.importWizard}>
        <aside className={styles.importSteps}>{[1, 2, 3, 4, 5, 6, 7].map((item) => <button key={item} type="button" className={step === item ? styles.activeStep : ""} onClick={() => setStep(item as ImportStep)}><span>{item}</span>{["Loai du lieu", "Vi tri", "Upload", "Mapping", "Preview", "Xac nhan", "Ket qua"][item - 1]}</button>)}</aside>
        <section className={styles.importContent}>
          {step === 1 && <div className={styles.choiceGrid}>{(["lessons", "vocabulary", "sentences"] as ImportDataType[]).map((item) => <button key={item} type="button" className={type === item ? styles.choiceActive : ""} onClick={() => setType(item)}><AdminIcon name={item === "lessons" ? "book" : item === "vocabulary" ? "language" : "quiz"} /><strong>{item === "lessons" ? "Import bai hoc" : item === "vocabulary" ? "Import tu vung" : "Import cau luyen tap"}</strong><span>Doc file Excel va mapping vao dung field he thong.</span></button>)}</div>}
          {step === 2 && <div className={styles.formGrid}><Field label="HSK level"><select value={levelId} onChange={(event) => setLevelId(event.target.value)}>{levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}</select></Field><Field label="Chu de"><select value={topicId} onChange={(event) => setTopicId(event.target.value)}><option value="">Chon chu de</option>{selectedLevelTopics.map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</select></Field><Field label="Bai hoc" helper="Neu import trong Lesson Editor thi lesson hien tai duoc chon san."><input value={defaultLessonName || "Bai hoc hien tai"} readOnly /></Field></div>}
          {step === 3 && <div className={styles.importUpload}><UploadDropzone title="Keo tha file Excel vao day" helper="Ho tro .xlsx, .xls, .csv. Hien thi ten file, dung luong, thay file va xoa file tai UI." /><button type="button" className={styles.templateButton}><AdminIcon name="download" />Tai file Excel mau</button><div className={styles.templateColumns}><strong>Format file mau</strong><p>{templates[type].join(", ")}</p></div></div>}
          {step === 4 && <AdminTable className={styles.mappingTable}><thead><tr><th>Cot Excel</th><th>Field he thong</th><th>Bat buoc</th></tr></thead><tbody>{templates[type].map((column, index) => <tr key={column}><td>{column}</td><td><select defaultValue={column}><option>{column}</option><option>Bo qua</option></select></td><td>{index < 3 ? <span className={styles.requiredBadge}>Bat buoc</span> : "Tuy chon"}</td></tr>)}</tbody></AdminTable>}
          {step === 5 && <div><div className={styles.importSummary}><span>120 dong du lieu</span><span>108 hop le</span><span>8 canh bao</span><span>4 loi</span></div><div className={styles.previewFilters}>{["all", "valid", "error", "warning", "duplicate"].map((item) => <button key={item} className={filter === item ? styles.segmentActive : ""} type="button" onClick={() => setFilter(item)}>{item}</button>)}</div><AdminTable className={styles.previewTable}><thead><tr><th>Trang thai</th><th>Chinese</th><th>Pinyin</th><th>Vietnamese</th><th>Issue</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id} className={styles[`row${row.status}`]}><td><span className={styles.contentStatus}>{row.status}</span></td><td contentEditable suppressContentEditableWarning>{row.chinese}</td><td contentEditable suppressContentEditableWarning>{row.pinyin}</td><td contentEditable suppressContentEditableWarning>{row.vietnamese}</td><td>{row.issue}</td></tr>)}</tbody></AdminTable></div>}
          {step === 6 && <div className={styles.confirmImport}><h3>Xac nhan Import</h3><p>HSK level: <strong>{levels.find((level) => level.id === levelId)?.name}</strong></p><p>Chu de: <strong>{selectedLevelTopics.find((topic) => topic.id === topicId)?.title || "Chua chon"}</strong></p><p>Bai hoc: <strong>{defaultLessonName || "Bai hoc hien tai"}</strong></p><p>Loai du lieu: <strong>{type}</strong></p><p>So dong hop le: <strong>108</strong></p><p>So dong bo qua: <strong>12</strong></p></div>}
          {step === 7 && <div className={styles.importResult}><i><AdminIcon name="check" /></i><h3>Import thanh cong</h3><p>Da them 108 ban ghi, bo qua 12 dong khong hop le.</p><div><AdminButton icon="eye" onClick={onClose}>Xem noi dung vua import</AdminButton><AdminButton secondary icon="download" onClick={() => setStep(1)}>Import file khac</AdminButton></div></div>}
          <footer className={styles.importFooter}>
            <AdminButton secondary onClick={step === 1 ? onClose : back}>{step === 1 ? "Huy" : "Quay lai"}</AdminButton>
            {step < 7 && <AdminButton icon={step === 6 ? "check" : "chevronRight"} onClick={next}>{step === 6 ? "Xac nhan Import" : "Tiep tuc"}</AdminButton>}
          </footer>
        </section>
      </div>
    </LessonModal>
  )
}
