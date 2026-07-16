"use client"

import { useMemo, useState } from "react"
import AdminIcon from "@/components/admin/admin-icons"
import { AdminButton, AdminTable } from "@/components/admin/admin-ui"
import type { AdminLevel } from "@/services/admin-level.service"
import type { AdminLesson } from "@/services/admin-lesson.service"
import type { ImportFilePayload, ImportMode, ImportPreviewResult } from "@/services/admin-vocabulary.service"
import { Field, LessonModal } from "./LessonShared"
import type { ImportStep } from "./types"
import styles from "../lessons.module.css"

type ImportResult = {
  imported: unknown[]
  sentences: unknown[]
  totalRows: number
  added: number
  skipped: Array<{ row: number; issue: string }>
}

const GLOBAL_COLUMNS = [
  "bài học",
  "từ vựng",
  "phiên âm từ vựng",
  "nghĩa từ vựng",
  "câu luyện tập",
  "phiên âm",
  "nghĩa câu",
]

const LESSON_COLUMNS = [
  "từ vựng",
  "phiên âm từ vựng",
  "giải thích từ vựng",
  "câu luyện tập",
  "phiên âm câu luyện tập",
  "nghĩa câu luyện tập",
]

const stepLabels = ["Phạm vi", "Upload", "Định dạng", "Preview", "Xác nhận", "Kết quả"]

function csvLine(values: string[]) {
  return values.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")
}

function statusLabel(status: string) {
  if (status === "valid") return "Hợp lệ"
  if (status === "warning") return "Cảnh báo"
  if (status === "duplicate") return "Trùng"
  return "Lỗi"
}

function actionLabel(action: string, lessonAction: string) {
  if (action === "update") return "Cập nhật từ"
  if (lessonAction === "create") return "Tạo bài + từ"
  if (action === "create") return "Tạo từ"
  return "Bỏ qua"
}

export function ExcelImportWizard({
  levels,
  lessons,
  defaultLevelId,
  defaultLessonId,
  onPreview,
  onImport,
  onClose,
}: {
  levels: AdminLevel[]
  lessons: AdminLesson[]
  defaultLevelId: string
  defaultLessonId?: string
  onPreview: (payload: ImportFilePayload) => Promise<ImportPreviewResult>
  onImport: (payload: ImportFilePayload) => Promise<ImportResult>
  onClose: () => void
}) {
  const [step, setStep] = useState<ImportStep>(1)
  const [mode, setMode] = useState<ImportMode>(defaultLessonId ? "lesson" : "global")
  const [levelId, setLevelId] = useState(defaultLevelId)
  const [lessonId, setLessonId] = useState(defaultLessonId || "")
  const [file, setFile] = useState<File | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState("")
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const filteredLessons = useMemo(() => lessons.filter((lesson) => lesson.levelId === levelId), [levelId, lessons])
  const selectedLevel = levels.find((level) => level.id === levelId)
  const selectedLesson = lessons.find((lesson) => lesson.id === lessonId)
  const expectedColumns = mode === "global" ? GLOBAL_COLUMNS : LESSON_COLUMNS
  const canCommit = !!preview && preview.errorRows === 0 && preview.duplicateRows === 0 && preview.totalRows > 0

  function payload(): ImportFilePayload | null {
    if (!file) return null
    return {
      mode,
      file,
      levelId: mode === "global" ? levelId : undefined,
      lessonId: mode === "lesson" ? lessonId : undefined,
    }
  }

  function validateCurrentStep() {
    if (step === 1 && mode === "global" && !levelId) return "Chọn HSK level trước khi tiếp tục."
    if (step === 1 && mode === "lesson" && !lessonId) return "Chọn bài học trước khi tiếp tục."
    if (step === 2 && !file) return "Chọn file Excel hoặc CSV trước khi tiếp tục."
    return ""
  }

  async function next() {
    const message = validateCurrentStep()
    if (message) {
      setImportError(message)
      return
    }
    if (step === 3) {
      await runPreview()
      return
    }
    setImportError("")
    setStep((current) => Math.min(6, current + 1) as ImportStep)
  }

  function back() {
    setImportError("")
    setStep((current) => Math.max(1, current - 1) as ImportStep)
  }

  function goToStep(target: ImportStep) {
    if (target <= step) setStep(target)
  }

  function resetPreview() {
    setPreview(null)
    setImportResult(null)
  }

  function changeMode(nextMode: ImportMode) {
    setMode(nextMode)
    setImportError("")
    resetPreview()
    if (nextMode === "global") setLessonId("")
    if (nextMode === "lesson" && !lessonId && filteredLessons[0]) setLessonId(filteredLessons[0].id)
  }

  function downloadTemplate() {
    const headers = mode === "global" ? GLOBAL_COLUMNS : LESSON_COLUMNS
    const example = mode === "global"
      ? ["Bài 1", "爸爸", "bàba", "bố", "这是我的爸爸。", "Zhè shì wǒ de bàba.", "Đây là bố của tôi."]
      : ["爸爸", "bàba", "bố", "这是我的爸爸。", "Zhè shì wǒ de bàba.", "Đây là bố của tôi."]
    const url = URL.createObjectURL(new Blob([`\uFEFF${csvLine(headers)}\r\n${csvLine(example)}`], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = mode === "global" ? "mau-import-nhieu-bai.csv" : "mau-import-trong-bai.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  async function runPreview() {
    const data = payload()
    if (!data) {
      setImportError("Chọn file Excel hoặc CSV trước khi preview.")
      setStep(2)
      return
    }
    if (mode === "lesson" && !lessonId) {
      setImportError("Chọn bài học trước khi preview.")
      setStep(1)
      return
    }
    setPreviewing(true)
    setImportError("")
    try {
      setPreview(await onPreview(data))
      setStep(4)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Không thể preview dữ liệu.")
    } finally {
      setPreviewing(false)
    }
  }

  async function confirmImport() {
    const data = payload()
    if (!data) {
      setImportError("Chọn file Excel hoặc CSV trước khi import.")
      setStep(2)
      return
    }
    if (!canCommit) {
      setImportError("File còn lỗi hoặc chưa preview. Sửa file và preview lại trước khi import.")
      setStep(4)
      return
    }
    setImporting(true)
    setImportError("")
    try {
      setImportResult(await onImport(data))
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
        <aside className={styles.importSteps}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <button key={item} type="button" className={step === item ? styles.activeStep : ""} onClick={() => goToStep(item as ImportStep)} disabled={item > step}>
              <span>{item}</span>{stepLabels[item - 1]}
            </button>
          ))}
        </aside>

        <section className={styles.importContent}>
          {step === 1 && (
            <div className={styles.importUpload}>
              <div className={styles.choiceGrid}>
                <button type="button" className={mode === "global" ? styles.choiceActive : ""} onClick={() => changeMode("global")}>
                  <AdminIcon name="book" />
                  <strong>Import nhiều bài</strong>
                  <span>File có cột bài học, mỗi dòng tự ghép vào bài tương ứng hoặc tạo bài mới ở level đang chọn.</span>
                </button>
                <button type="button" className={mode === "lesson" ? styles.choiceActive : ""} onClick={() => changeMode("lesson")}>
                  <AdminIcon name="list" />
                  <strong>Import trong bài</strong>
                  <span>File chỉ có từ vựng và câu luyện tập, toàn bộ dữ liệu đi vào một bài học đã chọn.</span>
                </button>
              </div>
              <div className={styles.formGrid}>
                <Field label="HSK level">
                  <select value={levelId} onChange={(event) => { setLevelId(event.target.value); setLessonId(""); setImportError(""); resetPreview() }}>
                    {levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}
                  </select>
                </Field>
                {mode === "lesson" && (
                  <Field label="Bài học">
                    <select value={lessonId} onChange={(event) => { setLessonId(event.target.value); setImportError(""); resetPreview() }}>
                      <option value="">Chọn bài học</option>
                      {filteredLessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
                    </select>
                  </Field>
                )}
              </div>
              {importError && <div className={styles.stateBox}>{importError}</div>}
            </div>
          )}

          {step === 2 && (
            <div className={styles.importUpload}>
              <label className={styles.templateColumns}>
                <strong>Chọn file dữ liệu</strong>
                <p>Hỗ trợ .xlsx, .xls và .csv. Dòng đầu tiên phải là header đúng định dạng.</p>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => { setFile(event.target.files?.[0] || null); setImportError(""); resetPreview() }} />
              </label>
              {file && <div className={styles.templateColumns}><strong>{file.name}</strong><p>{Math.max(1, Math.round(file.size / 1024))} KB</p></div>}
              <button type="button" className={styles.templateButton} onClick={downloadTemplate}><AdminIcon name="download" />Tải file mẫu CSV</button>
              {importError && <div className={styles.stateBox}>{importError}</div>}
            </div>
          )}

          {step === 3 && (
            <div className={styles.importUpload}>
              <div className={styles.confirmImport}>
                <h3>Định dạng đang dùng</h3>
                <p>{mode === "global" ? "Import ngoài danh sách bài học" : "Import trong từng bài học"}</p>
                <p>File: <strong>{file?.name || "Chưa chọn file"}</strong></p>
              </div>
              <AdminTable className={styles.mappingTable}>
                <thead><tr><th>Thứ tự</th><th>Header Excel cần có</th><th>Ghi chú</th></tr></thead>
                <tbody>{expectedColumns.map((column, index) => <tr key={column}><td>{index + 1}</td><td><code>{column}</code></td><td>{index <= 3 ? <span className={styles.requiredBadge}>Bắt buộc</span> : "Nên có để preview đủ câu luyện tập"}</td></tr>)}</tbody>
              </AdminTable>
              {importError && <div className={styles.stateBox}>{importError}</div>}
            </div>
          )}

          {step === 4 && (
            <div className={styles.importUpload}>
              {preview ? (
                <>
                  <div className={styles.importSummary}>
                    <span>Tổng {preview.totalRows} dòng</span>
                    <span>Hợp lệ {preview.validRows}</span>
                    <span>Cảnh báo {preview.warningRows}</span>
                    <span>Lỗi {preview.errorRows}</span>
                    <span>Trùng {preview.duplicateRows}</span>
                    <span>Tạo từ {preview.summary.vocabToCreate}</span>
                    <span>Cập nhật từ {preview.summary.vocabToUpdate}</span>
                    {mode === "global" && <span>Tạo bài {preview.summary.lessonsToCreate}</span>}
                  </div>
                  {(preview.errorRows > 0 || preview.duplicateRows > 0) && <div className={styles.stateBox}><strong>Cần sửa file trước khi import</strong><p>Các dòng lỗi hoặc trùng sẽ không được ghi database. Sửa file rồi bấm preview lại.</p></div>}
                  <AdminTable className={styles.previewTable}>
                    <thead><tr><th>Dòng</th><th>Trạng thái</th><th>Bài học</th><th>Từ vựng</th><th>Phiên âm</th><th>Nghĩa</th><th>Câu luyện tập</th><th>Phiên âm câu</th><th>Nghĩa câu</th><th>Thao tác</th><th>Ghi chú</th></tr></thead>
                    <tbody>{preview.rows.slice(0, 100).map((row) => <tr key={row.row} className={styles[`row${row.status}`] || ""}><td>{row.row}</td><td>{statusLabel(row.status)}</td><td>{row.lessonTitle || "-"}</td><td>{row.chinese || "-"}</td><td>{row.pinyin || "-"}</td><td>{row.vietnamese || "-"}</td><td>{row.example || "-"}</td><td>{row.examplePinyin || "-"}</td><td>{row.exampleMeaning || "-"}</td><td>{actionLabel(row.action, row.lessonAction)}</td><td>{row.issues.join("; ") || "-"}</td></tr>)}</tbody>
                  </AdminTable>
                  {preview.rows.length > 100 && <div className={styles.stateBox}>Đang hiển thị 100 dòng đầu tiên để bảng không quá dài. Khi import vẫn xử lý toàn bộ {preview.totalRows} dòng.</div>}
                </>
              ) : (
                <div className={styles.confirmImport}>
                  <h3>Chưa có preview</h3>
                  <p>Bấm kiểm tra để đọc file và xem trước dữ liệu trước khi import.</p>
                  <AdminButton icon="eye" onClick={() => void runPreview()} disabled={previewing}>{previewing ? "Đang kiểm tra..." : "Kiểm tra file"}</AdminButton>
                </div>
              )}
              {importError && <div className={styles.stateBox}>{importError}</div>}
            </div>
          )}

          {step === 5 && (
            <div className={styles.confirmImport}>
              <h3>Xác nhận import</h3>
              <p>Chế độ: <strong>{mode === "global" ? "Import nhiều bài" : "Import trong bài"}</strong></p>
              <p>HSK level: <strong>{selectedLevel?.name || "-"}</strong></p>
              {mode === "lesson" && <p>Bài học: <strong>{selectedLesson?.title || "Chưa chọn"}</strong></p>}
              <p>File: <strong>{file?.name || "Chưa chọn file"}</strong></p>
              <p>Dữ liệu sẽ ghi: <strong>{preview ? `${preview.summary.vocabToCreate} tạo mới, ${preview.summary.vocabToUpdate} cập nhật` : "Chưa preview"}</strong></p>
              {preview?.warningRows ? <p>Có <strong>{preview.warningRows}</strong> dòng cảnh báo. Các dòng này vẫn được import vì đủ từ vựng, nhưng thiếu một phần câu luyện tập.</p> : null}
              {!canCommit && <div className={styles.stateBox}>Chưa thể import vì file chưa preview hoặc còn lỗi/trùng.</div>}
            </div>
          )}

          {step === 6 && (
            <div className={styles.importResult}>
              <i><AdminIcon name="check" /></i>
              <h3>Import thành công</h3>
              <p>{importResult ? `Đã ghi ${importResult.added} từ vựng từ ${importResult.totalRows} dòng.` : "Đã hoàn tất luồng import."}</p>
              {importResult?.skipped.length ? <div className={styles.templateColumns}><strong>Dòng bỏ qua</strong><p>{importResult.skipped.slice(0, 5).map((item) => `Dòng ${item.row}: ${item.issue}`).join("; ")}</p></div> : null}
              <div><AdminButton icon="eye" onClick={onClose}>Xem nội dung vừa import</AdminButton><AdminButton secondary icon="download" onClick={() => { setStep(1); setFile(null); setPreview(null); setImportResult(null) }}>Import file khác</AdminButton></div>
            </div>
          )}

          <footer className={styles.importFooter}>
            <AdminButton secondary onClick={step === 1 ? onClose : back}>{step === 1 ? "Hủy" : "Quay lại"}</AdminButton>
            {step === 4 && preview && <AdminButton secondary icon="eye" onClick={() => void runPreview()} disabled={previewing}>{previewing ? "Đang kiểm tra..." : "Preview lại"}</AdminButton>}
            {step < 6 && <AdminButton icon={step === 5 ? "check" : "chevronRight"} onClick={step === 5 ? confirmImport : next} disabled={importing || previewing || (step === 5 && !canCommit)}>{importing ? "Đang import..." : previewing ? "Đang kiểm tra..." : step === 5 ? "Xác nhận import" : "Tiếp tục"}</AdminButton>}
          </footer>
        </section>
      </div>
    </LessonModal>
  )
}
