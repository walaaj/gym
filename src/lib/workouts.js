// A workout record is one plan day done on one calendar date. Its id is
// derived from both, so saving is idempotent: PUT creates it the first time
// and updates it afterwards, and progress resumes after a reload.
//
// {
//   workoutId:   '2026-11-13_fri',
//   date:        '2026-11-13'        local calendar date
//   day:         'fri'               plan day key
//   title:       'Full Body Circuit'
//   stepIndex:   12                  steps finished so far
//   totalSteps:  40
//   status:      'in_progress' | 'completed'
//   startedAt:   ISO string
//   updatedAt:   ISO string
//   completedAt: ISO string | null
//   notes:       string
// }

import { getSession } from './session.js'

export function localDate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const workoutIdFor = (date, day) => `${date}_${day}`

export function buildWorkout({ existing, day, date, stepIndex, now = new Date() }) {
  const session = getSession(day)
  const totalSteps = session.steps.length
  const done = Math.min(Math.max(stepIndex, 0), totalSteps)
  const iso = now.toISOString()
  const completed = done >= totalSteps
  return {
    notes: '',
    ...existing,
    workoutId: workoutIdFor(date, day),
    date,
    day,
    title: session.title,
    stepIndex: done,
    totalSteps,
    status: completed ? 'completed' : 'in_progress',
    startedAt: existing?.startedAt || iso,
    updatedAt: iso,
    completedAt: completed ? existing?.completedAt || iso : null,
  }
}

/** Today's step index for each plan day, from the server's workouts. */
export function progressForDate(workouts, date) {
  const idxByDay = {}
  for (const w of workouts) {
    if (w?.date === date && w.day) idxByDay[w.day] = Number(w.stepIndex) || 0
  }
  return idxByDay
}

/** Newest first. */
export function sortWorkouts(workouts) {
  return [...workouts].sort(
    (a, b) =>
      String(b.date).localeCompare(String(a.date)) ||
      String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')),
  )
}

export function upsert(list, workout) {
  const rest = list.filter((w) => w.workoutId !== workout.workoutId)
  return sortWorkouts([workout, ...rest])
}
