"use client"

import Link from "next/link"
import { motion } from "framer-motion"

function BrokenBridgeIllustration() {
  return (
    <svg viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[340px] md:max-w-[400px] h-auto">
      {/* Shadow ground */}
      <ellipse cx="200" cy="258" rx="150" ry="14" fill="#E8E0D0" opacity="0.35" />

      {/* ---- Character 1 (standing, left side) ---- */}
      {/* Shadow */}
      <ellipse cx="108" cy="248" rx="36" ry="8" fill="#C5BBA8" opacity="0.25" />
      {/* Body */}
      <rect x="82" y="188" width="52" height="54" rx="26" fill="#A7C7E7" />
      {/* Body highlight */}
      <rect x="88" y="194" width="40" height="32" rx="16" fill="#BFDAF5" opacity="0.5" />
      {/* Head */}
      <circle cx="108" cy="168" r="32" fill="#A7C7E7" />
      {/* Head highlight */}
      <circle cx="108" cy="168" r="28" fill="#BFDAF5" opacity="0.35" />
      {/* Face highlight */}
      <ellipse cx="108" cy="172" rx="18" ry="14" fill="#D2E6FA" opacity="0.4" />
      {/* Eyes */}
      <ellipse cx="98" cy="164" rx="3.5" ry="4" fill="#4A5B7A" />
      <ellipse cx="118" cy="164" rx="3.5" ry="4" fill="#4A5B7A" />
      {/* Eye shine */}
      <circle cx="99.5" cy="162.5" r="1.2" fill="white" />
      <circle cx="119.5" cy="162.5" r="1.2" fill="white" />
      {/* Blush */}
      <ellipse cx="93" cy="175" rx="5" ry="3" fill="#F5A9A9" opacity="0.3" />
      <ellipse cx="123" cy="175" rx="5" ry="3" fill="#F5A9A9" opacity="0.3" />
      {/* Mouth - slight sad */}
      <path d="M103 173 Q108 170 113 173" stroke="#4A5B7A" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Arm reaching toward bridge */}
      <path d="M134 200 Q148 190 152 182" stroke="#8EB8D9" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M134 200 Q148 190 152 182" stroke="#A7C7E7" strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* Legs */}
      <path d="M96 240 L92 252" stroke="#8EB8D9" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M120 240 L124 252" stroke="#8EB8D9" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M96 240 L92 252" stroke="#A7C7E7" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M120 240 L124 252" stroke="#A7C7E7" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* ---- Character 2 (lifting bridge, right side) ---- */}
      {/* Shadow */}
      <ellipse cx="298" cy="250" rx="34" ry="8" fill="#C5BBA8" opacity="0.25" />
      {/* Body */}
      <rect x="272" y="188" width="48" height="54" rx="24" fill="#A7C7E7" />
      {/* Body highlight */}
      <rect x="278" y="194" width="36" height="30" rx="15" fill="#BFDAF5" opacity="0.5" />
      {/* Head */}
      <circle cx="296" cy="170" r="30" fill="#A7C7E7" />
      {/* Head highlight */}
      <circle cx="296" cy="170" r="26" fill="#BFDAF5" opacity="0.35" />
      {/* Face highlight */}
      <ellipse cx="296" cy="174" rx="17" ry="13" fill="#D2E6FA" opacity="0.4" />
      {/* Eyes - determined look */}
      <ellipse cx="287" cy="166" rx="3.2" ry="3.8" fill="#4A5B7A" />
      <ellipse cx="305" cy="166" rx="3.2" ry="3.8" fill="#4A5B7A" />
      {/* Eye shine */}
      <circle cx="288.5" cy="164.5" r="1.1" fill="white" />
      <circle cx="306.5" cy="164.5" r="1.1" fill="white" />
      {/* Blush */}
      <ellipse cx="282" cy="177" rx="4.5" ry="2.8" fill="#F5A9A9" opacity="0.3" />
      <ellipse cx="310" cy="177" rx="4.5" ry="2.8" fill="#F5A9A9" opacity="0.3" />
      {/* Mouth - determined */}
      <path d="M291 175 Q296 171 301 175" stroke="#4A5B7A" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* Arms lifting up */}
      <path d="M272 200 Q258 178 254 168" stroke="#8EB8D9" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M272 200 Q258 178 254 168" stroke="#A7C7E7" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M320 200 Q334 178 338 168" stroke="#8EB8D9" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M320 200 Q334 178 338 168" stroke="#A7C7E7" strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* Legs */}
      <path d="M286 240 L282 252" stroke="#8EB8D9" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M306 240 L310 252" stroke="#8EB8D9" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M286 240 L282 252" stroke="#A7C7E7" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M306 240 L310 252" stroke="#A7C7E7" strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* ---- Broken Bridge ---- */}
      {/* Left arch fragment */}
      <path d="M148 180 Q158 148 175 142" stroke="#D4C9B0" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M148 180 Q158 148 175 142" stroke="#EAE0C8" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Right arch fragment */}
      <path d="M258 168 Q268 142 280 136" stroke="#D4C9B0" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M258 168 Q268 142 280 136" stroke="#EAE0C8" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Fallen bridge piece 1 */}
      <g transform="translate(182, 188) rotate(-25)">
        <rect x="-2" y="-10" width="22" height="16" rx="4" fill="#D4C9B0" opacity="0.8" />
        <rect x="-2" y="-10" width="22" height="16" rx="4" fill="#EAE0C8" opacity="0.4" />
      </g>

      {/* Fallen bridge piece 2 */}
      <g transform="translate(228, 182) rotate(18)">
        <rect x="-2" y="-10" width="22" height="16" rx="4" fill="#D4C9B0" opacity="0.8" />
        <rect x="-2" y="-10" width="22" height="16" rx="4" fill="#EAE0C8" opacity="0.4" />
      </g>

      {/* Fallen bridge piece 3 */}
      <g transform="translate(198, 206) rotate(-12)">
        <rect x="-2" y="-10" width="20" height="14" rx="4" fill="#D4C9B0" opacity="0.7" />
        <rect x="-2" y="-10" width="20" height="14" rx="4" fill="#EAE0C8" opacity="0.35" />
      </g>

      {/* Chinese characters on bridge pieces */}
      <text x="195" y="186" textAnchor="middle" fontSize="10" fill="#B8AD94" fontWeight="600" transform="rotate(-25, 195, 186)">学</text>
      <text x="240" y="180" textAnchor="middle" fontSize="10" fill="#B8AD94" fontWeight="600" transform="rotate(18, 240, 180)">汉</text>
      <text x="209" y="206" textAnchor="middle" fontSize="9" fill="#B8AD94" fontWeight="600" transform="rotate(-12, 209, 206)">语</text>

      {/* Small scattered fragments */}
      <rect x="168" y="206" width="8" height="6" rx="2" fill="#D4C9B0" opacity="0.5" transform="rotate(-30, 172, 209)" />
      <rect x="248" y="192" width="7" height="5" rx="2" fill="#D4C9B0" opacity="0.5" transform="rotate(22, 252, 194)" />
      <text x="172" y="210" textAnchor="middle" fontSize="6" fill="#B8AD94" fontWeight="600" transform="rotate(-30, 172, 210)">中</text>
      <text x="250" y="195" textAnchor="middle" fontSize="6" fill="#B8AD94" fontWeight="600" transform="rotate(22, 250, 195)">文</text>

      {/* Small debris dots */}
      <circle cx="164" cy="194" r="1.5" fill="#D4C9B0" opacity="0.4" />
      <circle cx="256" cy="178" r="1.5" fill="#D4C9B0" opacity="0.4" />
      <circle cx="178" cy="214" r="1.2" fill="#D4C9B0" opacity="0.3" />
      <circle cx="236" cy="200" r="1.2" fill="#D4C9B0" opacity="0.3" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  )
}

const decorationIcons = [
  { label: "学", icon: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3L2 9L12 15L22 9L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M2 15L12 21L22 15" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M2 12L12 18L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )},
  { label: "书", icon: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )},
  { label: "笔", icon: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )},
]

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FFFCF5] px-6">
      <div className="flex flex-col items-center text-center w-full max-w-[650px]">

        {/* Illustration */}
        <motion.div
          className="mb-8 md:mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <BrokenBridgeIllustration />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-[32px] md:text-[44px] lg:text-[48px] font-extrabold text-[#0F172A] leading-tight mb-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          404 - Không tìm thấy trang
        </motion.h1>

        {/* Description */}
        <motion.p
          className="text-[16px] md:text-[17px] text-[#64748B] leading-relaxed max-w-[520px] mb-9 md:mb-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          Có vẻ như bạn đã đi lạc trong thế giới tiếng Trung.
          <br />
          Đừng lo lắng, chúng tôi sẽ giúp bạn quay lại đúng lộ trình học tập.
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2.5 h-12 sm:h-[50px] px-7 sm:px-8 w-full sm:w-auto rounded-[999px] bg-[#2563EB] text-white text-[15px] font-bold shadow-[0_8px_24px_rgba(37,99,235,0.2)] hover:bg-[#1D4ED8] hover:scale-[1.02] transition-all duration-250"
          >
            <HomeIcon />
            Quay lại Trang chủ
          </Link>
          <a
            href="mailto:support@chinesedict.com"
            className="inline-flex items-center justify-center gap-2.5 h-12 sm:h-[50px] px-7 sm:px-8 w-full sm:w-auto rounded-[999px] bg-white border border-[#DCE7FF] text-[#2563EB] text-[15px] font-bold hover:bg-[#EEF6FF] hover:scale-[1.02] transition-all duration-250"
          >
            <FlagIcon />
            Báo cáo lỗi
          </a>
        </motion.div>

        {/* Bottom Decoration */}
        <motion.div
          className="flex items-center justify-center gap-6 mt-14 md:mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.8 }}
        >
          {decorationIcons.map((item) => (
            <span key={item.label} className="text-[#2563EB] opacity-30">
              {item.icon}
            </span>
          ))}
        </motion.div>

      </div>
    </main>
  )
}
