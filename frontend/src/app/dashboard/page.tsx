"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import SharedIcon, { type SharedIconName } from "@/components/shared-icon"
import SiteNavbar from "@/components/site-navbar"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-provider"
import type { LeaderboardUser, LessonSummary } from "@/types/api"
import styles from "./dashboard.module.css"

type ProgressEntry = {
  id: string
  status: string
  expGained: number
  createdAt: string
  lesson: {
    id: string
    title: string
    levelType: string
    lessonOrder: number
  }
}

const quickModes: Array<{ label: string; detail: string; path: string; icon: SharedIconName }> = [
  { label: "Flashcard", detail: "Ôn từ cần nhớ", path: "flashcard", icon: "layers" },
  { label: "Nghe chép", detail: "Rèn tai và chính tả", path: "dictation", icon: "headphones" },
  { label: "Phản xạ", detail: "Trả lời nhanh", path: "reflex", icon: "zap" },
  { label: "Trắc nghiệm", detail: "Kiểm tra ngắn", path: "quiz", icon: "target" },
]

function calculateStreak(entries: ProgressEntry[]) {
  const days = new Set(entries.map((entry) => new Date(entry.createdAt).toISOString().slice(0, 10)))
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function calculateLongestStreak(entries: ProgressEntry[]) {
  const days = Array.from(new Set(entries.map((entry) => new Date(entry.createdAt).toISOString().slice(0, 10)))).sort()
  if (days.length === 0) return 0

  let longest = 1
  let current = 1
  for (let index = 1; index < days.length; index += 1) {
    const previous = new Date(`${days[index - 1]}T00:00:00.000Z`)
    const next = new Date(`${days[index]}T00:00:00.000Z`)
    const difference = Math.round((next.getTime() - previous.getTime()) / 86_400_000)
    current = difference === 1 ? current + 1 : 1
    longest = Math.max(longest, current)
  }
  return longest
}

function initials(username: string) {
  return username.trim().split(/\s+/).map((part) => part[0]).slice(-2).join("").toUpperCase() || "U"
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [lessons, setLessons] = useState<LessonSummary[]>([])
  const [entries, setEntries] = useState<ProgressEntry[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login?next=/dashboard")
      return
    }

    let active = true

    Promise.all([
      api.get<{ lessons: LessonSummary[] }>(`/lessons?level=${user.level}`),
      api.get<{ progress: ProgressEntry[] }>("/progress/me").catch(() => ({ data: { progress: [] } })),
      api.get<{ leaderboard: LeaderboardUser[] }>("/leaderboard").catch(() => ({ data: { leaderboard: [] } })),
    ])
      .then(([lessonResponse, progressResponse, leaderboardResponse]) => {
        if (!active) return
        setLessons(lessonResponse.data.lessons)
        setEntries(progressResponse.data.progress)
        setLeaderboard(leaderboardResponse.data.leaderboard)
      })
      .catch(() => {
        if (active) setError("Không thể tải không gian học. Hãy kiểm tra kết nối và thử lại.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [authLoading, router, user])

  const currentLevel = user?.level
  const currentLesson = useMemo(() => {
    const latestAtLevel = entries.find((entry) => entry.lesson.levelType === currentLevel)
    return lessons.find((lesson) => lesson.id === latestAtLevel?.lesson.id)
      || lessons.find((lesson) => !lesson.isLocked)
      || null
  }, [currentLevel, entries, lessons])

  const streak = useMemo(() => calculateStreak(entries), [entries])
  const longestStreak = useMemo(() => calculateLongestStreak(entries), [entries])
  const earnedExp = useMemo(() => entries.reduce((total, entry) => total + entry.expGained, 0), [entries])
  const todayEntries = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return entries.filter((entry) => new Date(entry.createdAt).toISOString().slice(0, 10) === today)
  }, [entries])
  const todayExp = useMemo(() => todayEntries.reduce((total, entry) => total + entry.expGained, 0), [todayEntries])
  const weekDays = useMemo(() => {
    const activityDates = new Set(entries.map((entry) => new Date(entry.createdAt).toISOString().slice(0, 10)))
    const dayLabels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"]

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (6 - index))
      const key = date.toISOString().slice(0, 10)
      return {
        key,
        label: dayLabels[date.getDay()],
        completed: activityDates.has(key),
        today: index === 6,
      }
    })
  }, [entries])
  const availableLessons = lessons.filter((lesson) => !lesson.isLocked)
  const dailyChallenges = [
    { label: "Hoàn thành hoạt động đầu tiên", icon: "play" as SharedIconName, value: Math.min(todayEntries.length, 1), target: 1 },
    { label: "Hoàn thành 3 hoạt động", icon: "target" as SharedIconName, value: Math.min(todayEntries.length, 3), target: 3 },
    { label: "Tích lũy 50 EXP hôm nay", icon: "zap" as SharedIconName, value: Math.min(todayExp, 50), target: 50 },
  ]
  const completedChallenges = dailyChallenges.filter((challenge) => challenge.value >= challenge.target).length
  const leaderboardRows = (() => {
    const topThree = leaderboard.slice(0, 3)
    const currentPlayer = leaderboard.find((player) => player.id === user?.id)
    return currentPlayer && !topThree.some((player) => player.id === currentPlayer.id)
      ? [...topThree, currentPlayer]
      : leaderboard.slice(0, 4)
  })()
  const levelHref = `/lessons/${user?.level.toLowerCase() || "hsk1"}`
  const currentHref = currentLesson ? `/lessons/${currentLesson.levelType.toLowerCase()}/${currentLesson.id}` : levelHref

  if (authLoading || loading || !user) {
    return (
      <main className={styles.page}>
        <SiteNavbar />
        <div className={styles.shell}>
          <div className={styles.loadingState} aria-live="polite">
            <span className={styles.loadingMark} />
            <strong>Đang chuẩn bị buổi học của bạn…</strong>
            <p>ChineseDict đang lấy bài học và tiến độ gần nhất.</p>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className={styles.page}>
        <SiteNavbar />
        <div className={styles.shell}>
          <div className={styles.errorState} role="alert">
            <SharedIcon name="alert" size={26} />
            <h1>Chưa thể mở không gian học</h1>
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>Thử lại</button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <SiteNavbar active="dashboard" />
      <div className={styles.shell}>
        <header className={styles.welcome}>
          <div>
            <h1>Chào {user.username}</h1>
            <p>Chọn một hoạt động hoặc tiếp tục bài gần nhất của bạn.</p>
          </div>
          <Link className={styles.levelControl} href={`/lessons/${user.level.toLowerCase()}`}>
            <span>Trình độ hiện tại</span>
            <strong>{user.level}</strong>
            <SharedIcon name="arrowRight" size={18} />
          </Link>
        </header>

        <div className={styles.dashboardLayout}>
          <div className={styles.mainColumn}>
            <section className={styles.workbench} aria-label="Tiếp tục học">
              <div className={styles.focusCard}>
            <div className={styles.focusTopline}>
              <span><i />NÊN HỌC TIẾP</span>
              <small>Mục tiêu {user.dailyTarget} phút/ngày</small>
            </div>

            <div className={styles.focusLayout}>
              <div>
                {currentLesson ? (
                  <>
                    <div className={styles.focusBody}>
                      <div className={styles.lessonIndex}>{currentLesson.lessonOrder.toString().padStart(2, "0")}</div>
                      <div>
                        <span>{currentLesson.levelType} · Bài {currentLesson.lessonOrder}</span>
                        <h2>{currentLesson.title}</h2>
                        <p>{currentLesson._count.vocabulary} từ vựng và {currentLesson._count.sentences} câu luyện tập đang chờ bạn.</p>
                      </div>
                    </div>
                    <div className={styles.focusActions}>
                      <Link className={styles.primaryAction} href={currentHref}>
                        <SharedIcon name="play" size={18} />Bắt đầu học
                      </Link>
                      <Link className={styles.secondaryAction} href={`/lessons/${user.level.toLowerCase()}`}>
                        Chọn bài khác
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className={styles.noLesson}>
                    <h2>Chưa có bài học khả dụng</h2>
                    <p>Giáo trình {user.level} đang được cập nhật. Bạn có thể chọn cấp độ khác để bắt đầu.</p>
                    <Link className={styles.primaryAction} href={levelHref}>Chọn giáo trình</Link>
                  </div>
                )}
              </div>
              <div className={styles.focusVisual} aria-hidden="true">
                <span>学</span>
                <i>听</i>
                <b>说</b>
              </div>
            </div>
              </div>
            </section>

            <section className={styles.statsGrid} aria-label="Thống kê học tập">
          <article>
            <span><SharedIcon name="bookOpen" size={18} />Hoạt động đã học</span>
            <strong>{entries.length}</strong>
            <small>Dữ liệu từ lịch sử học của bạn</small>
          </article>
          <article>
            <span><SharedIcon name="zap" size={18} />EXP tích lũy</span>
            <strong>{earnedExp.toLocaleString("vi-VN")}</strong>
            <small>EXP nhận từ các bài đã hoàn thành</small>
          </article>
          <article>
            <span><SharedIcon name="layers" size={18} />Bài đang mở</span>
            <strong>{availableLessons.length}<em>/{lessons.length}</em></strong>
            <small>Trong giáo trình {user.level}</small>
          </article>
          <Link href="/settings">
            <span><SharedIcon name="target" size={18} />Mục tiêu mỗi ngày</span>
            <strong>{user.dailyTarget}<em> phút</em></strong>
            <small>Điều chỉnh mục tiêu học</small>
          </Link>
            </section>

            <section className={styles.quickSection} aria-labelledby="quick-title">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="quick-title">Vào học nhanh</h2>
              <p>Dùng lại bài hiện tại theo cách phù hợp với mục tiêu lúc này.</p>
            </div>
          </div>
          <div className={styles.quickGrid}>
            {quickModes.map((mode) => currentLesson ? (
              <Link key={mode.path} href={`${currentHref}/${mode.path}`} className={styles.quickCard}>
                <i><SharedIcon name={mode.icon} size={22} /></i>
                <span><strong>{mode.label}</strong><small>{mode.detail}</small></span>
                <SharedIcon name="arrowRight" size={17} />
              </Link>
            ) : (
              <span key={mode.path} className={`${styles.quickCard} ${styles.quickCardDisabled}`} aria-disabled="true">
                <i><SharedIcon name={mode.icon} size={22} /></i>
                <span><strong>{mode.label}</strong><small>Chọn bài học trước</small></span>
              </span>
            ))}
          </div>
            </section>

            <section className={styles.lessonSection} aria-labelledby="lesson-title">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="lesson-title">Các bài trong {user.level}</h2>
              <p>Chọn một bài khác khi bạn muốn đổi chủ đề.</p>
            </div>
            <Link href={`/lessons/${user.level.toLowerCase()}`}>Xem tất cả <SharedIcon name="arrowRight" size={16} /></Link>
          </div>
          <div className={styles.lessonRail}>
            {lessons.slice(0, 4).map((lesson) => lesson.isLocked ? (
              <article className={`${styles.lessonRow} ${styles.lessonRowLocked}`} key={lesson.id}>
                <span>{lesson.lessonOrder}</span>
                <div><strong>{lesson.title}</strong><small>{lesson._count.vocabulary} từ · {lesson._count.sentences} câu</small></div>
                <span className={styles.lockLabel}><SharedIcon name="lock" size={14} />Pro</span>
              </article>
            ) : (
              <Link className={styles.lessonRow} href={`/lessons/${lesson.levelType.toLowerCase()}/${lesson.id}`} key={lesson.id}>
                <span>{lesson.lessonOrder}</span>
                <div><strong>{lesson.title}</strong><small>{lesson._count.vocabulary} từ · {lesson._count.sentences} câu</small></div>
                <SharedIcon name="arrowRight" size={17} />
              </Link>
            ))}
          </div>
            </section>
          </div>

          <aside className={styles.rightRail} aria-label="Nhịp học và bảng xếp hạng">
            <section className={styles.todayPanel} aria-labelledby="streak-title">
              <div className={styles.railHeading}>
                <span id="streak-title"><SharedIcon name="fire" size={18} />Streak của bạn</span>
              </div>
              <div className={styles.streakSummary}>
                <div className={styles.streakFlame}><SharedIcon name="fire" size={24} /></div>
                <div><strong>{streak}</strong><span>ngày liên tiếp</span><small>{streak > 0 ? "Giữ vững nhịp học nhé." : "Bắt đầu chuỗi học hôm nay."}</small></div>
              </div>
              <div className={styles.weekStrip}>
                {weekDays.map((day) => (
                  <span className={`${day.completed ? styles.dayComplete : ""} ${day.today ? styles.dayToday : ""}`} key={day.key}>
                    <small>{day.label}</small>
                    <i><SharedIcon name={day.completed ? "check" : "circle"} size={13} /></i>
                  </span>
                ))}
              </div>
              <Link className={styles.railFooterLink} href="/progress">
                <span><SharedIcon name="crown" size={15} />Kỷ lục: {longestStreak} ngày</span>
                <SharedIcon name="arrowRight" size={15} />
              </Link>
            </section>

            <section className={styles.challengeCard} aria-labelledby="challenge-title">
              <div className={styles.railHeading}>
                <span id="challenge-title"><SharedIcon name="target" size={18} />Thử thách hằng ngày</span>
                <strong>{completedChallenges}/{dailyChallenges.length}</strong>
              </div>
              <div className={styles.challengeList}>
                {dailyChallenges.map((challenge) => {
                  const complete = challenge.value >= challenge.target
                  const progress = Math.round((challenge.value / challenge.target) * 100)
                  return (
                    <div className={`${styles.challengeRow} ${complete ? styles.challengeComplete : ""}`} key={challenge.label}>
                      <i><SharedIcon name={complete ? "check" : challenge.icon} size={17} /></i>
                      <div>
                        <span><strong>{challenge.label}</strong><small>{challenge.value}/{challenge.target}</small></span>
                        <b><em data-motion-progress style={{ "--motion-progress": progress / 100 } as React.CSSProperties} /></b>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p>{completedChallenges === dailyChallenges.length ? "Bạn đã hoàn thành đủ thử thách hôm nay." : `Còn ${dailyChallenges.length - completedChallenges} thử thách để hoàn tất hôm nay.`}</p>
            </section>

            <section className={styles.leaderboardCard} aria-labelledby="leaderboard-title">
              <div className={styles.railHeading}>
                <span id="leaderboard-title"><SharedIcon name="crown" size={18} />Bảng xếp hạng</span>
                <Link href="/leaderboard">Xem tất cả <SharedIcon name="arrowRight" size={14} /></Link>
              </div>
              {leaderboardRows.length > 0 ? (
                <div className={styles.leaderboardList}>
                  {leaderboardRows.map((player) => {
                    const rank = leaderboard.findIndex((entry) => entry.id === player.id) + 1
                    const current = player.id === user.id
                    return (
                      <div className={`${styles.leaderboardRow} ${current ? styles.currentPlayer : ""}`} key={player.id}>
                        <b>{rank}</b>
                        <span
                          className={styles.leaderAvatar}
                          style={player.avatarUrl ? { backgroundImage: `url(${player.avatarUrl})` } : undefined}
                        >
                          {!player.avatarUrl && initials(player.username)}
                        </span>
                        <div><strong>{player.username}{current ? " (Bạn)" : ""}</strong><small>{player.level}</small></div>
                        <em>{player.expPoints.toLocaleString("vi-VN")} EXP</em>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className={styles.leaderboardEmpty}>Chưa có dữ liệu xếp hạng.</p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
