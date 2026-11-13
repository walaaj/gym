import { useCallback, useEffect, useReducer } from 'react'
import DayTabs from './components/DayTabs.jsx'
import Header from './components/Header.jsx'
import Outline from './components/Outline.jsx'
import SessionCard from './components/SessionCard.jsx'
import Settings from './components/Settings.jsx'
import { JS_DAY_TO_KEY, isTraining } from './data/plan.js'
import { useRestAlarm, useRinging, useSoundSetting, useWakeLock } from './hooks/useWorkoutEffects.js'
import { ensureAudio } from './lib/audio.js'
import { fmt, getSession, stepLabel } from './lib/session.js'
import { loadSaved, save } from './lib/storage.js'
import { createInitialState, workoutReducer } from './state/workoutReducer.js'

// Browsers only allow sound after a tap, so unlock audio on these actions.
const UNLOCKS_AUDIO = new Set(['START', 'DONE', 'NEXT', 'TOGGLE_SOUND'])
const KEEP_AWAKE = new Set(['active', 'rest', 'alarm'])

function announcement(state, session) {
  if (!session) return ''
  if (state.phase === 'done') return 'Session complete'
  const label = stepLabel(session.steps[state.idx])
  switch (state.phase) {
    case 'active':
      return `Started ${label}`
    case 'rest':
      return `Rest ${fmt(state.total)}. Up next: ${label}`
    case 'alarm':
      return `Rest over. Next: ${label}`
    default:
      return `Ready: ${label}`
  }
}

export default function App() {
  const [state, dispatch] = useReducer(workoutReducer, undefined, () =>
    createInitialState(JS_DAY_TO_KEY[new Date().getDay()], loadSaved()),
  )

  const session = isTraining(state.day) ? getSession(state.day) : null

  const act = useCallback((type, extra) => {
    if (UNLOCKS_AUDIO.has(type)) ensureAudio()
    dispatch({ type, now: Date.now(), ...extra })
  }, [])

  useRestAlarm(state.phase, state.endAt, dispatch)
  useRinging(state.phase)
  useSoundSetting(state.sound)
  useWakeLock(KEEP_AWAKE.has(state.phase))

  const { day, idx, idxByDay, restSec, warmRest, sound } = state
  useEffect(() => {
    save({ day, idx, idxByDay, restSec, warmRest, sound })
  }, [day, idx, idxByDay, restSec, warmRest, sound])

  const progress = session ? Math.round((idx / session.steps.length) * 100) : 0

  return (
    <div className="wrap">
      <Header />
      <DayTabs day={day} onSelect={(d) => act('SELECT_DAY', { day: d })} />
      <Settings restSec={restSec} warmRest={warmRest} sound={sound} act={act} />
      <div className="progress" aria-hidden="true">
        <i style={{ width: `${progress}%` }} />
      </div>
      <SessionCard state={state} session={session} act={act} />
      {session && (
        <Outline session={session} idx={idx} phase={state.phase} armed={state.armed} act={act} />
      )}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement(state, session)}
      </div>
    </div>
  )
}
