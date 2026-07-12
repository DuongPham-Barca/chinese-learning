"use client"

import { useState } from "react"
import AdminIcon from "@/components/admin/admin-icons"
import { AdminButton, AdminTable } from "@/components/admin/admin-ui"
import type { AdminLevel } from "@/services/admin-level.service"
import type { AdminLesson } from "@/services/admin-lesson.service"
import { Field, LessonModal, UploadDropzone } from "./LessonShared"
import type { ImportPreviewRow, ImportStep } from "./types"
import styles from "../lessons.module.css"

type ImportResult = {
  imported: unknown[]
  sentences: unknown[]
  totalRows: number
  added: number
  skipped: Array<{ row: number; issue: string }>
}

const previewRows: ImportPreviewRow[] = [
  { id: "1", status: "valid", chinese: "爸爸", pinyin: "baba", vietnamese: "bố", issue: "Hợp lệ" },
  { id: "2", status: "warning", chinese: "妈妈", pinyin: "mama", vietnamese: "mẹ", issue: "Thiếu audio" },
  { id: "3", status: "error", chinese: "", pinyin: "gege", vietnamese: "anh trai", issue: "Thiếu chữ Hán" },
  { id: "4", status: "duplicate", chinese: "老师", pinyin: "laoshi", vietnamese: "giáo viên", issue: "Trùng dữ liệu" },
]

const ALL_COLUMNS = [
  "hskLevel", "topicName", "lessonName", "description", "estimatedMinutes", "status",
  "chinese", "pinyin", "vietnamese",
  "example", "example_pinyin", "example_meaning",
  "sentenceVi", "sentenceZh",
  "imageUrl", "audioUrl", "order",
]

export function ExcelImportWizard({
  levels,
  lessons,
  defaultLevelId,
  defaultLessonId,
  onImport,
  onClose,
}: {
  levels: AdminLevel[]
  lessons: AdminLesson[]
  defaultLevelId: string
  defaultLessonId?: string
  onImport: (lessonId: string, file: File) => Promise<ImportResult>
  onClose: () => void
}) {
  const [step, setStep] = useState<ImportStep>(1)
  const [levelId, setLevelId] = useState(defaultLevelId)
  const [lessonId, setLessonId] = useState(defaultLessonId || "")
  const [filter, setFilter] = useState("all")
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState("")
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const visibleRows = previewRows.filter((row) => filter === "all" || row.status === filter)
  const filteredLessons = lessons.filter((lesson) => lesson.levelId === levelId)

  function next() { setStep((current) => Math.min(6, current + 1) as ImportStep) }
  function back() { setStep((current) => Math.max(1, current - 1) as ImportStep) }
  async function confirmImport() {
    if (!file) {
      setImportError("Chọn file Excel hoặc CSV trước khi import.")
      setStep(2)
      return
    }
    if (!lessonId) {
      setImportError("Chọn bài học trước khi import.")
      setStep(1)
      return
    }
    setImporting(true)
    setImportError("")
    try {
      setImportResult(await onImport(lessonId, file))
      setStep(6)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Không thể import dữ liệu.")
    } finally {
      setImporting(false)
    }
  }

  return (
    <LessonModal title="Import Excel" size="xl" onClose={onClose}>
      <div className={styles.importWizard}>
        <aside className={styles.importSteps}>{[1, 2, 3, 4, 5, 6].map((item) => <button key={item} type="button" className={step === item ? styles.activeStep : ""} onClick={() => setStep(item as ImportStep)}><span>{item}</span>{["Vị trí", "Upload", "Mapping", "Preview", "Xác nhận", "Kết quả"][item - 1]}</button>)}</aside>
        <section className={styles.importContent}>
          {step === 1 && <div className={styles.formGrid}><Field label="HSK level"><select value={levelId} onChange={(event) => { setLevelId(event.target.value); setLessonId("") }}>{levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}</select></Field><Field label="Bài học"><select value={lessonId} onChange={(event) => setLessonId(event.target.value)}><option value="">Chọn bài học</option>{filteredLessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select></Field></div>}
          {step === 2 && <div className={styles.importUpload}><UploadDropzone title="Kéo thả file Excel vào đây" helper="Hỗ trợ .xlsx, .xls, .csv. File chứa đồng thời từ vựng, câu luyện tập và ví dụ." /><input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => { setFile(event.target.files?.[0] || null); setImportError("") }} />{file && <div className={styles.templateColumns}><strong>{file.name}</strong><p>{Math.round(file.size / 1024)} KB</p></div>}{importError && <div className={styles.stateBox}>{importError}</div>}<button type="button" className={styles.templateButton}><AdminIcon name="download" />Tải file Excel mẫu</button><div className={styles.templateColumns}><strong>Format file mẫu</strong><p>{ALL_COLUMNS.join(", ")}</p></div></div>}
          {step === 3 && <AdminTable className={styles.mappingTable}><thead><tr><th>Cột Excel</th><th>Field hệ thống</th><th>Bắt buộc</th></tr></thead><tbody>{ALL_COLUMNS.map((column, index) => <tr key={column}><td>{column}</td><td><select defaultValue={column}><option>{column}</option><option>Bỏ qua</option></select></td><td>{index < 3 ? <span className={styles.requiredBadge}>Bắt buộc</span> : "Tùy chọn"}</td></tr>)}</tbody></AdminTable>}
          {step === 4 && <div><div className={styles.importSummary}><span>120 dòng dữ liệu</span><span>108 hợp lệ</span><span>8 cảnh báo</span><span>4 lỗi</span></div><div className={styles.previewFilters}>{["all", "valid", "error", "warning", "duplicate"].map((item) => <button key={item} className={filter === item ? styles.segmentActive : ""} type="button" onClick={() => setFilter(item)}>{item}</button>)}</div><AdminTable className={styles.previewTable}><thead><tr><th>Trạng thái</th><th>Chinese</th><th>Pinyin</th><th>Vietnamese</th><th>Issue</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id} className={styles[`row${row.status}`]}><td><span className={styles.contentStatus}>{row.status}</span></td><td contentEditable suppressContentEditableWarning>{row.chinese}</td><td contentEditable suppressContentEditableWarning>{row.pinyin}</td><td contentEditable suppressContentEditableWarning>{row.vietnamese}</td><td>{row.issue}</td></tr>)}</tbody></AdminTable></div>}
          {step === 5 && <div className={styles.confirmImport}><h3>Xác nhận Import</h3><p>HSK level: <strong>{levels.find((level) => level.id === levelId)?.name}</strong></p><p>Bài học: <strong>{lessons.find((lesson) => lesson.id === lessonId)?.title || "Chưa chọn"}</strong></p><p>File: <strong>{file?.name || "Chưa chọn file"}</strong></p><p>Dữ liệu import: <strong>Từ vựng + Câu luyện tập + Ví dụ</strong></p></div>}
          {step === 6 && <div className={styles.importResult}><i><AdminIcon name="check" /></i><h3>Import thành công</h3><p>{importResult ? `Đã thêm ${importResult.added} bản ghi, bỏ qua ${importResult.skipped.length} dòng không hợp lệ.` : "Đã hoàn tất luồng import."}</p>{importResult?.skipped.length ? <div className={styles.templateColumns}><strong>Dòng bỏ qua</strong><p>{importResult.skipped.slice(0, 5).map((item) => `Dòng ${item.row}: ${item.issue}`).join("; ")}</p></div> : null}<div><AdminButton icon="eye" onClick={onClose}>Xem nội dung vừa import</AdminButton><AdminButton secondary icon="download" onClick={() => { setStep(1); setFile(null); setImportResult(null) }}>Import file khác</AdminButton></div></div>}
          <footer className={styles.importFooter}>
            <AdminButton secondary onClick={step === 1 ? onClose : back}>{step === 1 ? "Hủy" : "Quay lại"}</AdminButton>
            {step < 6 && <AdminButton icon={step === 5 ? "check" : "chevronRight"} onClick={step === 5 ? confirmImport : next} disabled={importing}>{importing ? "Đang import..." : step === 5 ? "Xác nhận Import" : "Tiếp tục"}</AdminButton>}
          </footer>
        </section>
      </div>
    </LessonModal>
  )
}
