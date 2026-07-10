"use client"

import type { CSSProperties, ReactNode } from "react"

export type SharedIconName = "arrowLeft" | "arrowRight" | "bookOpen" | "check" | "circle" | "clock" | "close" | "crown" | "fire" | "headphones" | "keyboard" | "layers" | "lock" | "mic" | "moreHorizontal" | "pause" | "play" | "repeat" | "rotateCcw" | "sparkles" | "star" | "target" | "translate" | "volume2" | "wand" | "zap"

const paths: Record<SharedIconName, ReactNode> = {
  arrowLeft: <><path d="m15 18-6-6 6-6" /><path d="M20 12H9" /></>,
  arrowRight: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  bookOpen: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H11V5H6.5A2.5 2.5 0 0 0 4 7.5v12Z" /><path d="M20 19.5a2.5 2.5 0 0 0-2.5-2.5H13V5h4.5A2.5 2.5 0 0 1 20 7.5v12Z" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  circle: <circle cx="12" cy="12" r="8" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  crown: <><path d="m2 6 5 12h10l5-12-6 4-4-7-4 7-6-4Z" /><path d="M7 18h10" /></>,
  fire: <path d="M12 22c4 0 7-2.8 7-7.2 0-3.4-2.2-6.4-5.4-9.3.1 2.3-.8 4-2.1 4.9.2-3.4-1.5-6.1-4-8.4.1 4-2.5 6.5-2.5 10.8C5 18.2 8 22 12 22Z" />,
  headphones: <><path d="M3 14a9 9 0 0 1 18 0" /><path d="M3 14v4a2 2 0 0 0 2 2h1v-6H3Z" /><path d="M21 14v4a2 2 0 0 1-2 2h-1v-6h3Z" /></>,
  keyboard: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h.01M11 9h.01M15 9h.01M19 9h.01M7 13h.01M11 13h.01M15 13h.01M19 13h.01M8 17h8" /></>,
  layers: <><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  mic: <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" /></>,
  moreHorizontal: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
  pause: <path d="M9 7v10M15 7v10" />,
  play: <path d="m9 7 8 5-8 5V7Z" />,
  repeat: <><path d="m17 2 4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15" /><path d="m7 22-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></>,
  rotateCcw: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v6h6" /></>,
  sparkles: <><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" /><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" /></>,
  star: <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 3Z" />,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  translate: <><path d="M3 5h12M9 3v2M5 9c1.5 3 4 5 7 6M13 9c-1.5 3-4 5-7 6" /><path d="m14 21 4-9 4 9M15.5 18h5" /></>,
  volume2: <><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15 9a4 4 0 0 1 0 6M17.8 6.2a8 8 0 0 1 0 11.6" /></>,
  wand: <><path d="M15 4V2M15 16v-2M8 9H6M20 9h-2M17.8 6.2 19.2 4.8M10.8 13.2 9.4 14.6M10.8 4.8 9.4 3.4" /><path d="m14 10-9 9-2-2 9-9 2 2Z" /></>,
  zap: <path d="M13 2 3 14h8l-1 8 11-13h-8l0-7Z" />,
}

export default function SharedIcon({ name, size = 20, color = "currentColor", strokeWidth = 1.85, className, style }: { name: SharedIconName; size?: number; color?: string; strokeWidth?: number; className?: string; style?: CSSProperties }) {
  return <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}
