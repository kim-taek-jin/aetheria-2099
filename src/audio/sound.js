// ============================================================
//  Procedural audio via Web Audio API — zero asset files, zero
//  licensing, zero payload. Emotion-driven ambience + event SFX.
//  모든 소리는 마스터 게인(헤드룸)을 거치고, 드론은 크로스페이드로 전환해
//  클릭/팝 없이 감정에 바인딩된다.
// ============================================================

let ctx = null
let enabled = false
let master = null
let drone = null // { oscs:[], gain, lfo, filter }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    ctx = AC ? new AC() : null
    if (ctx) {
      master = ctx.createGain()
      master.gain.value = 0.9
      master.connect(ctx.destination)
    }
  }
  return ctx
}

export function enableAudio() {
  const c = ac()
  if (c && c.state === 'suspended') c.resume()
  enabled = !!c
  return enabled
}

export function setEnabled(v) {
  enabled = v
  if (!v) stopDrone(0.3)
}

export function isEnabled() {
  return enabled
}

// Short blip while text types out.
export function blip() {
  const c = ac()
  if (!enabled || !c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'square'
  o.frequency.value = 620 + Math.random() * 120
  o.connect(g).connect(master)
  const t = c.currentTime
  g.gain.setValueAtTime(0.012, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  o.start(t)
  o.stop(t + 0.06)
}

// Ambient bed bound to background tone. Two detuned layers + slow LFO shimmer,
// gently low-passed for warmth. root + interval sets the emotional color.
const DRONE = {
  Neutral: { freq: 90, interval: 1.5, type: 'sine', gain: 0.05, cutoff: 700 },
  Friendly: { freq: 130, interval: 1.5, type: 'sine', gain: 0.05, cutoff: 900 },
  Suspicious: { freq: 70, interval: 1.06, type: 'triangle', gain: 0.06, cutoff: 520 }, // 좁은 불협 → 불안
  Threatening: { freq: 44, interval: 1.5, type: 'sawtooth', gain: 0.07, cutoff: 360 },
  Melancholy: { freq: 98, interval: 1.2, type: 'sine', gain: 0.055, cutoff: 560 }, // 단3도 느낌
  Forest_Glitch: { freq: 165, interval: 1.5, type: 'triangle', gain: 0.045, cutoff: 1100 },
}

export function setAmbience(key) {
  const c = ac()
  if (!enabled || !c) return
  const cfg = DRONE[key] || DRONE.Neutral
  const t = c.currentTime
  stopDrone(0.9) // 이전 드론 페이드아웃(크로스페이드)

  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = cfg.cutoff
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(cfg.gain, t + 1.1) // 페이드인
  g.connect(filter).connect(master)

  const o1 = c.createOscillator()
  o1.type = cfg.type
  o1.frequency.value = cfg.freq
  const o2 = c.createOscillator()
  o2.type = cfg.type
  o2.frequency.value = cfg.freq * cfg.interval
  o2.detune.value = 6 // 미세 디튠 → 두께
  o1.connect(g)
  o2.connect(g)

  // 느린 셰이머(진폭 흔들림)
  const lfo = c.createOscillator()
  const lfoGain = c.createGain()
  lfo.frequency.value = 0.12
  lfoGain.gain.value = cfg.gain * 0.35
  lfo.connect(lfoGain).connect(g.gain)

  o1.start(t)
  o2.start(t)
  lfo.start(t)
  drone = { oscs: [o1, o2], gain: g, lfo, filter }
}

// 증거 적중 — 밝게 상승하는 확신의 차임(2음 아르페지오).
export function evidenceHit() {
  const c = ac()
  if (!enabled || !c) return
  const t = c.currentTime
  ;[660, 990].forEach((f, i) => {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'triangle'
    o.frequency.value = f
    o.connect(g).connect(master)
    const at = t + i * 0.09
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(0.09, at + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.5)
    o.start(at)
    o.stop(at + 0.55)
  })
}

// 증거 빗나감 — 둔하게 하강하는 실패음.
export function evidenceMiss() {
  const c = ac()
  if (!enabled || !c) return
  const t = c.currentTime
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(240, t)
  o.frequency.exponentialRampToValueAtTime(90, t + 0.4)
  const f = c.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 500
  o.connect(f).connect(g).connect(master)
  g.gain.setValueAtTime(0.09, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
  o.start(t)
  o.stop(t + 0.5)
}

// 게이지 변화 등 미세 확인음.
export function tick(up = true) {
  const c = ac()
  if (!enabled || !c) return
  const t = c.currentTime
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  o.frequency.value = up ? 880 : 330
  o.connect(g).connect(master)
  g.gain.setValueAtTime(0.03, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
  o.start(t)
  o.stop(t + 0.14)
}

// 엔딩 스팅 — 천천히 부풀었다 스러지는 화음 패드(여운).
export function endingSting() {
  const c = ac()
  if (!enabled || !c) return
  stopDrone(0.6)
  const t = c.currentTime
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.07, t + 1.2)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6)
  g.connect(master)
  ;[110, 164.8, 220].forEach((f) => {
    const o = c.createOscillator()
    o.type = 'sine'
    o.frequency.value = f
    o.connect(g)
    o.start(t)
    o.stop(t + 3.8)
  })
}

// 노이즈 버스트 — 글리치/에러.
export function glitchBurst() {
  const c = ac()
  if (!enabled || !c) return
  const bufferSize = c.sampleRate * 0.25
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
  const src = c.createBufferSource()
  const g = c.createGain()
  g.gain.value = 0.05
  src.buffer = buffer
  src.connect(g).connect(master)
  src.start()
}

function stopDrone(fade = 0.3) {
  if (!drone) return
  const c = ac()
  const d = drone
  drone = null
  try {
    const t = c.currentTime
    d.gain.gain.cancelScheduledValues(t)
    d.gain.gain.setValueAtTime(Math.max(0.0001, d.gain.gain.value), t)
    d.gain.gain.exponentialRampToValueAtTime(0.0001, t + fade)
    const stopAt = t + fade + 0.05
    d.oscs.forEach((o) => o.stop(stopAt))
    d.lfo.stop(stopAt)
  } catch {
    /* already stopped */
  }
}
