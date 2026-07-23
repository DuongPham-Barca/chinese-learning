import Link from "next/link"
import SharedIcon from "@/components/shared-icon"
import SiteNavbar from "@/components/site-navbar"
import styles from "./beginner.module.css"

const steps = [
  {
    hanzi: "拼",
    pinyin: "pīn",
    title: "Pinyin — phiên âm Latin",
    detail: "Làm quen thanh mẫu, vận mẫu và cách ghép âm. Đây là nền để đọc được mọi chữ Hán.",
  },
  {
    hanzi: "声",
    pinyin: "shēng",
    title: "Thanh điệu và thanh nhẹ",
    detail: "Cùng một âm nhưng khác thanh sẽ đổi nghĩa. Luyện kỹ từ đầu để nghe và nói rõ hơn.",
  },
  {
    hanzi: "字",
    pinyin: "zì",
    title: "Chữ Hán cơ bản",
    detail: "Bắt đầu với chữ thường gặp, bộ thủ và thứ tự nét để viết đúng quy tắc.",
  },
  {
    hanzi: "词",
    pinyin: "cí",
    title: "Từ vựng HSK 1",
    detail: "Học từ trong giáo trình theo chủ đề, nghe phát âm rồi dùng lại bằng flashcard.",
  },
  {
    hanzi: "语",
    pinyin: "yǔ",
    title: "Ngữ pháp cơ bản",
    detail: "Nắm trật tự câu, câu hỏi và cách phủ định qua những mẫu câu dùng hằng ngày.",
  },
  {
    hanzi: "听",
    pinyin: "tīng",
    title: "Luyện nghe và nói",
    detail: "Nghe câu ngắn, nhại lại theo âm mẫu và tập trả lời để tạo phản xạ giao tiếp.",
  },
] as const

const routeNodes = [
  { x: 100, y: 60 },
  { x: 300, y: 110 },
  { x: 500, y: 60 },
  { x: 700, y: 110 },
  { x: 900, y: 60 },
  { x: 1100, y: 100 },
] as const

export default function BeginnerPage() {
  return (
    <main className={styles.page}>
      <SiteNavbar active="beginner" />
      <div className={styles.shell}>
        <header className={styles.pageHeader}>
          <div>
            <h1>Lộ trình cho người mới</h1>
            <p>Sáu chặng ngắn, đi từ phát âm đến phản xạ. Học theo thứ tự từ trái sang phải để không bỏ sót phần nền.</p>
          </div>
          <Link className={styles.headerAction} href="/lessons/hsk1">
            Mở giáo trình HSK 1 <SharedIcon name="arrowRight" size={16} />
          </Link>
        </header>

        <section
          className={styles.roadmapViewport}
          aria-label="Lộ trình sáu bước cho người mới bắt đầu"
        >
          <div className={styles.roadmapCanvas}>
            <svg className={styles.routeMap} viewBox="0 0 1200 150" role="img" aria-labelledby="route-title route-description">
              <title id="route-title">Đường học tiếng Trung gồm sáu bước</title>
              <desc id="route-description">Sáu mốc nối tiếp từ Pinyin, thanh điệu, chữ Hán, từ vựng, ngữ pháp đến luyện nghe và nói.</desc>
              <defs>
                <marker id="beginner-route-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                  <path className={styles.routeArrow} d="M 0 0 L 10 5 L 0 10 Z" />
                </marker>
              </defs>
              <path
                className={styles.routeLine}
                d="M 10 60 C 40 60 65 60 100 60 C 170 60 230 110 300 110 C 370 110 430 60 500 60 C 570 60 630 110 700 110 C 770 110 830 60 900 60 C 970 60 1030 100 1100 100 C 1140 100 1160 86 1180 86"
                markerEnd="url(#beginner-route-arrow)"
              />
              {routeNodes.map((node, index) => (
                <g transform={`translate(${node.x} ${node.y})`} key={`${node.x}-${node.y}`}>
                  <g className={`${styles.routeNode} ${index % 2 ? styles.routeNodeWarm : ""}`}>
                    <circle r="28" />
                    <text textAnchor="middle" dominantBaseline="central">{index + 1}</text>
                  </g>
                </g>
              ))}
            </svg>

            <ol className={styles.stepGrid}>
              {steps.map((step, index) => (
                <li className={styles.stepCard} key={step.hanzi}>
                  <div className={styles.character}>
                    <strong lang="zh-Hans">{step.hanzi}</strong>
                    <span className={styles.seal} aria-hidden="true">{index + 1}</span>
                    <small lang="zh-Latn">{step.pinyin}</small>
                  </div>
                  <h2>{step.title}</h2>
                  <p>{step.detail}</p>
                  <Link href="/lessons/hsk1" aria-label={`Vào học bước ${index + 1}: ${step.title}`}>
                    Vào học <SharedIcon name="arrowRight" size={14} />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={styles.startGuide} aria-labelledby="start-guide-title">
          <div>
            <h2 id="start-guide-title">Bắt đầu thế nào?</h2>
            <p>Đừng cố học hết trong một buổi. Hoàn thành một bước, dùng lại ngay trong bài rồi mới chuyển sang bước tiếp theo.</p>
          </div>
          <ol>
            <li><span>01</span><div><strong>Nghe trước</strong><small>Nghe âm mẫu trước khi nhìn cách viết.</small></div></li>
            <li><span>02</span><div><strong>Đọc thành tiếng</strong><small>Lặp lại câu ngắn để kiểm tra thanh điệu.</small></div></li>
            <li><span>03</span><div><strong>Ôn ngay</strong><small>Dùng flashcard và bài luyện để nhớ phần vừa học.</small></div></li>
          </ol>
          <Link href="/lessons/hsk1">
            Bắt đầu từ Pinyin <SharedIcon name="play" size={15} />
          </Link>
        </section>
      </div>
    </main>
  )
}
