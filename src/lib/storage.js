// Progress and settings live in this browser's localStorage. Progress (which step you
// are on) is kept for the current calendar day only; settings are kept permanently.

const KEY = 'gym.v1'

const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

const DEFAULTS = { restSec: 90, warmRest: 30, sound: true, idxByDay: {} }

export function loadSaved() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!raw) return DEFAULTS
    return {
      restSec: raw.rest || DEFAULTS.restSec,
      warmRest: raw.wrest || DEFAULTS.warmRest,
      sound: typeof raw.sound === 'boolean' ? raw.sound : DEFAULTS.sound,
      idxByDay: raw.date === todayStr() && raw.idx ? raw.idx : {},
    }
  } catch {
    return DEFAULTS
  }
}

export function save({ day, idx, idxByDay, restSec, warmRest, sound }) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        date: todayStr(),
        idx: { ...idxByDay, [day]: idx },
        rest: restSec,
        wrest: warmRest,
        sound,
      }),
    )
  } catch {
    /* storage blocked: the app still works, it just won't remember */
  }
}
