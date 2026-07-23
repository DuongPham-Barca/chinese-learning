"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import SiteNavbar from "@/components/site-navbar"
import LoadingSpinner from "@/components/loading-spinner"
import SharedIcon from "@/components/shared-icon"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-provider"
import type { LeaderboardUser } from "@/types/api"
import styles from "./leaderboard.module.css"

type Period = "week" | "month" | "all"
type Player = LeaderboardUser & {
  rank: number
  initials: string
  color: string
  progress: number
  current: boolean
}

const avatarColors = [
  "var(--color-avatar-1)",
  "var(--color-avatar-2)",
  "var(--color-avatar-3)",
  "var(--color-avatar-4)",
  "var(--color-avatar-5)",
  "var(--color-avatar-6)",
]

function playerColor(id: string): string {
  const hash = Array.from(id).reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return avatarColors[hash % avatarColors.length]
}

function initials(username: string): string {
  return username.trim().split(/\s+/).map((part) => part[0]).slice(-2).join("").toUpperCase() || "U"
}

function Avatar({ player, large = false }: { player: Player; large?: boolean }) {
  return (
    <span
      className={`${styles.avatar} ${large ? styles.largeAvatar : ""}`}
      style={player.avatarUrl
        ? { backgroundImage: `url(${player.avatarUrl})`, backgroundPosition: "center", backgroundSize: "cover" }
        : { background: `linear-gradient(145deg, ${player.color}, var(--color-accent-soft))` }}
    >
      {!player.avatarUrl && player.initials}
    </span>
  )
}

function PodiumMember({ player }: { player: Player }) {
  const isWinner = player.rank === 1
  return (
    <article className={`${styles.podiumMember} ${isWinner ? styles.winner : ""}`}>
      {isWinner && <SharedIcon name="crown" size={22} />}
      <div className={styles.avatarWrap}><Avatar player={player} large={isWinner} /><b>#{player.rank}</b></div>
      <h3>{player.username}</h3>
      <span>{player.level}</span>
      <strong>{player.expPoints.toLocaleString("vi-VN")} EXP</strong>
    </article>
  )
}

function LeaderboardItem({ player }: { player: Player }) {
  return (
    <article className={`${styles.listItem} ${player.current ? styles.currentRow : ""}`}>
      <b>{player.rank}</b>
      <Avatar player={player} />
      <div className={styles.playerInfo}>
        <h3>{player.username} {player.current ? <span>BẠN</span> : <span>{player.level}</span>}</h3>
        <i><em data-motion-progress style={{ "--motion-progress": player.progress / 100 } as React.CSSProperties} /></i>
      </div>
      <strong>{player.expPoints.toLocaleString("vi-VN")} EXP</strong>
    </article>
  )
}

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<Period>("all")
  const [entries, setEntries] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [showAll, setShowAll] = useState(false)
  const requestId = useRef(0)

  useEffect(() => {
    const currentRequest = ++requestId.current
    api.get<{ leaderboard: LeaderboardUser[] }>("/leaderboard", {
        params: period === "all" ? undefined : { period },
      })
      .then((response) => {
        if (currentRequest !== requestId.current) return
        setEntries(response.data.leaderboard)
        setError("")
      })
      .catch(() => {
        if (currentRequest === requestId.current) setError("Không thể tải bảng xếp hạng. Vui lòng thử lại.")
      })
      .finally(() => {
        if (currentRequest !== requestId.current) return
        setLoading(false)
        setRefreshing(false)
      })
  }, [period])

  async function refreshLeaderboard() {
    setRefreshing(true)
    const currentRequest = ++requestId.current
    try {
      const response = await api.get<{ leaderboard: LeaderboardUser[] }>("/leaderboard", {
        params: period === "all" ? undefined : { period },
      })
      if (currentRequest === requestId.current) {
        setEntries(response.data.leaderboard)
        setError("")
      }
    } catch {
      if (currentRequest === requestId.current) setError("Không thể tải bảng xếp hạng. Vui lòng thử lại.")
    } finally {
      if (currentRequest === requestId.current) setRefreshing(false)
    }
  }

  const players = useMemo<Player[]>(() => {
    const highestScore = Math.max(entries[0]?.expPoints ?? 0, 1)
    return entries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      initials: initials(entry.username),
      color: playerColor(entry.id),
      progress: Math.max(4, Math.round((entry.expPoints / highestScore) * 100)),
      current: entry.id === user?.id,
    }))
  }, [entries, user?.id])

  const podium = [players[1], players[0], players[2]].filter((player): player is Player => Boolean(player))
  const currentPlayer = players.find((player) => player.current)
  const rankedPlayers = players.slice(3, showAll ? players.length : 13)
  const tabs: Array<[Period, string]> = [["week", "7 ngày qua"], ["month", "30 ngày qua"], ["all", "Toàn thời gian"]]

  return (
    <main className={styles.page}>
      <SiteNavbar active="leaderboard" />
      {loading ? <LoadingSpinner /> : (
        <div className={styles.container} data-motion-page>
          <header className={styles.heading}>
            <div><h1>Bảng xếp hạng</h1><p>Dữ liệu EXP thực tế từ người học</p></div>
            <button type="button" className={refreshing ? styles.refreshing : ""} onClick={() => void refreshLeaderboard()} disabled={refreshing} aria-label="Làm mới"><SharedIcon name="rotateCcw" size={16} /></button>
          </header>

          <div className={styles.tabs}>{tabs.map(([key, label]) => <button type="button" className={period === key ? styles.activeTab : ""} onClick={() => { setPeriod(key); setShowAll(false) }} key={key}>{label}</button>)}</div>

          {error ? <p className={`${styles.stateMessage} ${styles.stateError}`}>{error}</p> : players.length === 0 ? (
            <p className={styles.stateMessage}>Chưa có dữ liệu EXP trong khoảng thời gian này.</p>
          ) : (
            <>
              <section className={styles.podiumCard}>{podium.map((player) => <PodiumMember player={player} key={player.id} />)}</section>

              {currentPlayer && <section className={styles.currentUser}><Avatar player={currentPlayer} /><div><h3>{currentPlayer.username} <span>BẠN</span></h3><p>Hạng #{currentPlayer.rank} · {currentPlayer.level}</p></div><strong>{currentPlayer.expPoints.toLocaleString("vi-VN")} EXP</strong></section>}

              {rankedPlayers.length > 0 && <section className={styles.list}>{rankedPlayers.map((player) => <LeaderboardItem player={player} key={player.id} />)}{players.length > 13 && <button type="button" className={styles.viewMore} onClick={() => setShowAll((value) => !value)}>{showAll ? "Thu gọn" : "Xem tất cả"}</button>}</section>}
            </>
          )}
        </div>
      )}
    </main>
  )
}
