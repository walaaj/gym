import { isTraining } from '../data/plan.js'
import { getSession, restFor } from '../lib/session.js'

/**
 * phase:
 *   ready   waiting for you to press Start
 *   active  an activity is running (stopwatch)
 *   rest    countdown between activities
 *   alarm   countdown finished, ringing until you start the next one
 *   done    every step finished
 */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const stepsFor = (day) => (isTraining(day) ? getSession(day).steps : [])

function enterDay(state, day) {
  const steps = stepsFor(day)
  const idx = Math.min(state.idxByDay[day] || 0, steps.length)
  return {
    ...state,
    day,
    idx,
    phase: steps.length && idx >= steps.length ? 'done' : 'ready',
    armed: false,
  }
}

export function createInitialState(day, saved) {
  return enterDay(
    { idx: 0, phase: 'ready', endAt: 0, total: 0, startAt: 0, armed: false, ...saved },
    day,
  )
}

export function workoutReducer(state, action) {
  const steps = stepsFor(state.day)

  switch (action.type) {
    case 'SELECT_DAY':
      return enterDay(
        { ...state, idxByDay: { ...state.idxByDay, [state.day]: state.idx } },
        action.day,
      )

    case 'SET_REST':
      return { ...state, restSec: clamp(state.restSec + action.delta, 30, 300) }
    case 'SET_WARM_REST':
      return { ...state, warmRest: clamp(state.warmRest + action.delta, 15, 120) }
    case 'TOGGLE_SOUND':
      return { ...state, sound: !state.sound }

    case 'START':
      if (state.phase !== 'ready') return state
      return { ...state, phase: 'active', startAt: action.now, armed: false }

    case 'DONE': {
      if (state.phase !== 'active') return state
      const finished = steps[state.idx]
      const idx = state.idx + 1
      if (idx >= steps.length) return { ...state, idx, phase: 'done', armed: false }
      const seconds = restFor(finished, state)
      if (seconds > 0) {
        return {
          ...state,
          idx,
          phase: 'rest',
          total: seconds,
          endAt: action.now + seconds * 1000,
          armed: false,
        }
      }
      return { ...state, idx, phase: 'active', startAt: action.now, armed: false }
    }

    case 'ALARM':
      return state.phase === 'rest' ? { ...state, phase: 'alarm' } : state

    // Skip the rest, or press "Start" on the alarm: begin the next activity.
    case 'NEXT':
      if (state.phase !== 'rest' && state.phase !== 'alarm') return state
      return { ...state, phase: 'active', startAt: action.now, armed: false }

    case 'ADD_TIME':
      if (state.phase !== 'rest') return state
      return { ...state, endAt: state.endAt + 15000, total: state.total + 15 }

    case 'BACK':
      if (state.idx === 0) return state
      return { ...state, idx: state.idx - 1, phase: 'ready', armed: false }

    // Two taps: the first arms it, the second resets.
    case 'RESET':
      if (!state.armed) return { ...state, armed: true }
      return { ...state, idx: 0, phase: 'ready', armed: false }

    default:
      return state
  }
}
