"use client"

/* eslint-disable @next/next/no-img-element */
import { useRef, type CSSProperties, type ReactNode } from "react"
import AdminIcon, { type AdminIconName } from "@/components/admin/admin-icons"
import type { AdminLevel } from "@/services/admin-level.service"
import { getHskMeta } from "./lesson-model"
import syncStyles from "../client-sync.module.css"
import styles from "../lessons.module.css"

export function HskBadge({ level }: { level: AdminLevel | { name: string; slug?: string; order?: number } }) {
  const meta = getHskMeta(level)
  return <span className={styles.hskBadge} style={{ "--accent": meta.accent, "--soft": meta.soft } as CSSProperties}>{level.name || meta.label}</span>
}

export function StatusBadge({ published, label }: { published: boolean; label?: string }) {
  return <span className={`${styles.statusBadge} ${published ? styles.publishedBadge : styles.draftBadge}`}>{label || (published ? "Đã xuất bản" : "Bản nháp")}</span>
}

export function IconButton({ icon, label, onClick, danger = false }: { icon: AdminIconName; label: string; onClick: () => void; danger?: boolean }) {
  return <button type="button" className={`${styles.iconButton} ${danger ? styles.dangerIcon : ""}`} title={label} aria-label={label} onClick={onClick}><AdminIcon name={icon} /></button>
}

export function LessonModal({ title, size = "md", onClose, children }: { title: string; size?: "md" | "lg" | "xl"; onClose: () => void; children: ReactNode }) {
  return (
    <>
      <button className={styles.scrim} onClick={onClose} aria-label="Đóng modal" />
      <section className={`${styles.modal} ${styles[`modal${size.toUpperCase()}`]} ${syncStyles.clientModal}`} role="dialog" aria-modal="true">
        <header className={styles.modalHeader}>
          <h2>{title}</h2>
          <button className={styles.modalClose} onClick={onClose} type="button" aria-label="Đóng">x</button>
        </header>
        {children}
      </section>
    </>
  )
}

export function Field({ label, helper, error, children, wide = false }: { label: string; helper?: string; error?: string; children: ReactNode; wide?: boolean }) {
  return <label className={`${styles.field} ${wide ? styles.wideField : ""}`}><span>{label}</span>{children}{helper && <em>{helper}</em>}{error && <small>{error}</small>}</label>
}

export function UploadDropzone({ title, helper, previewUrl, compact = false, onFile }: { title: string; helper: string; previewUrl?: string; compact?: boolean; onFile?: (file: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className={`${styles.uploadDropzone} ${syncStyles.clientSoftBox} ${compact ? styles.compactDropzone : ""}`} onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) onFile?.(file); event.target.value = "" }} />
      {previewUrl ? <img src={previewUrl} alt="" /> : <i><AdminIcon name="upload" /></i>}
      <div>
        <strong>{title}</strong>
        <span>{helper}</span>
        <div className={styles.uploadActions}>
          <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}>Chọn file</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}>Thay ảnh</button>
          {previewUrl && <button type="button" onClick={(e) => { e.stopPropagation(); onFile?.(null) }}>Xóa</button>}
        </div>
      </div>
    </div>
  )
}

export function EmptyState({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <div className={`${styles.emptyState} ${syncStyles.clientSoftBox}`}><i className={syncStyles.clientIconBubble}><AdminIcon name="book" /></i><h3>{title}</h3><p>{description}</p>{actions && <div>{actions}</div>}</div>
}

export function LoadingState() {
  return <div className={styles.skeletonList}><span /><span /><span /></div>
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className={styles.stateBox}><strong>Không thể tải dữ liệu</strong><p>{message}</p><button type="button" onClick={onRetry}>Tải lại</button></div>
}
