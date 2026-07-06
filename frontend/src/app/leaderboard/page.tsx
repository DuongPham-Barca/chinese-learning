"use client"

import { useState, useEffect } from "react"
import SiteNavbar from "@/components/site-navbar"
import LoadingSpinner from "@/components/loading-spinner"
import styles from "./leaderboard.module.css"

type Period = "week" | "month" | "all"
type IconName = "refresh" | "trophy" | "star" | "flame" | "medal" | "badge"

type Player = { rank: number; name: string; exp: number; level: string; initials: string; color: string; progress?: number; current?: boolean }

const podium: Player[] = [
  { rank: 2, name: "LanAnh", exp: 15200, level: "HSK2", initials: "LA", color: "#60a5fa" },
  { rank: 1, name: "DuongHai", exp: 18540, level: "HSK4", initials: "DH", color: "#2563eb" },
  { rank: 3, name: "QuocBao", exp: 12100, level: "HSK5", initials: "QB", color: "#0ea5e9" },
]

const leaderboard: Player[] = [
  { rank: 4, name: "ThaoNguyen", exp: 9420, level: "HSK5", initials: "TN", color: "#38bdf8", progress: 91 },
  { rank: 5, name: "HoangPhuc", exp: 8150, level: "HSK4", initials: "HP", color: "#3b82f6", progress: 77 },
  { rank: 18, name: "MinhTran", exp: 3250, level: "HSK3", initials: "MT", color: "#2563eb", progress: 54, current: true },
  { rank: 19, name: "VietAnh", exp: 3110, level: "HSK2", initials: "VA", color: "#60a5fa", progress: 48 },
]

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    refresh: <><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v6h-6"/></>,
    trophy: <><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4"/></>,
    star: <path d="m12 2.5 2.8 5.7 6.3.9-4.5 4.4 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.5-4.4 6.3-.9L12 2.5Z"/>,
    flame: <path d="M12 22c4 0 7-2.8 7-7.2 0-3.4-2.2-6.4-5.4-9.3.1 2.3-.8 4-2.1 4.9.2-3.4-1.5-6.1-4-8.4.1 4-2.5 6.5-2.5 10.8C5 18.2 8 22 12 22Z"/>,
    medal: <><circle cx="12" cy="15" r="5"/><path d="m8 2 4 8 4-8M9 2h6"/></>,
    badge: <><path d="m12 2 2.2 2 3-.2.8 2.9 2.5 1.6-1.2 2.8 1.2 2.8-2.5 1.6-.8 2.9-3-.2-2.2 2-2.2-2-3 .2-.8-2.9-2.5-1.6 1.2-2.8-1.2-2.8 2.5-1.6.8-2.9 3 .2L12 2Z"/><path d="m9.5 11.5 1.7 1.7 3.5-3.7"/></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function Avatar({ player, large = false }: { player: Player; large?: boolean }) {
  return <span className={`${styles.avatar} ${large ? styles.largeAvatar : ""}`} style={{ background: `linear-gradient(145deg, ${player.color}, #bfdbfe)` }}>{player.initials}</span>
}

function LeaderboardHeader({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) {
  return <header className={styles.heading}><div><h1>Bảng xếp hạng</h1><p>Xếp hạng người học tích cực nhất</p></div><button type="button" className={refreshing ? styles.refreshing : ""} onClick={onRefresh} aria-label="Làm mới"><Icon name="refresh" /></button></header>
}

function LeaderboardTabs({ period, onChange }: { period: Period; onChange: (period: Period) => void }) {
  const tabs: Array<[Period, string]> = [["week", "Tuần này"], ["month", "Tháng này"], ["all", "Toàn thời gian"]]
  return <div className={styles.tabs}>{tabs.map(([key,label]) => <button type="button" className={period === key ? styles.activeTab : ""} onClick={() => onChange(key)} key={key}>{label}</button>)}</div>
}

function PodiumMember({ player }: { player: Player }) {
  const isWinner = player.rank === 1
  return <article className={`${styles.podiumMember} ${isWinner ? styles.winner : ""}`}>{isWinner && <Icon name="trophy" />}<div className={styles.avatarWrap}><Avatar player={player} large={isWinner} /><b>{player.rank === 1 ? "#1" : `#${player.rank}`}</b></div><h3>{player.name}</h3><span>{player.level}</span><strong>{player.exp.toLocaleString("en-US")} EXP</strong></article>
}

function PodiumCard() {
  return <section className={styles.podiumCard}>{podium.map((player) => <PodiumMember player={player} key={player.rank} />)}</section>
}

function CurrentUserCard() {
  const user: Player = { rank: 18, name: "MinhTran", exp: 3250, level: "HSK3", initials: "MT", color: "#2563eb" }
  return <section className={styles.currentUser}><Avatar player={user} /><div><h3>{user.name} <span>BẠN</span></h3><p>Hạng #18 <i>●</i> 15 ngày</p></div><button type="button">Xem hồ sơ</button></section>
}

function LeaderboardItem({ player }: { player: Player }) {
  return <article className={`${styles.listItem} ${player.current ? styles.currentRow : ""}`}><b>{player.rank}</b><Avatar player={player} /><div className={styles.playerInfo}><h3>{player.name} {player.current && <span>BẠN</span>} {!player.current && <span>{player.level}</span>}</h3><i><em style={{ width: `${player.progress}%` }} /></i></div><strong>{player.exp.toLocaleString("en-US")} EXP</strong></article>
}

function WeeklyChallengeCard() {
  return <section className={styles.challenge}><h2><Icon name="star" />Thử thách tuần này</h2><p>Hoàn thành 20 bài học để nhận thêm 300 EXP</p><div className={styles.challengeProgress}><span><i /></span><b>14/20</b></div><footer><span>⚡ +300 EXP</span><button type="button">Tiếp tục học</button></footer></section>
}

function AchievementCard({ icon, title, color }: { icon: IconName; title: string; color: string }) {
  return <article className={styles.achievement} style={{ color }}><Icon name={icon} /><strong>{title}</strong></article>
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>("week")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  function refresh() {
    setRefreshing(true)
    window.setTimeout(() => setRefreshing(false), 600)
  }

  return <main className={styles.page}><SiteNavbar active="leaderboard" />{loading ? <LoadingSpinner /> : <div className={styles.container}><LeaderboardHeader refreshing={refreshing} onRefresh={refresh} /><LeaderboardTabs period={period} onChange={setPeriod} /><PodiumCard /><CurrentUserCard /><section className={styles.list}>{leaderboard.map((player) => <LeaderboardItem player={player} key={player.rank} />)}<button type="button" className={styles.viewMore}>Xem tất cả</button></section><WeeklyChallengeCard /><section className={styles.achievements}><h2>Huy hiệu thành tích</h2><div><AchievementCard icon="flame" title="Chuỗi 30 ngày" color="#f59e0b" /><AchievementCard icon="medal" title="10,000 EXP" color="#2563eb" /><AchievementCard icon="badge" title="HSK3 Master" color="#16a34a" /></div></section></div>}</main>
}
