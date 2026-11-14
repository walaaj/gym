// Web Audio beeps. Browsers only allow sound after a tap, so call ensureAudio()
// from a click handler (the app does this for Start, Finish and the alarm button).

let ctx = null
let enabled = true

export function setSoundEnabled(value) {
  enabled = value
}

export function ensureAudio() {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext
      if (Ctor) ctx = new Ctor()
    }
    if (ctx && ctx.state === 'suspended') ctx.resume()
  } catch {
    /* audio unavailable */
  }
}

export function beep(freq, duration, delay = 0, volume = 0.22) {
  if (!ctx || !enabled) return
  try {
    const t = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + duration + 0.02)
  } catch {
    /* ignore */
  }
}

export function ringOnce() {
  beep(988, 0.16, 0)
  beep(988, 0.16, 0.24)
  beep(1318, 0.34, 0.48)
  try {
    if (enabled && navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400])
  } catch {
    /* ignore */
  }
}
