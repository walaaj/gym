// Settings (rest lengths, sound) stay in this browser's localStorage, namespaced
// by the Cognito `sub`. Workout progress is stored through the API (see api.js).
const KEY_PREFIX = 'gym.v1'

const storageKey = (userId) => `${KEY_PREFIX}:${userId || 'anonymous'}`

const DEFAULTS = { restSec: 90, warmRest: 30, sound: true }

export function loadSettings(userId) {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(userId)) || 'null')
    if (!raw) return DEFAULTS
    return {
      restSec: raw.rest || DEFAULTS.restSec,
      warmRest: raw.warmRest || DEFAULTS.warmRest,
      sound: raw.sound !== false,
    }
  } catch {
    return DEFAULTS
  }
}

export function saveSettings(userId, { restSec, warmRest, sound }) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify({ rest: restSec, warmRest, sound }))
  } catch {
    // Storage blocked: the app still works, but won't remember settings.
  }
}
