"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { CSSProperties } from "react"
import { AxiosError } from "axios"
import { motion } from "framer-motion"
import { AdminButton, PageHeader } from "@/components/admin/admin-ui"
import { getLevels, type AdminLevel } from "@/services/admin-level.service"
import { createLesson, deleteLesson, getLessonById, getLessons, updateLesson, type AdminLesson, type AdminLessonDetail, type LessonPayload } from "@/services/admin-lesson.service"
import { createVocabulary, deleteVocabulary, importAll, type VocabularyPayload } from "@/services/admin-vocabulary.service"
import { HskLevelTabs } from "./components/HskLevelTabs"
import { LessonFilters } from "./components/LessonFilters"
import { LessonEditor } from "./components/LessonEditor"
import { ExcelImportWizard } from "./components/ExcelImportWizard"
import { DeleteConfirmModal } from "./components/DeleteConfirmModal"
import { ErrorState, LoadingState } from "./components/LessonShared"
import { LessonGrid, LessonTable, NoLessons } from "./components/LessonGrid"
import { buildLevelSummaries, getHskMeta } from "./components/lesson-model"
import type { ViewMode } from "./components/types"
import syncStyles from "./client-sync.module.css"
import styles from "./lessons.module.css"

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }
const itemVariants = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const } } }

type Toast = { variant: "success" | "error"; message: string } | null

function apiMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; error?: string } | undefined
    return data?.message || data?.error || fallback
  }
  return fallback
}

function apiErrors(error: unknown) {
  return error instanceof AxiosError ? ((error.response?.data as { errors?: Record<string, string> } | undefined)?.errors || null) : null
}

export default function AdminLessonsPage() {
  const [levels, setLevels] = useState<AdminLevel[]>([])
  const [lessons, setLessons] = useState<AdminLesson[]>([])
  const [selectedLevelId, setSelectedLevelId] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [sort, setSort] = useState("order")
  const [view, setView] = useState<ViewMode>("grid")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
  const [editorLesson, setEditorLesson] = useState<AdminLesson | "create" | null>(null)
  const [detail, setDetail] = useState<AdminLessonDetail | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminLesson | null>(null)

  const loadLevels = useCallback(async () => {
    const response = await getLevels({ limit: 100, sort: "order" })
    setLevels(response.data)
    setSelectedLevelId((current) => current || response.data[0]?.id || "")
  }, [])

  const loadLessons = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await getLessons({ limit: 200, sort: "order" })
      setLessons(response.data)
    } catch (e) {
      setError(apiMessage(e, "Không thể tải danh sách bài học"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (active) void loadLevels().catch((e) => setToast({ variant: "error", message: apiMessage(e, "Không thể tải cấp độ") }))
    })
    return () => { active = false }
  }, [loadLevels])
  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (active) void loadLessons()
    })
    return () => { active = false }
  }, [loadLessons])

  const levelSummaries = useMemo(() => buildLevelSummaries(levels, lessons), [levels, lessons])
  const selectedLevel = levels.find((level) => level.id === selectedLevelId) || levels[0]
  const filteredLessons = useMemo(() => {
    const normalizedSearch = search.toLowerCase()
    return lessons
      .filter((lesson) => lesson.levelId === selectedLevelId)
      .filter((lesson) => !normalizedSearch || `${lesson.title} ${lesson.description || ""}`.toLowerCase().includes(normalizedSearch))
      .filter((lesson) => !status || (status === "published" ? lesson.isPublished : !lesson.isPublished))
      .slice()
      .sort((a, b) => sort === "updatedAt" ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime() : sort === "title" ? a.title.localeCompare(b.title) : a.order - b.order)
  }, [search, selectedLevelId, sort, status, lessons])

  async function openEditor(lesson: AdminLesson | "create") {
    setEditorLesson(lesson)
    setDetail(null)
    if (lesson !== "create") {
      try { setDetail((await getLessonById(lesson.id)).data) }
      catch (e) { setToast({ variant: "error", message: apiMessage(e, "Không thể tải chi tiết bài học") }) }
    }
  }

  async function saveLesson(payload: LessonPayload) {
    setSaving(true)
    try {
      if (editorLesson && editorLesson !== "create") await updateLesson(editorLesson.id, payload)
      else await createLesson(payload)
      await loadLessons()
      setToast({ variant: "success", message: "Đã lưu bài học" })
      setEditorLesson(null)
      return null
    } catch (e) {
      setToast({ variant: "error", message: apiMessage(e, "Không thể lưu bài học") })
      return apiErrors(e)
    } finally {
      setSaving(false)
    }
  }

  async function addVocabulary(payload: VocabularyPayload) {
    if (!detail) return { lesson: "Cần lưu hoặc chọn bài học trước khi thêm từ vựng" }
    setSaving(true)
    try {
      await createVocabulary(detail.id, payload)
      setDetail((await getLessonById(detail.id)).data)
      await loadLessons()
      setToast({ variant: "success", message: "Đã thêm từ vựng" })
      return null
    } catch (e) {
      setToast({ variant: "error", message: apiMessage(e, "Không thể lưu từ vựng") })
      return apiErrors(e)
    } finally {
      setSaving(false)
    }
  }

  async function removeVocabulary(id: string) {
    if (!detail) return
    try {
      await deleteVocabulary(id)
      setDetail((await getLessonById(detail.id)).data)
      await loadLessons()
      setToast({ variant: "success", message: "Đã xóa từ vựng" })
    } catch (e) {
      setToast({ variant: "error", message: apiMessage(e, "Không thể xóa từ vựng") })
    }
  }

  async function importFile(lessonId: string, file: File) {
    const response = await importAll(lessonId, file)
    if (detail?.id === lessonId) {
      setDetail((await getLessonById(lessonId)).data)
    }
    await loadLessons()
    setToast({ variant: "success", message: `Đã import ${response.data.added} bản ghi` })
    return response.data
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteLesson(deleteTarget.id)
      await loadLessons()
      setToast({ variant: "success", message: "Đã xóa bài học" })
      setDeleteTarget(null)
    } catch (e) {
      setToast({ variant: "error", message: apiMessage(e, "Không thể xóa nội dung") })
    } finally {
      setSaving(false)
    }
  }

  const defaultLevelId = selectedLevel?.id || levels[0]?.id || ""
  const activeMeta = selectedLevel ? getHskMeta(selectedLevel) : null

  function lessonActions() {
    return <>
      <AdminButton icon="plus" onClick={() => void openEditor("create")}>Tạo bài học</AdminButton>
      <AdminButton secondary icon="download" onClick={() => setImportOpen(true)}>Import Excel</AdminButton>
    </>
  }

  return (
    <motion.div className={syncStyles.clientAlignedPage} variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <PageHeader
          eyebrow={<span>Quản lý bài học / {selectedLevel?.name || "HSK"}</span>}
          title="Quản lý bài học"
          subtitle="Quản lý cấp độ, bài học và nội dung học tiếng Trung"
          actions={lessonActions()}
        />
      </motion.div>

      <motion.div variants={itemVariants} className={styles.breadcrumb}>
        <button type="button" onClick={() => { setSelectedLevelId(defaultLevelId); setEditorLesson(null) }}>Quản lý bài học</button>
        {selectedLevel && <><span>/</span><button type="button">{selectedLevel.name}</button></>}
      </motion.div>

      <motion.div variants={itemVariants} className={styles.managementShell}>
        <HskLevelTabs levels={levelSummaries} selectedLevelId={defaultLevelId} onSelect={setSelectedLevelId} />
        <main className={styles.contentPane}>
          {selectedLevel && activeMeta && <section className={`${styles.levelOverview} ${syncStyles.clientPanel}`} style={{ "--accent": activeMeta.accent, "--soft": activeMeta.soft } as CSSProperties}><div><span className={styles.levelDot} /><strong>{selectedLevel.name}</strong><p>{selectedLevel.description || activeMeta.description}</p></div><dl><div><dt>Bài học</dt><dd>{filteredLessons.length}</dd></div><div><dt>Từ vựng</dt><dd>{filteredLessons.reduce((sum, lesson) => sum + lesson.vocabularyCount, 0)}</dd></div></dl></section>}
          <LessonFilters search={search} status={status} sort={sort} view={view} onSearch={setSearch} onStatus={setStatus} onSort={setSort} onView={setView} onRefresh={() => void loadLessons()} />
          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} onRetry={() => void loadLessons()} />}
          {!loading && !error && selectedLevel && (filteredLessons.length ? (
            view === "grid" ? (
              <LessonGrid lessons={filteredLessons} level={selectedLevel} onView={(lesson) => void openEditor(lesson)} onEdit={(lesson) => void openEditor(lesson)} onDuplicate={(lesson) => void openEditor({ ...lesson, id: "", title: `${lesson.title} (copy)`, slug: `${lesson.slug}-copy`, isPublished: false })} onDelete={setDeleteTarget} />
            ) : (
              <LessonTable lessons={filteredLessons} level={selectedLevel} onView={(lesson) => void openEditor(lesson)} onEdit={(lesson) => void openEditor(lesson)} onDuplicate={(lesson) => void openEditor({ ...lesson, id: "", title: `${lesson.title} (copy)`, slug: `${lesson.slug}-copy`, isPublished: false })} onDelete={setDeleteTarget} />
            )
          ) : (
            <NoLessons onCreate={() => void openEditor("create")} onImport={() => setImportOpen(true)} />
          ))}
        </main>
      </motion.div>

      {editorLesson && <LessonEditor levels={levels} lesson={editorLesson === "create" || editorLesson.id === "" ? null : editorLesson} detail={detail} defaultLevelId={defaultLevelId} saving={saving} onClose={() => setEditorLesson(null)} onSaveLesson={saveLesson} onAddVocabulary={addVocabulary} onDeleteVocabulary={(id) => void removeVocabulary(id)} onImport={() => setImportOpen(true)} />}
      {importOpen && <ExcelImportWizard levels={levels} lessons={lessons} defaultLevelId={defaultLevelId} defaultLessonId={detail?.id} onImport={importFile} onClose={() => setImportOpen(false)} />}
      {deleteTarget && <DeleteConfirmModal title="Xóa bài học" description={`Bạn sắp xóa bài học "${deleteTarget.title}".`} facts={[{ label: "Số từ vựng", value: deleteTarget.vocabularyCount }, { label: "Số câu luyện tập", value: deleteTarget.sentenceCount }]} saving={saving} onClose={() => setDeleteTarget(null)} onConfirm={() => void confirmDelete()} />}
      {toast && <div className={`${styles.toast} ${toast.variant === "success" ? styles.toastSuccess : styles.toastError}`}><span>{toast.message}</span><button type="button" onClick={() => setToast(null)}>x</button></div>}
    </motion.div>
  )
}
