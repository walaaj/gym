import { isTraining } from '../data/plan.js'
import { getSession, restFor } from '../lib/session.js'

/**
 * phase:
 *   ready   waiting for you to press Start
 *   active  an activity is running (stopwatch)
 *   rest    countdown between activities
 *   alarm   countdown finished, ringing until you start the next one
 *   done    every step finished or skipped
 *
 * skippedByDay: { [day]: entryId[] }  exercises skipped today; their steps are passed over
 * lastSkip:     { entryId, idx, phase } | null  lets the most recent skip be undone
 */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const stepsFor = (day) => (isTraining(day) ? getSession(day).steps : [])

const NO_SKIPS = Object.freeze([])
export const skippedFor = (state, day = state.day) => state.skippedByDay?.[day] || NO_SKIPS

/** First step at or after `from` whose exercise isn't skipped; steps.length if none. */
export function nextIndex(steps, from, skipped) {
  let i = Math.max(0, from)
  while (i < steps.length && skipped.includes(steps[i].e.id)) i++
  return i
}

/** Last step before `from` whose exercise isn't skipped; -1 if none. */
function prevIndex(steps, from, skipped) {
  let i = from - 1
  while (i >= 0 && skipped.includes(steps[i].e.id)) i--
  return i
}

function enterDay(state, day) {
  const steps = stepsFor(day)
  const idx = nextIndex(steps, Math.min(state.idxByDay[day] || 0, steps.length), skippedFor(state, day))
  return {
    ...state,
    day,
    idx,
    phase: steps.length && idx >= steps.length ? 'done' : 'ready',
    armed: false,
    lastSkip: null,
  }
}

export function createInitialState(day, saved) {
  return enterDay(
    {
      idx: 0,
      phase: 'ready',
      endAt: 0,
      total: 0,
      startAt: 0,
      armed: false,
      idxByDay: {},
      skippedByDay: {},
      lastSkip: null,
      restSec: 90,
      warmRest: 30,
      sound: true,
      ...saved,
    },
    day,
  )
}

export function workoutReducer(state, action) {
  const steps = stepsFor(state.day)
  const skipped = skippedFor(state)

  switch (action.type) {
    case 'SELECT_DAY':
      return enterDay(
        { ...state, idxByDay: { ...state.idxByDay, [state.day]: state.idx } },
        action.day,
      )

    // Progress loaded from (or changed on) the server:
    //   idxByDay:     { [day]: stepIndex }
    //   skippedByDay: { [day]: entryId[] }   (optional)
    // Only applied while nothing is running, so it never interrupts a set or rest.
    case 'LOAD_PROGRESS': {
      const idxByDay = { ...state.idxByDay, ...action.idxByDay }
      const skippedByDay = { ...state.skippedByDay, ...action.skippedByDay }
      if (state.phase !== 'ready' && state.phase !== 'done') return { ...state, idxByDay, skippedByDay }
      return enterDay({ ...state, idxByDay, skippedByDay }, state.day)
    }

    case 'LOAD_SETTINGS':
      return { ...state, restSec: action.settings.restSec, warmRest: action.settings.warmRest, sound: action.settings.sound }

    case 'SET_REST':
      return { ...state, restSec: clamp(state.restSec + action.delta, 30, 300) }
    case 'SET_WARM_REST':
      return { ...state, warmRest: clamp(state.warmRest + action.delta, 15, 120) }
    case 'TOGGLE_SOUND':
      return { ...state, sound: !state.sound }

    case 'START':
      if (state.phase !== 'ready') return state
      return { ...state, phase: 'active', startAt: action.now, armed: false, lastSkip: null }

    case 'DONE': {
      if (state.phase !== 'active') return state
      const finished = steps[state.idx]
      const idx = nextIndex(steps, state.idx + 1, skipped)
      const base = { ...state, idx, armed: false, lastSkip: null }
      if (idx >= steps.length) return { ...base, phase: 'done' }
      const seconds = restFor(finished, state)
      if (seconds > 0) {
        return { ...base, phase: 'rest', total: seconds, endAt: action.now + seconds * 1000 }
      }
      return { ...base, phase: 'active', startAt: action.now }
    }

    // Skip every remaining set of the current (or, while resting, the upcoming)
    // exercise. Superset/circuit partners carry on. A running rest keeps running.
    case 'SKIP': {
      if (state.phase === 'done' || state.idx >= steps.length) return state
      const entryId = steps[state.idx].e.id
      const nextSkipped = [...skipped, entryId]
      const idx = nextIndex(steps, state.idx, nextSkipped)
      const phase =
        idx >= steps.length ? 'done' : state.phase === 'active' ? 'ready' : state.phase
      return {
        ...state,
        idx,
        phase,
        armed: false,
        skippedByDay: { ...state.skippedByDay, [state.day]: nextSkipped },
        lastSkip: { entryId, idx: state.idx, phase: state.phase },
      }
    }

    case 'UNDO_SKIP': {
      const last = state.lastSkip
      if (!last) return state
      return {
        ...state,
        idx: last.idx,
        phase: last.phase,
        armed: false,
        skippedByDay: { ...state.skippedByDay, [state.day]: skipped.filter((id) => id !== last.entryId) },
        lastSkip: null,
      }
    }

    case 'ALARM':
      return state.phase === 'rest' ? { ...state, phase: 'alarm' } : state

    // Skip the rest, or press "Start" on the alarm: begin the next activity.
    case 'NEXT':
      if (state.phase !== 'rest' && state.phase !== 'alarm') return state
      return { ...state, phase: 'active', startAt: action.now, armed: false, lastSkip: null }

    case 'ADD_TIME':
      if (state.phase !== 'rest') return state
      return { ...state, endAt: state.endAt + 15000, total: state.total + 15 }

    // Back to the previous step that wasn't skipped (skips are undone with UNDO_SKIP).
    case 'BACK': {
      const idx = prevIndex(steps, state.idx, skipped)
      if (idx < 0) return state
      return { ...state, idx, phase: 'ready', armed: false, lastSkip: null }
    }

    // Two taps: the first arms it, the second resets (and clears today's skips).
    case 'RESET':
      if (!state.armed) return { ...state, armed: true }
      return {
        ...state,
        idx: 0,
        phase: 'ready',
        armed: false,
        lastSkip: null,
        skippedByDay: { ...state.skippedByDay, [state.day]: [] },
      }

    default:
      return state
  }
}
