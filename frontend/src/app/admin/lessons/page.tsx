"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AxiosError } from "axios"
import { motion } from "framer-motion"
import AdminIcon from "@/components/admin/admin-icons"
import { AdminButton, AdminTable, PageHeader } from "@/components/admin/admin-ui"
import { getLevels, type AdminLevel } from "@/services/admin-level.service"
import { createLesson, deleteLesson, getLessonById, getLessons, toggleLessonStatus, updateLesson, type AdminLesson, type AdminLessonDetail, type LessonPayload } from "@/services/admin-lesson.service"
import { createVocabulary, deleteVocabulary, type VocabularyPayload } from "@/services/admin-vocabulary.service"
import styles from "./lessons.module.css"

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }
const itemVariants = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const } } }
type Toast = { variant: "success" | "error"; message: string } | null
type Errors = Record<string, string>

const emptyLesson: LessonPayload = { levelId: "", title: "", slug: "", description: "", imageUrl: "", order: 1, isFree: false, isPublished: false, expReward: 10 }
const emptyVocab: VocabularyPayload = { chinese: "", pinyin: "", vietnamese: "", example: "", examplePinyin: "", exampleMeaning: "", audioUrl: "", imageUrl: "", order: 1 }

function apiMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string; error?: string } | undefined
    return data?.message || data?.error || fallback
  }
  return fallback
}
function apiErrors(error: unknown) {
  return error instanceof AxiosError ? ((error.response?.data as { errors?: Errors } | undefined)?.errors || null) : null
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value))
}
function slugify(value: string) {
  return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <><button className={styles.scrim} onClick={onClose} aria-label="Dong" /><section className={styles.modal} role="dialog" aria-modal="true"><header className={styles.modalHeader}><h2>{title}</h2><button className={styles.modalClose} onClick={onClose} type="button">x</button></header>{children}</section></>
}
function Field({ label, error, children, wide = false }: { label: string; error?: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`${styles.field} ${wide ? styles.wideField : ""}`}><span>{label}</span>{children}{error && <small>{error}</small>}</label>
}

function LessonModal({ levels, lesson, defaultLevelId, saving, onClose, onSubmit }: { levels: AdminLevel[]; lesson: AdminLesson | null; defaultLevelId: string; saving: boolean; onClose: () => void; onSubmit: (payload: LessonPayload) => Promise<Errors | null> }) {
  const [form, setForm] = useState<LessonPayload>(() => lesson ? { levelId: lesson.levelId, title: lesson.title, slug: lesson.slug, description: lesson.description || "", imageUrl: lesson.imageUrl || "", order: lesson.order, isFree: lesson.isFree, isPublished: lesson.isPublished, expReward: lesson.expReward } : { ...emptyLesson, levelId: defaultLevelId })
  const [errors, setErrors] = useState<Errors>({})
  function set<K extends keyof LessonPayload>(key: K, value: LessonPayload[K]) { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: "" })) }
  async function submit() {
    const e: Errors = {}
    if (!form.levelId) e.levelId = "Chon cap do"
    if (!form.title.trim()) e.title = "Nhap ten bai hoc"
    if (form.order < 0) e.order = "Thu tu khong duoc am"
    if (form.expReward < 0) e.expReward = "EXP khong duoc am"
    if (Object.keys(e).length) return setErrors(e)
    const result = await onSubmit({ ...form, slug: form.slug?.trim() || slugify(form.title) })
    if (result) setErrors(result)
  }
  return <Modal title={lesson ? "Sua bai hoc" : "Them bai hoc"} onClose={onClose}><div className={styles.formGrid}>
    <Field label="Cap do" error={errors.levelId}><select value={form.levelId} onChange={(e) => set("levelId", e.target.value)}><option value="">Chon cap do</option>{levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
    <Field label="Ten bai hoc" error={errors.title}><input value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>
    <Field label="Slug" error={errors.slug}><input value={form.slug || ""} placeholder="Tu sinh neu bo trong" onChange={(e) => set("slug", e.target.value)} /></Field>
    <Field label="Hinh anh" error={errors.imageUrl}><input value={form.imageUrl || ""} onChange={(e) => set("imageUrl", e.target.value)} /></Field>
    <Field label="Thu tu" error={errors.order}><input type="number" min={0} value={form.order} onChange={(e) => set("order", Number(e.target.value))} /></Field>
    <Field label="EXP" error={errors.expReward}><input type="number" min={0} value={form.expReward} onChange={(e) => set("expReward", Number(e.target.value))} /></Field>
    <Field label="Mo ta" error={errors.description} wide><textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></Field>
    <label className={styles.checkField}><input type="checkbox" checked={form.isFree} onChange={(e) => set("isFree", e.target.checked)} /> Mien phi</label>
    <label className={styles.checkField}><input type="checkbox" checked={form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} /> Xuat ban</label>
  </div><div className={styles.modalActions}><button className={styles.secondaryAction} onClick={onClose} disabled={saving} type="button">Huy</button><button className={styles.primaryAction} onClick={submit} disabled={saving} type="button">{saving ? "Dang luu..." : "Luu"}</button></div></Modal>
}

function VocabModal({ saving, onClose, onSubmit }: { saving: boolean; onClose: () => void; onSubmit: (payload: VocabularyPayload) => Promise<Errors | null> }) {
  const [form, setForm] = useState<VocabularyPayload>(emptyVocab)
  const [errors, setErrors] = useState<Errors>({})
  function set<K extends keyof VocabularyPayload>(key: K, value: VocabularyPayload[K]) { setForm((f) => ({ ...f, [key]: value })); setErrors((e) => ({ ...e, [key]: "" })) }
  async function submit() {
    const e: Errors = {}
    if (!form.chinese.trim()) e.chinese = "Nhap tieng Trung"
    if (!form.pinyin.trim()) e.pinyin = "Nhap pinyin"
    if (!form.vietnamese.trim()) e.vietnamese = "Nhap nghia"
    if (Object.keys(e).length) return setErrors(e)
    const result = await onSubmit(form)
    if (result) setErrors(result)
  }
  return <Modal title="Them tu vung" onClose={onClose}><div className={styles.formGrid}>
    <Field label="Tieng Trung" error={errors.chinese}><input value={form.chinese} onChange={(e) => set("chinese", e.target.value)} /></Field>
    <Field label="Pinyin" error={errors.pinyin}><input value={form.pinyin} onChange={(e) => set("pinyin", e.target.value)} /></Field>
    <Field label="Tieng Viet" error={errors.vietnamese}><input value={form.vietnamese} onChange={(e) => set("vietnamese", e.target.value)} /></Field>
    <Field label="Thu tu" error={errors.order}><input type="number" min={0} value={form.order} onChange={(e) => set("order", Number(e.target.value))} /></Field>
    <Field label="Vi du" wide><textarea value={form.example || ""} onChange={(e) => set("example", e.target.value)} /></Field>
  </div><div className={styles.modalActions}><button className={styles.secondaryAction} onClick={onClose} disabled={saving} type="button">Huy</button><button className={styles.primaryAction} onClick={submit} disabled={saving} type="button">{saving ? "Dang luu..." : "Luu"}</button></div></Modal>
}

export default function AdminLessonsPage() {
  const [levels, setLevels] = useState<AdminLevel[]>([])
  const [lessons, setLessons] = useState<AdminLesson[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")
  const [levelId, setLevelId] = useState("")
  const [status, setStatus] = useState("")
  const [access, setAccess] = useState("")
  const [sort, setSort] = useState("order")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState<Toast>(null)
  const [lessonModal, setLessonModal] = useState<AdminLesson | "create" | null>(null)
  const [detail, setDetail] = useState<AdminLessonDetail | null>(null)
  const [vocabOpen, setVocabOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminLesson | null>(null)
  const [saving, setSaving] = useState(false)
  const defaultLevelId = useMemo(() => levelId || levels[0]?.id || "", [levelId, levels])

  const loadLevels = useCallback(async () => { setLevels((await getLevels({ limit: 100, sort: "order" })).data) }, [])
  const loadLessons = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const response = await getLessons({ page, limit: 10, search, levelId, status, access, sort })
      setLessons(response.data); setTotal(response.pagination.total); setTotalPages(Math.max(1, response.pagination.totalPages))
    } catch (e) { setError(apiMessage(e, "Khong the tai danh sach bai hoc")) } finally { setLoading(false) }
  }, [access, levelId, page, search, sort, status])

  useEffect(() => { let active = true; queueMicrotask(() => { if (active) loadLevels().catch((e) => setToast({ variant: "error", message: apiMessage(e, "Khong the tai cap do") })) }); return () => { active = false } }, [loadLevels])
  useEffect(() => { let active = true; queueMicrotask(() => { if (active) void loadLessons() }); return () => { active = false } }, [loadLessons])

  async function saveLesson(payload: LessonPayload) {
    setSaving(true)
    try {
      if (lessonModal && lessonModal !== "create") await updateLesson(lessonModal.id, payload)
      else await createLesson(payload)
      setLessonModal(null); setToast({ variant: "success", message: "Da luu bai hoc" }); await loadLessons(); return null
    } catch (e) { setToast({ variant: "error", message: apiMessage(e, "Khong the luu bai hoc") }); return apiErrors(e) } finally { setSaving(false) }
  }
  async function openDetail(id: string) {
    try { setDetail((await getLessonById(id)).data) } catch (e) { setToast({ variant: "error", message: apiMessage(e, "Khong the tai chi tiet") }) }
  }
  async function saveVocab(payload: VocabularyPayload) {
    if (!detail) return null
    setSaving(true)
    try { await createVocabulary(detail.id, payload); setVocabOpen(false); await openDetail(detail.id); await loadLessons(); setToast({ variant: "success", message: "Da them tu vung" }); return null }
    catch (e) { setToast({ variant: "error", message: apiMessage(e, "Khong the luu tu vung") }); return apiErrors(e) } finally { setSaving(false) }
  }
  async function confirmDelete() {
    if (!deleteTarget) return
    setSaving(true)
    try { await deleteLesson(deleteTarget.id); setDeleteTarget(null); await loadLessons(); setToast({ variant: "success", message: "Da xoa bai hoc" }) }
    catch (e) { setToast({ variant: "error", message: apiMessage(e, "Khong the xoa bai hoc") }) } finally { setSaving(false) }
  }
  async function switchStatus(lesson: AdminLesson) {
    try { await toggleLessonStatus(lesson.id, { isPublished: !lesson.isPublished }); await loadLessons(); setToast({ variant: "success", message: "Da cap nhat trang thai" }) }
    catch (e) { setToast({ variant: "error", message: apiMessage(e, "Khong the cap nhat trang thai") }) }
  }

  return <motion.div variants={containerVariants} initial="hidden" animate="visible">
    <motion.div variants={itemVariants}><PageHeader eyebrow={<span>Dashboard / <b>Bai hoc</b></span>} title="Bai hoc" actions={<AdminButton icon="plus" onClick={() => setLessonModal("create")}>Them bai hoc</AdminButton>} /></motion.div>
    <motion.div variants={itemVariants}><section className={styles.tabCard}><div className={styles.tabs}><button type="button" className={`${styles.tab} ${!levelId ? styles.activeTab : ""}`} onClick={() => { setLevelId(""); setPage(1) }}>Tat ca</button>{levels.map((l) => <button key={l.id} type="button" className={`${styles.tab} ${levelId === l.id ? styles.activeTab : ""}`} onClick={() => { setLevelId(l.id); setPage(1) }}>{l.name}</button>)}</div></section></motion.div>
    <motion.div variants={itemVariants}><section className={styles.filters}><label><AdminIcon name="search" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Tim kiem theo ten bai hoc..." /></label><div><select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}><option value="">Trang thai</option><option value="published">Published</option><option value="unpublished">Draft</option></select><select value={access} onChange={(e) => { setAccess(e.target.value); setPage(1) }}><option value="">Free/Pro</option><option value="free">Free</option><option value="paid">Pro</option></select><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="order">Thu tu</option><option value="createdAt">Moi nhat</option><option value="title">Ten A-Z</option></select><button type="button" onClick={() => void loadLessons()}>Tai lai</button></div></section></motion.div>
    <motion.div variants={itemVariants}><section className={styles.tableCard}>{loading && <div className={styles.skeletonList}><span /><span /><span /></div>}{!loading && error && <div className={styles.stateBox}>{error}<button type="button" onClick={() => void loadLessons()}>Tai lai</button></div>}{!loading && !error && !lessons.length && <div className={styles.stateBox}>Chua co bai hoc.</div>}{!loading && !error && lessons.length > 0 && <><AdminTable><thead><tr><th>ID</th><th>Cap do</th><th>Thu tu</th><th>Tieu de</th><th>Noi dung</th><th>Free</th><th>Xuat ban</th><th>Cap nhat</th><th>Actions</th></tr></thead><tbody>{lessons.map((lesson) => <tr key={lesson.id}><td><b>{lesson.id.slice(0, 8)}</b></td><td><span className={styles.levelBadge}>{lesson.level.name}</span></td><td>{lesson.order}</td><td><div className={styles.lessonTitle}><strong>{lesson.title}</strong>{!lesson.isPublished && <em>DRAFT</em>}<small>{lesson.description || lesson.slug}</small></div></td><td><span className={styles.contentCounts}>{lesson.vocabularyCount} tu / {lesson.sentenceCount} cau</span></td><td>{lesson.isFree ? <span className={styles.freeYes}>Free</span> : <span className={styles.freeNo}>Pro</span>}</td><td><button className={lesson.isPublished ? styles.statusOn : styles.statusOff} onClick={() => void switchStatus(lesson)} type="button">{lesson.isPublished ? "Published" : "Draft"}</button></td><td>{formatDate(lesson.updatedAt)}</td><td><div className={styles.actions}><button type="button" onClick={() => void openDetail(lesson.id)}><AdminIcon name="eye" /></button><button type="button" onClick={() => setLessonModal(lesson)}><AdminIcon name="edit" /></button><button type="button" onClick={() => setDeleteTarget(lesson)}><AdminIcon name="alert" /></button></div></td></tr>)}</tbody></AdminTable><footer><span>Dang xem {lessons.length ? (page - 1) * 10 + 1 : 0} den {(page - 1) * 10 + lessons.length} trong so {total} bai hoc</span><div className={styles.pagination}><button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} type="button">‹</button><strong>{page}/{totalPages}</strong><button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} type="button">›</button></div></footer></>}</section></motion.div>
    {lessonModal && <LessonModal levels={levels} lesson={lessonModal === "create" ? null : lessonModal} defaultLevelId={defaultLevelId} saving={saving} onClose={() => setLessonModal(null)} onSubmit={saveLesson} />}
    {detail && <Modal title="Chi tiet bai hoc" onClose={() => setDetail(null)}><div className={styles.detailGrid}><div><span>Ten bai</span><strong>{detail.title}</strong></div><div><span>Cap do</span><strong>{detail.level.name}</strong></div><div><span>EXP</span><strong>{detail.expReward}</strong></div><div className={styles.detailWide}><span>Mo ta</span><p>{detail.description || "Chua co mo ta"}</p></div></div><div className={styles.detailToolbar}><button className={styles.primaryAction} type="button" onClick={() => setVocabOpen(true)}>Them tu vung</button></div>{!detail.vocabulary.length ? <div className={styles.stateBox}>Chua co tu vung.</div> : <AdminTable className={styles.vocabTable}><thead><tr><th>Thu tu</th><th>Tu</th><th>Nghia</th><th>Actions</th></tr></thead><tbody>{detail.vocabulary.map((v) => <tr key={v.id}><td>{v.order}</td><td><strong>{v.chinese}</strong><small>{v.pinyin}</small></td><td>{v.vietnamese}</td><td><div className={styles.actions}><button type="button" onClick={async () => { await deleteVocabulary(v.id); await openDetail(detail.id); await loadLessons() }}><AdminIcon name="alert" /></button></div></td></tr>)}</tbody></AdminTable>}</Modal>}
    {vocabOpen && <VocabModal saving={saving} onClose={() => setVocabOpen(false)} onSubmit={saveVocab} />}
    {deleteTarget && <Modal title="Xoa bai hoc" onClose={() => setDeleteTarget(null)}><div className={styles.confirmBody}>Ban co chac muon xoa &quot;{deleteTarget.title}&quot;? Toan bo tu vung thuoc bai hoc co the bi xoa theo.</div><div className={styles.modalActions}><button className={styles.secondaryAction} disabled={saving} onClick={() => setDeleteTarget(null)} type="button">Huy</button><button className={styles.dangerAction} disabled={saving} onClick={() => void confirmDelete()} type="button">{saving ? "Dang xoa..." : "Xoa"}</button></div></Modal>}
    {toast && <div className={`${styles.toast} ${toast.variant === "success" ? styles.toastSuccess : styles.toastError}`}><span>{toast.message}</span><button type="button" onClick={() => setToast(null)}>x</button></div>}
  </motion.div>
}
