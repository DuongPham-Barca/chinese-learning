"use client"

import { use, useCallback, useEffect, useState, type CSSProperties } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { cardVariants } from "@/app/animations"
import LessonLayout from "@/components/lesson-layout"
import SharedIcon from "@/components/shared-icon"
import { useAuth } from "@/lib/auth-provider"
import api from "@/lib/api"
import { readLessonProgress, updateLessonModuleProgress } from "@/services/lesson-progress.service"
import type { Vocabulary } from "@/types/api"
import styles from "../../../lesson-flow.module.css"
import flashStyles from "./flashcard.module.css"

type SavedVocabularyItem = {
  id: string
  createdAt: string
  vocabulary: Vocabulary
}

export default function FlashcardPage({ params }: { params: Promise<{ level: string; id: string }> }) {
  const { level, id } = use(params)
  const { user, loading: authLoading } = useAuth()
  const [vocab, setVocab] = useState<Vocabulary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [current, setCurrent] = useState(() => readLessonProgress(id).flashcard?.completed ?? 0)
  const [learned, setLearned] = useState(() => readLessonProgress(id).flashcard?.completed ?? 0)
  const [flipped, setFlipped] = useState(false)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [savedLoading, setSavedLoading] = useState(true)
  const [pendingSaveId, setPendingSaveId] = useState("")
  const [saveNotice, setSaveNotice] = useState("")

  useEffect(() => {
    let active = true
    api.get<{ vocabulary: Vocabulary[] }>(`/vocabulary/${id}`)
      .then((response) => {
        if (active) setVocab(response.data.vocabulary)
      })
      .catch(() => {
        if (active) setError("Không thể tải dữ liệu thẻ từ vựng.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  useEffect(() => {
    if (authLoading) return
    if (!user) return

    let active = true
    api.get<{ savedVocabulary: SavedVocabularyItem[] }>(`/vocabulary/saved/${id}`)
      .then((response) => {
        if (active) setSavedIds(response.data.savedVocabulary.map((item) => item.vocabulary.id))
      })
      .catch(() => {
        if (active) setSaveNotice("Không thể tải danh sách từ đã lưu.")
      })
      .finally(() => {
        if (active) setSavedLoading(false)
      })

    return () => { active = false }
  }, [authLoading, id, user])

  useEffect(() => {
    if (!saveNotice) return
    const timer = window.setTimeout(() => setSaveNotice(""), 2400)
    return () => window.clearTimeout(timer)
  }, [saveNotice])

  const moveNext = useCallback(() => {
    const completed = Math.min(current + 1, vocab.length)
    updateLessonModuleProgress(id, "flashcard", completed, vocab.length)
    setLearned((value) => Math.max(value, completed))
    setCurrent((value) => value + 1)
    setFlipped(false)
  }, [current, id, vocab.length])

  const restartSession = useCallback(() => {
    window.speechSynthesis?.cancel()
    setCurrent(0)
    setLearned(0)
    setFlipped(false)
  }, [])

  const toggleSaved = useCallback(async (word: Vocabulary) => {
    if (!user) {
      setSaveNotice("Đăng nhập để lưu từ vựng vào tài khoản.")
      return
    }
    if (pendingSaveId) return

    const wasSaved = savedIds.includes(word.id)
    setPendingSaveId(word.id)
    setSavedIds((currentIds) => wasSaved
      ? currentIds.filter((savedId) => savedId !== word.id)
      : [word.id, ...currentIds])

    try {
      if (wasSaved) await api.delete(`/vocabulary/saved/${word.id}`)
      else await api.post(`/vocabulary/saved/${word.id}`)
      setSaveNotice(wasSaved ? `Đã bỏ lưu ${word.hanzi}.` : `Đã lưu ${word.hanzi}.`)
    } catch {
      setSavedIds((currentIds) => wasSaved
        ? currentIds.includes(word.id) ? currentIds : [word.id, ...currentIds]
        : currentIds.filter((savedId) => savedId !== word.id))
      setSaveNotice("Không thể cập nhật từ đã lưu. Vui lòng thử lại.")
    } finally {
      setPendingSaveId("")
    }
  }, [pendingSaveId, savedIds, user])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (current >= vocab.length) return
      if (event.key === "ArrowRight") moveNext()
      if (event.code === "Space") {
        event.preventDefault()
        setFlipped((value) => !value)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [current, moveNext, vocab.length])

  const returnHref = `/lessons/${level}/${id}`
  const card = vocab[current]
  const savedWords = user ? vocab.filter((word) => savedIds.includes(word.id)) : []

  const speak = useCallback(() => {
    if (!card) return
    if (card.audioUrl) {
      void new Audio(card.audioUrl).play()
      return
    }
    if (!("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(card.hanzi)
    utterance.lang = "zh-CN"
    utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
  }, [card])

  if (loading) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>Đang tải thẻ từ vựng...</p></div></div></LessonLayout>
  if (error || vocab.length === 0) return <LessonLayout><div className={styles.studyWrap}><div className={styles.stateCard}><p>{error || "Bài học chưa có từ vựng."}</p><Link className={styles.secondaryButton} href={returnHref}>Quay lại bài học</Link></div></div></LessonLayout>
  if (current >= vocab.length) return <LessonLayout><section className={`${styles.studyWrap} ${flashStyles.completionWrap}`}><div className={`${styles.completionCard} ${flashStyles.completionCard}`}><div className={flashStyles.completionIcon}><SharedIcon name="check" size={28} /></div><span className={flashStyles.completionLabel}>Hoàn thành</span><h2 className={styles.completionTitle}>Thẻ từ vựng & Phát âm</h2><p>Bạn đã hoàn thành toàn bộ từ vựng trong bài học này.</p><div className={flashStyles.completionSummary}><span><b>{vocab.length}</b>Từ đã học</span><span><b>{savedWords.length}</b>Từ đã lưu</span></div><div className={styles.actionRow}><button className={styles.primaryButton} type="button" onClick={restartSession}><SharedIcon name="rotateCcw" size={18} />Học lại từ đầu</button><Link className={styles.secondaryButton} href={returnHref}>Quay lại bài học</Link></div></div></section></LessonLayout>

  const progress = Math.round((learned / vocab.length) * 100)
  const remaining = Math.max(vocab.length - current - 1, 0)

  const renderSaveButton = (word: Vocabulary, compact = false) => {
    const isSaved = Boolean(user && savedIds.includes(word.id))
    return (
      <button
        type="button"
        className={`${flashStyles.saveButton} ${compact ? flashStyles.saveButtonCompact : ""} ${isSaved ? flashStyles.saveButtonActive : ""}`}
        aria-label={isSaved ? `Bỏ lưu ${word.hanzi}` : `Lưu ${word.hanzi}`}
        aria-pressed={isSaved}
        title={isSaved ? "Bỏ lưu từ này" : "Lưu từ này"}
        disabled={pendingSaveId === word.id}
        onClick={(event) => { event.stopPropagation(); void toggleSaved(word) }}
      >
        <SharedIcon name="star" size={compact ? 16 : 21} />
      </button>
    )
  }

  return (
    <LessonLayout>
      <section className={`${styles.studyWrap} ${flashStyles.flashStudyWrap}`}>
        <header className={`${styles.studyHeader} ${flashStyles.studyHeader}`}>
          <div className={`${styles.studyHeaderInner} ${flashStyles.studyHeaderInner}`}>
            <Link className={styles.iconButton} href={returnHref} aria-label="Đóng thẻ từ vựng"><SharedIcon name="close" size={18} /></Link>
            <div className={styles.studyHeaderTitle}><strong>Từ vựng {current + 1} / {vocab.length}</strong><span>Hoàn thành {progress}%</span></div>
            <button className={styles.iconButton} type="button" aria-label="Nghe phát âm mẫu" onClick={speak}><SharedIcon name="volume2" size={18} /></button>
          </div>
        <div className={styles.studyProgress} style={{ "--progress": `${progress}%` } as CSSProperties}><i data-motion-progress style={{ "--motion-progress": progress / 100 } as CSSProperties} /></div>
        </header>

        {saveNotice && <div className={flashStyles.saveNotice} role="status">{saveNotice}</div>}

        <div className={flashStyles.workspace}>
          <aside className={`${flashStyles.sidePanel} ${flashStyles.sessionPanel}`} aria-label="Tiến độ phiên học">
            <div className={flashStyles.sideHeading}><span>Tiến độ phiên</span><strong>{progress}%</strong></div>
          <div className={flashStyles.sideProgress} style={{ "--progress": `${progress}%` } as CSSProperties}><i data-motion-progress style={{ "--motion-progress": progress / 100 } as CSSProperties} /></div>
            <dl className={flashStyles.sessionStats}>
              <div><dt>Đang học</dt><dd>{current + 1}</dd></div>
              <div><dt>Đã qua</dt><dd>{current}</dd></div>
              <div><dt>Còn lại</dt><dd>{remaining}</dd></div>
              <div><dt>Đã lưu</dt><dd>{savedWords.length}</dd></div>
            </dl>
            <div className={flashStyles.wordMap} aria-label="Vị trí các từ trong phiên">
              {vocab.map((word, index) => <span key={word.id} className={`${index < current ? flashStyles.wordDone : ""} ${index === current ? flashStyles.wordCurrent : ""}`}>{index + 1}</span>)}
            </div>
          </aside>

          <main className={flashStyles.centerStage}>
            <motion.div key={card.id} className={`${styles.flashScene} ${flashStyles.flashScene} ${flipped ? styles.flipped : ""}`} variants={cardVariants} initial="hidden" animate="visible" onClick={() => setFlipped((value) => !value)} onKeyDown={(event) => { if (event.key === "Enter") setFlipped((value) => !value) }} role="button" tabIndex={0} aria-label="Lật thẻ">
              <div className={styles.flashCard}>
                <div className={`${styles.cardFace} ${flashStyles.cardFace} ${flashStyles.frontFace} ${styles.cardFront} ${card.imageUrl ? styles.cardFrontWithImage : ""}`}>
                  {renderSaveButton(card)}
                  {card.imageUrl && (
                    <div className={`${styles.flashImageWrap} ${flashStyles.flashImageWrap}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className={styles.flashImage} src={card.imageUrl} alt="" />
                    </div>
                  )}
                  <strong>{card.hanzi}</strong>
                  <small>{card.pinyin}</small>
                  <button type="button" className={`${styles.audioButton} ${flashStyles.audioButton}`} onClick={(event) => { event.stopPropagation(); speak() }} aria-label={`Phát âm ${card.hanzi}`}><SharedIcon name="volume2" size={24} /></button>
                </div>
                <div className={`${styles.cardFace} ${flashStyles.cardFace} ${flashStyles.backFace} ${styles.cardBack}`}>
                  {renderSaveButton(card)}
                  {card.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={`${styles.flashBackImage} ${flashStyles.flashBackImage}`} src={card.imageUrl} alt="" />
                  )}
                  <small>Nghĩa tiếng Việt</small>
                  <strong>{card.meaningVi}</strong>
                  <p>{card.hanzi} - {card.pinyin}</p>
                  {card.example && <em>{card.example}</em>}
                </div>
              </div>
            </motion.div>

            <div className={`${styles.studyActions} ${flashStyles.studyActions}`}>
              <button type="button" className={`${styles.choiceButton} ${styles.reviewChoice} ${flashStyles.choiceButton}`} onClick={() => setFlipped((value) => !value)}><SharedIcon name="rotateCcw" size={20} /><span><strong>Lật thẻ</strong><small>Xem nghĩa, pinyin và ví dụ</small></span></button>
              <button type="button" className={`${styles.choiceButton} ${styles.knownChoice} ${flashStyles.choiceButton}`} onClick={moveNext}><SharedIcon name="arrowRight" size={20} /><span><strong>{current + 1 < vocab.length ? "Từ tiếp theo" : "Hoàn thành"}</strong><small>Giữ tiến độ số từ đã học</small></span></button>
            </div>
          </main>

          <aside className={`${flashStyles.sidePanel} ${flashStyles.savedPanel}`} aria-label="Từ vựng đã lưu">
            <div className={flashStyles.savedHeader}><span><SharedIcon name="star" size={18} />Từ đã lưu</span><b>{savedWords.length}</b></div>
            <div className={flashStyles.savedList}>
              {authLoading ? <p className={flashStyles.savedState}>Đang tải...</p> : !user ? <p className={flashStyles.savedState}>Đăng nhập để đồng bộ từ vựng đã lưu.</p> : savedLoading ? <p className={flashStyles.savedState}>Đang tải...</p> : savedWords.length === 0 ? <p className={flashStyles.savedState}><SharedIcon name="star" size={24} />Chưa có từ nào được lưu.</p> : savedWords.map((word) => {
                const wordIndex = vocab.findIndex((item) => item.id === word.id)
                return <div className={`${flashStyles.savedItem} ${word.id === card.id ? flashStyles.savedItemActive : ""}`} key={word.id}><button type="button" onClick={() => { setCurrent(wordIndex); setFlipped(false) }}><strong>{word.hanzi}</strong><span>{word.pinyin}</span><small>{word.meaningVi}</small></button>{renderSaveButton(word, true)}</div>
              })}
            </div>
          </aside>
        </div>
      </section>
    </LessonLayout>
  )
}
