// ============================================================
//  BGM 레이어 — public/music/ 의 작곡 트랙을 감정 톤에 물려 크로스페이드한다.
//
//  설계 원칙: **선택적 업그레이드**.
//   - 트랙 파일이 없으면 조용히 실패하고 절차적 드론(sound.js)이 그대로 돈다.
//   - 트랙이 있으면 드론을 더킹(0.35배)해 바닥에 깔고 BGM을 얹는다 —
//     드론이 남아야 씬 전환의 즉각적인 감정 반응이 유지된다(BGM은 느리게 바뀌므로).
//  sound.js와 같은 AudioContext/마스터 게인을 공유해 볼륨 관리가 한 곳이다.
// ============================================================

import { getAudioContext, getMasterGain, isEnabled, setDroneDuck } from './sound.js'

// 감정 톤 6종 → 트랙 4종. 생성 비용(Suno 크레딧)과 파일 용량을 아끼면서
// 감정 스펙트럼은 덮는 묶음이다.
export const TRACK_FILES = {
  calm: 'music/calm.mp3',
  tension: 'music/tension.mp3',
  danger: 'music/danger.mp3',
  melancholy: 'music/melancholy.mp3',
}

const TONE_TO_TRACK = {
  Neutral: 'calm',
  Friendly: 'calm',
  Suspicious: 'tension',
  Threatening: 'danger',
  Forest_Glitch: 'danger',
  Melancholy: 'melancholy',
}

const VOLUME = 0.42 // BGM 기본 음량(마스터 아래). 드론보다 앞에 서되 나레이션을 안 덮는 선.
const FADE = 2.2 // 크로스페이드 초 — 씬 전환이 음악적으로 자연스럽게 이어지는 길이

const nodes = new Map() // track -> { el, src, gain }
const missing = new Set() // 로드 실패한 트랙(재시도 안 함 — 404 반복 방지)
let current = null
let ducked = false

// 트랙을 (한 번만) 준비한다. 파일이 없으면 null을 반환해 호출자가 조용히 포기한다.
function ensure(track) {
  if (missing.has(track)) return null
  if (nodes.has(track)) return nodes.get(track)

  const c = getAudioContext()
  const master = getMasterGain()
  const file = TRACK_FILES[track]
  if (!c || !master || !file) return null

  const el = new Audio(file)
  el.loop = true
  el.preload = 'auto'
  el.crossOrigin = 'anonymous'
  // 실제로 소리가 나기 시작한 뒤에야 드론을 낮춘다. (파일이 없거나 디코드에
  // 실패하면 더킹이 걸리지 않아 "음악도 없고 드론도 작은" 공백이 생기지 않는다.)
  el.addEventListener('playing', () => {
    if (!ducked) {
      ducked = true
      setDroneDuck(0.35)
    }
  })
  // 파일 부재/디코드 실패 → 이 트랙을 영구 포기하고 드론으로 되돌린다.
  el.addEventListener('error', () => {
    missing.add(track)
    nodes.delete(track)
    if (current === track) current = null
    if (!anyLoaded()) unduck()
  })

  let src
  try {
    src = c.createMediaElementSource(el)
  } catch {
    missing.add(track)
    return null
  }
  const gain = c.createGain()
  gain.gain.value = 0.0001
  src.connect(gain).connect(master)

  const entry = { el, src, gain }
  nodes.set(track, entry)
  return entry
}

const anyLoaded = () => [...nodes.values()].some((n) => n.el.readyState > 0)

function unduck() {
  if (!ducked) return
  ducked = false
  setDroneDuck(1)
}

function fade(entry, to, sec) {
  const c = getAudioContext()
  if (!c || !entry) return
  const t = c.currentTime
  const g = entry.gain.gain
  g.cancelScheduledValues(t)
  g.setValueAtTime(Math.max(0.0001, g.value), t)
  g.exponentialRampToValueAtTime(Math.max(0.0001, to), t + sec)
}

// 감정 톤에 맞는 BGM으로 전환한다. 같은 트랙이면 아무것도 하지 않는다
// (Neutral↔Friendly 처럼 같은 묶음 안의 전환에서 음악이 끊기지 않도록).
export function setMusicTone(tone) {
  if (!isEnabled()) return
  const track = TONE_TO_TRACK[tone] || 'calm'
  if (track === current) return

  const next = ensure(track)
  if (!next) return // 에셋 없음 → 드론 유지

  const prevTrack = current
  const prev = prevTrack ? nodes.get(prevTrack) : null
  if (prev) {
    fade(prev, 0.0001, FADE)
    // 페이드가 끝난 뒤에만 정지 — 끊김 방지. 그 사이 이전 트랙으로 되돌아왔다면 살려둔다.
    setTimeout(() => {
      if (current !== prevTrack) prev.el.pause()
    }, FADE * 1000 + 120)
  }

  const p = next.el.play()
  if (p && p.catch) p.catch(() => {}) // 자동재생 차단은 조용히 무시(사용자가 사운드를 켠 뒤 호출됨)
  fade(next, VOLUME, FADE)
  current = track
  // 더킹은 'playing' 이벤트에서 — 재생이 실증된 뒤에만 드론을 낮춘다.
}

export function stopMusic(sec = 1.0) {
  for (const [track, n] of nodes) {
    fade(n, 0.0001, sec)
    setTimeout(() => n.el.pause(), sec * 1000 + 120)
    void track
  }
  current = null
  unduck()
}

export function isMusicPlaying() {
  return !!current
}
