import { useEffect, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import CodeRain from './CodeRain.jsx'
import { useT } from '../i18n/index.js'

// ============================================================
//  인트로 — 시네마틱 영상(public/intro.mp4) → 글리치 타이틀 + 잭인.
//  영상은 CRT/글리치 오버레이로 게임 룩과 통일. 아무 곳이나 클릭 / Enter·Space·Esc 스킵.
//  (자동재생 정책상 muted로 재생 — 소리를 넣으려면 시작 게이트가 필요.)
// ============================================================

// 영상이 이 시간 안에 재생을 시작하지 못하면 그냥 타이틀로 넘어간다.
// 영상은 분위기를 위한 것이지 게임의 전제 조건이 아니다 — 느린 회선이나 자동재생
// 차단 때문에 검은 화면에 갇히면 플레이어는 "게임이 안 열린다"고 느낀다
// (itch.io 첫 댓글: "It wouldn't load for me. Timed out.").
export const VIDEO_START_TIMEOUT_MS = 4000

export default function IntroSequence({ onDone }) {
  const t = useT()
  const [stage, setStage] = useState('video') // 'video' | 'title'
  const [exiting, setExiting] = useState(false)
  const doneRef = useRef(false)
  const videoRef = useRef(null)

  function finish() {
    if (doneRef.current) return
    doneRef.current = true
    setExiting(true)
    setTimeout(() => onDone?.(), 450)
  }
  // 영상 클릭/스킵 → 타이틀로. 타이틀에서 스킵 → 종료.
  function skip() {
    if (stage === 'video') {
      videoRef.current?.pause()
      setStage('title')
    } else {
      finish()
    }
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') skip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage])

  // 영상이 제때 시작하지 못하면 기다리지 않고 타이틀로 넘어간다.
  useEffect(() => {
    if (stage !== 'video') return
    const timer = setTimeout(() => {
      const v = videoRef.current
      const playing = v && v.readyState >= 3 && !v.paused && v.currentTime > 0
      if (!playing) setStage('title')
    }, VIDEO_START_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [stage])

  return (
    <div
      className="crt fixed inset-0 z-[100] flex cursor-pointer items-center justify-center overflow-hidden bg-void transition-all duration-500"
      onClick={skip}
      style={{
        '--glitch': stage === 'title' ? 0.55 : 0.28,
        opacity: exiting ? 0 : 1,
        filter: exiting ? 'blur(6px)' : 'blur(0)',
        transform: exiting ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      {stage === 'video' && (
        <>
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            src="intro.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={() => setStage('title')}
            onError={() => setStage('title')}
            onStalled={() => setStage('title')}
          />
          {/* CRT 스캔라인 오버레이 — AI 영상 잔결함(간판 등)을 눌러주고 게임 룩과 통일 */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 3px)' }}
          />
          <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
        </>
      )}

      {stage === 'title' && (
        <>
          <CodeRain className="opacity-[0.14]" />
          <div className="relative z-10 flex flex-col items-center gap-6 px-4">
            <h1
              className="intro-title chroma select-none whitespace-nowrap text-center font-extrabold text-neon-cyan"
              style={{ fontSize: 'clamp(1.6rem, 7.6vw, 4rem)', letterSpacing: '0.16em' }}
            >
              AETHERIA<span className="text-neon-magenta">::</span>2099
            </h1>
            <p className="font-pixel text-center text-[11px] tracking-[0.25em] text-cyan-300/70 sm:text-sm">
              {t('tagline')}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                finish()
              }}
              className="neon-btn font-pixel flex items-center gap-2 rounded border border-neon-cyan/50 bg-neon-cyan/10 px-6 py-2 text-sm font-bold tracking-widest text-neon-cyan"
            >
              <ChevronRight size={16} /> {t('jackIn')}
            </button>
          </div>
        </>
      )}

      <span className="font-pixel pointer-events-none absolute bottom-5 right-6 text-[10px] tracking-widest text-cyan-300/30">
        {stage === 'video' ? t('skipVideo') : ''}
      </span>
    </div>
  )
}
