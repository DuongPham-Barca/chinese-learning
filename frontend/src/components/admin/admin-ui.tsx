import type { ButtonHTMLAttributes, ReactNode } from "react"
import AdminIcon, { type AdminIconName } from "./admin-icons"
import styles from "./admin-ui.module.css"

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: ReactNode; title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return <header className={styles.pageHeader}><div>{eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}<h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{actions && <div className={styles.headerActions}>{actions}</div>}</header>
}

export function AdminButton({ children, icon, secondary = false, className = "", ...props }: { children: ReactNode; icon?: AdminIconName; secondary?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`${styles.adminButton} ${secondary ? styles.secondaryButton : ""} ${className}`} {...props}>{icon && <AdminIcon name={icon} />}{children}</button>
}

export function StatCard({ icon, label, value, meta, tone = "blue" }: { icon: AdminIconName; label: string; value: string; meta?: string; tone?: "blue" | "green" | "orange" | "red" }) {
  return <article className={`${styles.statCard} ${styles[tone]}`}><div className={styles.statTop}><i><AdminIcon name={icon} /></i>{meta && <span>{meta}</span>}</div><p>{label}</p><strong>{value}</strong></article>
}

export function AdminTable({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${styles.tableScroll} ${className}`}><table>{children}</table></div>
}

export function Pagination() {
  return <div className={styles.pagination}><button type="button">‹</button><button type="button" className={styles.activePage}>1</button><button type="button">2</button><button type="button">3</button><span>…</span><button type="button">5</button><button type="button">›</button></div>
}

export function PaymentStatusBadge({ status }: { status: "Pending" | "Approved" | "Rejected" }) {
  return <span className={`${styles.statusBadge} ${styles[status.toLowerCase()]}`}>{status}</span>
}
