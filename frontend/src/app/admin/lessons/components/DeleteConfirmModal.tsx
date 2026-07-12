"use client"

import { AdminButton } from "@/components/admin/admin-ui"
import { LessonModal } from "./LessonShared"
import styles from "../lessons.module.css"

export function DeleteConfirmModal({
  title,
  description,
  facts,
  saving,
  onClose,
  onConfirm,
}: {
  title: string
  description: string
  facts: Array<{ label: string; value: string | number }>
  saving: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <LessonModal title={title} onClose={onClose}>
      <div className={styles.confirmBody}>
        <p>{description}</p>
        <dl>{facts.map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
      </div>
      <div className={styles.modalActions}>
        <AdminButton secondary disabled={saving} onClick={onClose}>Hủy</AdminButton>
        <button className={styles.dangerAction} disabled={saving} onClick={onConfirm} type="button">{saving ? "Đang xóa..." : "Xóa"}</button>
      </div>
    </LessonModal>
  )
}
