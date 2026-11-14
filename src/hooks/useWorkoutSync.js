import { useCallback, useEffect, useRef, useState } from 'react'
import { isSessionExpired } from '../lib/api.js'
import { isTraining } from '../data/plan.js'
import { getSession } from '../lib/session.js'

const SAVE_DELAY_MS = 600
const PLAN_VERSION = '1'
const DEFAULT_SETTINGS = { restSec: 90, warmRest: 30, sound: true }

export function beirutDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Beirut',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

function normalizeSettings(value = {}) {
  return {
    restSec: Number(value.restSec) || DEFAULT_SETTINGS.restSec,
    warmRest: Number(value.warmRest) || DEFAULT_SETTINGS.warmRest,
    sound: value.sound !== false,
  }
}

function progressPayload(day, currentStep, totalSteps) {
  const step = Math.max(0, Math.min(Number(currentStep) || 0, totalSteps))
  return {
    planId: day,
    planVersion: PLAN_VERSION,
    currentStep: step,
    completedSteps: Array.from({ length: step }, (_, index) => index),
  }
}

export function useWorkoutSync({ api, day, idx, phase, session, dispatch, onSessionExpired, settings }) {
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [settingsReady, setSettingsReady] = useState(false)

  const lastProgressRef = useRef(null)
  const progressPlanIdRef = useRef(null)
  const lastSavedStepRef = useRef(null)
  const lastSettingsRef = useRef(null)
  const retryRef = useRef(null)
  const queueRef = useRef(Promise.resolve())

  const fail = useCallback((err, setter) => {
    if (isSessionExpired(err)) onSessionExpired(err)
    else setter(err.message || 'Something went wrong.')
  }, [onSessionExpired])

  const enqueue = useCallback((task) => {
    const run = queueRef.current.then(task, task)
    queueRef.current = run.catch(() => {})
    return run
  }, [])

  const load = useCallback(async () => {
    setStatus('loading')
    setLoadError(null)
    setSettingsReady(false)
    try {
      const [progress, remoteSettings] = await Promise.all([
        api.getProgress(),
        api.getSettings(),
      ])

      const normalized = normalizeSettings(remoteSettings)
      dispatch({ type: 'LOAD_SETTINGS', settings: normalized })
      lastSettingsRef.current = JSON.stringify(normalized)

      if (progress && progress.planId && isTraining(progress.planId) && String(progress.planVersion) === PLAN_VERSION) {
        const restored = Math.max(0, Number(progress.currentStep) || 0)
        const restoredSession = getSession(progress.planId)
        const safeStep = Math.min(restored, restoredSession.steps.length)
        dispatch({ type: 'LOAD_PROGRESS', idxByDay: { [progress.planId]: safeStep } })
        lastProgressRef.current = JSON.stringify({
          date: beirutDate(),
          ...progressPayload(progress.planId, safeStep, restoredSession.steps.length),
        })
        progressPlanIdRef.current = progress.planId
        lastSavedStepRef.current = safeStep
      } else {
        lastProgressRef.current = null
        progressPlanIdRef.current = null
        lastSavedStepRef.current = null
      }

      setSettingsReady(true)
      setStatus('ready')
    } catch (err) {
      setStatus('error')
      fail(err, setLoadError)
    }
  }, [api, dispatch, fail])

  useEffect(() => {
    load()
  }, [load])

  const saveProgress = useCallback((payload) => enqueue(async () => {
    setSaving(true)
    try {
      await api.saveProgress(payload)
      lastProgressRef.current = JSON.stringify({ date: beirutDate(), ...payload })
      progressPlanIdRef.current = payload.planId
      lastSavedStepRef.current = payload.currentStep
      setSaveError(null)
      retryRef.current = null
    } catch (err) {
      retryRef.current = () => saveProgress(payload)
      fail(err, setSaveError)
      throw err
    } finally {
      setSaving(false)
    }
  }), [api, enqueue, fail])

  // Browsing a day doesn't write anything. A save begins only when a workout
  // starts or when the current step advances.
  useEffect(() => {
    if (status !== 'ready' || !isTraining(day) || !session) return
    const running = phase === 'active' || phase === 'rest' || phase === 'alarm' || phase === 'done'
    const changedExistingProgress = progressPlanIdRef.current === day && lastSavedStepRef.current !== idx
    if (!running && !changedExistingProgress) return

    const payload = progressPayload(day, idx, session.steps.length)
    const signature = JSON.stringify({ date: beirutDate(), ...payload })
    if (signature === lastProgressRef.current) return

    const timer = setTimeout(() => saveProgress(payload).catch(() => {}), SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [status, day, idx, phase, session, saveProgress])

  // Save account-level preferences after the initial server settings have loaded.
  useEffect(() => {
    if (status !== 'ready' || !settingsReady) return
    const normalized = normalizeSettings(settings)
    const signature = JSON.stringify(normalized)
    if (signature === lastSettingsRef.current) return

    const timer = setTimeout(() => {
      enqueue(async () => {
        setSaving(true)
        try {
          const saved = normalizeSettings(await api.saveSettings(normalized))
          lastSettingsRef.current = JSON.stringify(saved)
          setSaveError(null)
          retryRef.current = null
        } catch (err) {
          retryRef.current = () => enqueue(async () => {
            const saved = normalizeSettings(await api.saveSettings(normalized))
            lastSettingsRef.current = JSON.stringify(saved)
            setSaveError(null)
          }).catch((retryErr) => fail(retryErr, setSaveError))
          fail(err, setSaveError)
        } finally {
          setSaving(false)
        }
      })
    }, SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [api, settings?.restSec, settings?.warmRest, settings?.sound, settingsReady, status, fail, enqueue])

  const retrySave = useCallback(() => retryRef.current?.(), [])

  return {
    status,
    loadError,
    saveError,
    saving,
    reload: load,
    retrySave,
    dismissError: () => setSaveError(null),
  }
}
