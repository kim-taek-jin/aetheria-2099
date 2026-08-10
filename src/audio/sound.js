// ============================================================
//  Procedural audio via Web Audio API — zero asset files, zero
//  licensing, zero payload. Emotion-driven ambience + typing beeps.
// ============================================================

let ctx = null
let enabled = false
let droneNodes = null

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    ctx = AC ? new AC() : null
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
  if (!v) stopDrone()
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
  g.gain.value = 0.015
  o.connect(g).connect(c.destination)
  const t = c.currentTime
  g.gain.setValueAtTime(0.015, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  o.start(t)
  o.stop(t + 0.06)
}

// Ambient drone bound to NPC emotion / background tone.
const DRONE = {
  Neutral: { freq: 90, type: 'sine', gain: 0.03 },
  Friendly: { freq: 130, type: 'sine', gain: 0.03 },
  Suspicious: { freq: 70, type: 'triangle', gain: 0.045 },
  Threatening: { freq: 46, type: 'sawtooth', gain: 0.06 },
  Melancholy: { freq: 98, type: 'sine', gain: 0.04 },
  Forest_Glitch: { freq: 160, type: 'triangle', gain: 0.035 },
}

export function setAmbience(key) {
  const c = ac()
  if (!enabled || !c) return
  stopDrone()
  const cfg = DRONE[key] || DRONE.Neutral
  const o = c.createOscillator()
  const g = c.createGain()
  const lfo = c.createOscillator()
  const lfoGain = c.createGain()
  o.type = cfg.type
  o.frequency.value = cfg.freq
  lfo.frequency.value = 0.15
  lfoGain.gain.value = cfg.gain * 0.4
  lfo.connect(lfoGain).connect(g.gain)
  g.gain.value = cfg.gain
  o.connect(g).connect(c.destination)
  o.start()
  lfo.start()
  droneNodes = { o, g, lfo }
}

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
  src.connect(g).connect(c.destination)
  src.start()
}

function stopDrone() {
  if (droneNodes) {
    try {
      droneNodes.o.stop()
      droneNodes.lfo.stop()
    } catch {
      /* already stopped */
    }
    droneNodes = null
  }
}
