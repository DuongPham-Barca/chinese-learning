"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { CSSProperties } from "react"
import { AxiosError } from "axios"
import { motion } from "framer-motion"
import { AdminButton, PageHeader } from "@/components/admin/admin-ui"
import { getLevels, type AdminLevel } from "@/services/admin-level.service"
import { createLesson, deleteLesson, getLessonById, getLessons, updateLesson, type AdminLesson, type AdminLessonDetail, type LessonPayload } from "@/services/admin-lesson.service"
import { createVocabulary, deleteVocabulary, type VocabularyPayload } from "@/services/admin-vocabulary.service"
import { HskLevelTabs } from "./components/HskLevelTabs"
import { LessonFilters } from "./components/LessonFilters"
import { TopicList } from "./components/TopicCard"
import { TopicFormModal } from "./components/TopicFormModal"
import { LessonEditor } from "./components/LessonEditor"
import { ExcelImportWizard } from "./components/ExcelImportWizard"
import { DeleteConfirmModal } from "./components/DeleteConfirmModal"
import { ErrorState, LoadingState } from "./components/LessonShared"
import { buildLevelSummaries, buildTopics, getHskMeta, makeTopicId } from "./components/lesson-model"
import type { LessonTopic, TopicDraft, ViewMode } from "./components/types"
import syncStyles from "./client-sync.module.css"
import styles from "./lessons.module.css"

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }
const itemVariants = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const } } }

type Toast = { variant: "success" | "error"; message: string } | null
type DeleteTarget = { kind: "topic"; topic: LessonTopic } | { kind: "lesson"; lesson: AdminLesson } | null

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
  const [localTopics, setLocalTopics] = useState<LessonTopic[]>([])
  const [selectedLevelId, setSelectedLevelId] = useState("")
  const [selectedTopicId, setSelectedTopicId] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [sort, setSort] = useState("order")
  const [view, setView] = useState<ViewMode>("grid")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
  const [topicModal, setTopicModal] = useState<LessonTopic | "create" | null>(null)
  const [editorLesson, setEditorLesson] = useState<AdminLesson | "create" | null>(null)
  const [editorTopicId, setEditorTopicId] = useState("")
  const [detail, setDetail] = useState<AdminLessonDetail | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null)

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

  const topicsByLevel = useMemo(() => buildTopics(levels, lessons, localTopics), [levels, lessons, localTopics])
  const levelSummaries = useMemo(() => buildLevelSummaries(levels, lessons, topicsByLevel), [levels, lessons, topicsByLevel])
  const selectedLevel = levels.find((level) => level.id === selectedLevelId) || levels[0]
  const selectedTopics = useMemo(() => {
    const base = selectedLevel ? (topicsByLevel.get(selectedLevel.id) || []) : []
    const normalizedSearch = search.toLowerCase()
    return base
      .map((topic) => ({ ...topic, lessons: topic.lessons.filter((lesson) => {
        const matchesSearch = !normalizedSearch || `${topic.title} ${lesson.title} ${lesson.description || ""}`.toLowerCase().includes(normalizedSearch)
        const matchesStatus = !status || (status === "published" ? lesson.isPublished : !lesson.isPublished)
        return matchesSearch && matchesStatus
      }) }))
      .filter((topic) => (!selectedTopicId || topic.id === selectedTopicId) && (!normalizedSearch || topic.title.toLowerCase().includes(normalizedSearch) || topic.lessons.length))
      .map((topic) => ({ ...topic, lessons: topic.lessons.slice().sort((a, b) => sort === "updatedAt" ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime() : sort === "title" ? a.title.localeCompare(b.title) : a.order - b.order) }))
  }, [search, selectedLevel, selectedTopicId, sort, status, topicsByLevel])

  async function openEditor(lesson: AdminLesson | "create", topicId = selectedTopicId) {
    setEditorLesson(lesson)
    setEditorTopicId(topicId)
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

  function saveTopic(draft: TopicDraft) {
    if (topicModal && topicModal !== "create") {
      setLocalTopics((current) => current.map((topic) => topic.id === topicModal.id ? { ...topic, ...draft, lessons: topic.lessons } : topic))
      setToast({ variant: "success", message: "Đã cập nhật chủ đề trên UI" })
    } else {
      setLocalTopics((current) => [...current, { id: makeTopicId(), ...draft, lessons: [] }])
      setToast({ variant: "success", message: "Đã tạo chủ đề trên UI" })
    }
    setTopicModal(null)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try {
      if (deleteTarget.kind === "lesson") {
        await deleteLesson(deleteTarget.lesson.id)
        await loadLessons()
        setToast({ variant: "success", message: "Đã xóa bài học" })
      } else {
        setLocalTopics((current) => current.filter((topic) => topic.id !== deleteTarget.topic.id))
        setToast({ variant: "success", message: "Đã xóa chủ đề trên UI" })
      }
      setDeleteTarget(null)
    } catch (e) {
      setToast({ variant: "error", message: apiMessage(e, "Không thể xóa nội dung") })
    } finally {
      setSaving(false)
    }
  }

  const defaultLevelId = selectedLevel?.id || levels[0]?.id || ""
  const activeMeta = selectedLevel ? getHskMeta(selectedLevel) : null

  return (
    <motion.div className={syncStyles.clientAlignedPage} variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants}>
        <PageHeader
          eyebrow={<span>Quản lý bài học / {selectedLevel?.name || "HSK"}</span>}
          title="Quản lý bài học"
          subtitle="Quản lý cấp độ, chủ đề, bài học và nội dung học tiếng Trung"
          actions={<><AdminButton secondary icon="plus" onClick={() => setTopicModal("create")}>Tạo chủ đề</AdminButton><AdminButton icon="plus" onClick={() => void openEditor("create")}>Tạo bài học</AdminButton><AdminButton secondary icon="download" onClick={() => setImportOpen(true)}>Import Excel</AdminButton></>}
        />
      </motion.div>

      <motion.div variants={itemVariants} className={styles.breadcrumb}>
        <button type="button" onClick={() => { setSelectedTopicId(""); setEditorLesson(null) }}>Quản lý bài học</button>
        {selectedLevel && <><span>/</span><button type="button">{selectedLevel.name}</button></>}
        {selectedTopicId && <><span>/</span><button type="button">{selectedTopics.find((topic) => topic.id === selectedTopicId)?.title || "Chủ đề"}</button></>}
      </motion.div>

      <motion.div variants={itemVariants} className={styles.managementShell}>
        <HskLevelTabs levels={levelSummaries} selectedLevelId={defaultLevelId} onSelect={(levelId) => { setSelectedLevelId(levelId); setSelectedTopicId("") }} />
        <main className={styles.contentPane}>
          {selectedLevel && activeMeta && <section className={`${styles.levelOverview} ${syncStyles.clientPanel}`} style={{ "--accent": activeMeta.accent, "--soft": activeMeta.soft } as CSSProperties}><div><span className={styles.levelDot} /><strong>{selectedLevel.name}</strong><p>{selectedLevel.description || activeMeta.description}</p></div><dl><div><dt>Chủ đề</dt><dd>{selectedTopics.length}</dd></div><div><dt>Bài học</dt><dd>{selectedTopics.reduce((sum, topic) => sum + topic.lessons.length, 0)}</dd></div><div><dt>Từ vựng</dt><dd>{selectedTopics.reduce((sum, topic) => sum + topic.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.vocabularyCount, 0), 0)}</dd></div></dl></section>}
          <LessonFilters search={search} status={status} topicId={selectedTopicId} sort={sort} view={view} topics={selectedLevel ? (topicsByLevel.get(selectedLevel.id) || []) : []} onSearch={setSearch} onStatus={setStatus} onTopic={setSelectedTopicId} onSort={setSort} onView={setView} onRefresh={() => void loadLessons()} />
          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} onRetry={() => void loadLessons()} />}
          {!loading && !error && selectedLevel && <TopicList topics={selectedTopics} level={selectedLevel} view={view} onCreateTopic={() => setTopicModal("create")} onEditTopic={(topic) => setTopicModal(topic)} onDeleteTopic={(topic) => setDeleteTarget({ kind: "topic", topic })} onAddLesson={(topic) => void openEditor("create", topic.id)} onImport={() => setImportOpen(true)} onViewLesson={(lesson) => void openEditor(lesson)} onEditLesson={(lesson) => void openEditor(lesson)} onDuplicateLesson={(lesson) => void openEditor({ ...lesson, id: "", title: `${lesson.title} copy`, slug: `${lesson.slug}-copy`, isPublished: false })} onDeleteLesson={(lesson) => setDeleteTarget({ kind: "lesson", lesson })} />}
        </main>
      </motion.div>

      {topicModal && <TopicFormModal levels={levels} topic={topicModal === "create" ? null : topicModal} defaultLevelId={defaultLevelId} onClose={() => setTopicModal(null)} onSubmit={saveTopic} />}
      {editorLesson && <LessonEditor levels={levels} topics={selectedLevel ? (topicsByLevel.get(selectedLevel.id) || []) : []} lesson={editorLesson === "create" || editorLesson.id === "" ? null : editorLesson} detail={detail} defaultLevelId={defaultLevelId} defaultTopicId={editorTopicId} saving={saving} onClose={() => setEditorLesson(null)} onSaveLesson={saveLesson} onAddVocabulary={addVocabulary} onDeleteVocabulary={(id) => void removeVocabulary(id)} onImport={() => setImportOpen(true)} onCreateTopic={() => setTopicModal("create")} />}
      {importOpen && <ExcelImportWizard levels={levels} topics={selectedLevel ? (topicsByLevel.get(selectedLevel.id) || []) : []} defaultLevelId={defaultLevelId} defaultTopicId={selectedTopicId} defaultLessonName={detail?.title} onClose={() => setImportOpen(false)} />}
      {deleteTarget && <DeleteConfirmModal title={deleteTarget.kind === "topic" ? "Xóa chủ đề" : "Xóa bài học"} description={deleteTarget.kind === "topic" ? `Bạn sắp xóa chủ đề "${deleteTarget.topic.title}".` : `Bạn sắp xóa bài học "${deleteTarget.lesson.title}".`} facts={deleteTarget.kind === "topic" ? [{ label: "Số bài học bên trong", value: deleteTarget.topic.lessons.length }, { label: "Số từ vựng liên quan", value: deleteTarget.topic.lessons.reduce((sum, lesson) => sum + lesson.vocabularyCount, 0) }] : [{ label: "Số từ vựng", value: deleteTarget.lesson.vocabularyCount }, { label: "Số câu luyện tập", value: deleteTarget.lesson.sentenceCount }]} saving={saving} onClose={() => setDeleteTarget(null)} onConfirm={() => void confirmDelete()} />}
      {toast && <div className={`${styles.toast} ${toast.variant === "success" ? styles.toastSuccess : styles.toastError}`}><span>{toast.message}</span><button type="button" onClick={() => setToast(null)}>x</button></div>}
    </motion.div>
  )
}
