import { useEffect } from 'react'
import { ringOnce, setSoundEnabled } from '../lib/audio.js'

/** Fires the ALARM action when a rest countdown reaches zero. */
export function useRestAlarm(phase, endAt, dispatch) {
  useEffect(() => {
    if (phase !== 'rest') return undefined
    const fire = () => dispatch({ type: 'ALARM' })
    const wait = endAt - Date.now()
    if (wait <= 0) {
      fire()
      return undefined
    }
    const timer = setTimeout(fire, wait)
    // Phones pause timers in hidden tabs, so check again when the tab comes back.
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() >= endAt) fire()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [phase, endAt, dispatch])
}

/** Rings (sound + vibration) every 1.8 sec while the alarm phase is on. */
export function useRinging(phase) {
  useEffect(() => {
    if (phase !== 'alarm') return undefined
    ringOnce()
    const id = setInterval(ringOnce, 1800)
    return () => clearInterval(id)
  }, [phase])
}

export function useSoundSetting(sound) {
  useEffect(() => {
    setSoundEnabled(sound)
  }, [sound])
}

/** Keeps the screen on while you train. Needs HTTPS; silently skipped otherwise. */
export function useWakeLock(enabled) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return undefined
    let lock = null
    let cancelled = false

    const request = async () => {
      try {
        const l = await navigator.wakeLock.request('screen')
        if (cancelled) l.release().catch(() => {})
        else lock = l
      } catch {
        /* denied or unsupported */
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible' && (!lock || lock.released)) request()
    }

    request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      if (lock) lock.release().catch(() => {})
    }
  }, [enabled])
}
