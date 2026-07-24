"use client"

import { use, useEffect, useMemo, useState, type CSSProperties } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import SharedIcon from "@/components/shared-icon"
import SiteNavbar from "@/components/site-navbar"
import api from "@/lib/api"
import type { CurriculumLesson, CurriculumResponse } from "@/types/api"
import styles from "./curriculum.module.css"

const transitionEase = [0.16, 1, 0.3, 1] as const
const lessonsPerStage = 4

const levelVisuals: Record<string, { seal: string; marks: [string, string, string] }> = {
  HSK1: { seal: "启", marks: ["你", "好", "一"] },
  HSK2: { seal: "会", marks: ["家", "买", "二"] },
  HSK3: { seal: "说", marks: ["听", "说", "三"] },
  HSK4: { seal: "进", marks: ["读", "写", "四"] },
  HSK5: { seal: "阅", marks: ["文", "章", "五"] },
  HSK6: { seal: "通", marks: ["成", "语", "六"] },
}

function lessonStatus(lesson: CurriculumLesson, isCurrent: boolean) {
  if (lesson.isLocked) return "Cần Pro"
  if (lesson.status === "completed") return "Hoàn thành"
  if (lesson.status === "in_progress" || isCurrent) return "Đang học"
  return "Chưa bắt đầu"
}

export default function LessonListPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = use(params)
  const [curriculum, setCurriculum] = useState<CurriculumResponse | null>(null)
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    let active = true

    api.get<CurriculumResponse>(`/lessons/curriculum?level=${level.toUpperCase()}`)
      .then((response) => {
        if (active) {
          setCurriculum(response.data)
          setActiveStageIndex(0)
          setError("")
        }
      })
      .catch(() => {
        if (active) setError("Không thể tải giáo trình. Hãy kiểm tra kết nối và thử lại.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [level])

  const stages = useMemo(() => {
    if (!curriculum) return []
    return Array.from(
      { length: Math.ceil(curriculum.lessons.length / lessonsPerStage) },
      (_, index) => {
        const lessons = curriculum.lessons.slice(index * lessonsPerStage, (index + 1) * lessonsPerStage)
        return {
          index,
          label: `Chặng ${index + 1}`,
          range: lessons.length
            ? `Bài ${lessons[0].lessonOrder}–${lessons[lessons.length - 1].lessonOrder}`
            : "",
          completed: lessons.filter((lesson) => lesson.status === "completed").length,
          lessons,
        }
      },
    )
  }, [curriculum])

  const activeStage = stages[Math.min(activeStageIndex, Math.max(stages.length - 1, 0))]
  const curriculumIsCurrent = curriculum?.level.type === level.toUpperCase()
  const currentLesson = curriculum?.lessons.find((lesson) => lesson.id === curriculum.currentLessonId) || null
  const levelVisual = levelVisuals[curriculum?.level.type || "HSK1"] || levelVisuals.HSK1
  const continueHref = currentLesson
    ? `/lessons/${level}/${currentLesson.id}`
    : `/lessons/${level}`

  return (
    <main className={styles.page}>
      <SiteNavbar active="lessons" />
      <div className={styles.shell}>
        {(loading || !curriculumIsCurrent) && !error && (
          <section className={styles.statePanel} aria-live="polite">
            <span className={styles.loadingMark} />
            <strong>Đang chuẩn bị giáo trình {level.toUpperCase()}…</strong>
            <p>ChineseDict đang lấy các bài học và tiến độ gần nhất của bạn.</p>
          </section>
        )}

        {!loading && error && (
          <section className={styles.statePanel} role="alert">
            <SharedIcon name="alert" size={24} />
            <strong>Chưa thể mở giáo trình</strong>
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>Thử lại</button>
          </section>
        )}

        {!loading && !error && curriculum && curriculumIsCurrent && (
          <>
            <section className={styles.overview} aria-labelledby="curriculum-title">
              <motion.div
                className={styles.overviewCopy}
                data-level={curriculum.level.type}
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReducedMotion ? 0.1 : 0.36, ease: transitionEase }}
              >
                <div className={styles.heroMarks} aria-hidden="true">
                  {levelVisual.marks.map((mark) => <span key={mark}>{mark}</span>)}
                </div>

                <div className={styles.heroCopy}>
                  <span className={styles.levelPill}>
                    <b>{levelVisual.seal}</b>
                    Giáo trình {curriculum.level.name}
                  </span>
                  <h1 id="curriculum-title">Lộ trình {curriculum.level.name}</h1>
                  <p>{curriculum.level.description || "Học từ vựng, mẫu câu và phản xạ theo từng bài rõ ràng."}</p>
                </div>

                <Image
                  className={styles.heroMascot}
                  src="/hsk-mascot.png"
                  alt=""
                  width={495}
                  height={670}
                  fetchPriority="high"
                />

                <dl className={styles.overviewStats}>
                  <motion.div
                    className={`${styles.statTile} ${styles.lessonTile}`}
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: prefersReducedMotion ? 0 : 0.08, duration: 0.32, ease: transitionEase }}
                  >
                    <Image
                      className={styles.statArtwork}
                      src="/hsk-lesson-art.png"
                      alt=""
                      width={495}
                      height={344}
                    />
                    <div><dt>Bài học</dt><dd>{curriculum.summary.totalLessons}</dd></div>
                  </motion.div>
                  <motion.div
                    className={`${styles.statTile} ${styles.wordTile}`}
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: prefersReducedMotion ? 0 : 0.14, duration: 0.32, ease: transitionEase }}
                  >
                    <Image
                      className={styles.statArtwork}
                      src="/hsk-vocabulary-art.png"
                      alt=""
                      width={478}
                      height={389}
                    />
                    <div><dt>Từ vựng</dt><dd>{curriculum.summary.totalVocabulary}</dd></div>
                  </motion.div>
                  <motion.div
                    className={`${styles.statTile} ${styles.sentenceTile}`}
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: prefersReducedMotion ? 0 : 0.2, duration: 0.32, ease: transitionEase }}
                  >
                    <Image
                      className={styles.statArtwork}
                      src="/hsk-speaking-art.png"
                      alt=""
                      width={377}
                      height={397}
                    />
                    <div><dt>Câu luyện tập</dt><dd>{curriculum.summary.totalSentences}</dd></div>
                  </motion.div>
                </dl>
              </motion.div>

              <motion.aside
                className={styles.progressSummary}
                aria-label={`Tiến độ ${curriculum.level.name}`}
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.08, duration: 0.36, ease: transitionEase }}
              >
                <div className={styles.progressHeading}>
                  <div><span>Tiến độ {curriculum.level.name}</span><strong>{curriculum.summary.progressPercent}%</strong></div>
                  <span className={styles.targetBadge} aria-hidden="true"><i /></span>
                </div>
                <div className={styles.summaryRows}>
                  <p><span>Bài đã hoàn thành</span><strong>{curriculum.summary.completedLessons}/{curriculum.summary.totalLessons}</strong></p>
                  <p><span>Hoạt động đã xong</span><strong>{curriculum.summary.completedModules}/{curriculum.summary.totalModules}</strong></p>
                </div>
                <div className={styles.progressTrack} aria-hidden="true">
                  <i style={{ "--motion-progress": curriculum.summary.progressPercent / 100 } as CSSProperties} />
                </div>
                <Link className={styles.continueButton} href={continueHref}>
                  <SharedIcon name="play" size={17} />
                  {curriculum.summary.completedModules > 0 ? "Tiếp tục học" : "Bắt đầu học"}
                </Link>
              </motion.aside>
            </section>

            <nav className={styles.levelTabs} aria-label="Chọn cấp độ HSK">
              {curriculum.levels.map((item) => {
                const active = item.type === curriculum.level.type
                return (
                  <Link
                    className={active ? styles.levelTabActive : undefined}
                    href={`/lessons/${item.type.toLowerCase()}`}
                    aria-current={active ? "page" : undefined}
                    key={item.id}
                  >
                    <span>{item.name}</span>
                    <small>{item.lessonCount} bài</small>
                  </Link>
                )
              })}
            </nav>

            <header className={styles.curriculumHeading}>
              <span><SharedIcon name="layers" size={19} /></span>
              <div>
                <h2>Các bài trong {curriculum.level.name}</h2>
                <p>Đi theo từng chặng hoặc chọn thẳng bài bạn muốn ôn.</p>
              </div>
            </header>

            {curriculum.lessons.length === 0 ? (
              <section className={styles.statePanel}>
                <SharedIcon name="bookOpen" size={24} />
                <strong>Cấp độ này chưa có bài học</strong>
                <p>Nội dung sẽ xuất hiện tại đây khi được xuất bản.</p>
              </section>
            ) : (
              <section className={styles.curriculumLayout}>
                <aside className={styles.stageRail} aria-label="Các chặng trong giáo trình">
                  <div className={styles.stageRailHeader}>
                    <span>Chặng học</span>
                    <small>Tiến độ</small>
                  </div>
                  <div className={styles.stageList}>
                    {stages.map((stage) => (
                      <button
                        className={stage.index === activeStage?.index ? styles.stageActive : undefined}
                        type="button"
                        aria-label={`${stage.label}, ${stage.range}, đã hoàn thành ${stage.completed} trên ${stage.lessons.length} bài`}
                        aria-current={stage.index === activeStage?.index ? "step" : undefined}
                        onClick={() => setActiveStageIndex(stage.index)}
                        key={stage.index}
                      >
                        <span>{stage.label} · {stage.range}</span>
                        <em>{stage.completed}/{stage.lessons.length}</em>
                      </button>
                    ))}
                  </div>
                </aside>

                <div className={styles.lessonBoard}>
                  <header className={styles.lessonBoardHeader}>
                    <div>
                      <span><SharedIcon name="bookOpen" size={18} /></span>
                      <div>
                        <h3>{activeStage?.label}</h3>
                        <p>{activeStage?.range}</p>
                      </div>
                    </div>
                    <strong>{activeStage?.completed || 0}/{activeStage?.lessons.length || 0}</strong>
                  </header>

                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      className={styles.lessonList}
                      key={activeStage?.index ?? "empty"}
                      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                      transition={{ duration: prefersReducedMotion ? 0.1 : 0.28, ease: transitionEase }}
                    >
                      {activeStage?.lessons.map((lesson) => {
                        const isCurrent = lesson.id === curriculum.currentLessonId
                        const content = (
                          <>
                            <span className={styles.lessonOrder}>
                              {lesson.status === "completed"
                                ? <SharedIcon name="check" size={18} />
                                : lesson.isLocked
                                  ? <SharedIcon name="lock" size={17} />
                                  : lesson.lessonOrder}
                            </span>
                            <div className={styles.lessonCopy}>
                              <strong>Bài {lesson.lessonOrder}: {lesson.title}</strong>
                              <span>
                                <small><SharedIcon name="bookOpen" size={13} />{lesson._count.vocabulary} từ</small>
                                <small><SharedIcon name="headphones" size={13} />{lesson._count.sentences} câu</small>
                                <small><SharedIcon name="layers" size={13} />{lesson.completedModules}/{lesson.totalModules} hoạt động</small>
                              </span>
                            </div>
                            <div className={styles.lessonState}>
                              <span>{lessonStatus(lesson, isCurrent)}</span>
                              {!lesson.isLocked && <SharedIcon name="arrowRight" size={17} />}
                            </div>
                          </>
                        )

                        return lesson.isLocked ? (
                          <article className={`${styles.lessonRow} ${styles.lessonLocked}`} key={lesson.id}>
                            {content}
                          </article>
                        ) : (
                          <Link
                            className={`${styles.lessonRow} ${isCurrent ? styles.lessonCurrent : ""} ${lesson.status === "completed" ? styles.lessonCompleted : ""}`}
                            href={`/lessons/${level}/${lesson.id}`}
                            key={lesson.id}
                          >
                            {content}
                          </Link>
                        )
                      })}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  )
}
