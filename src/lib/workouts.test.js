import { describe, expect, it } from 'vitest'
import { getSession } from './session.js'
import { buildWorkout, localDate, progressForDate, sortWorkouts, upsert, workoutIdFor } from './workouts.js'

const now = new Date('2026-11-13T18:00:00Z')

describe('workout records', () => {
  it('formats local dates and ids', () => {
    expect(localDate(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(workoutIdFor('2026-01-05', 'mon')).toBe('2026-01-05_mon')
  })

  it('builds a new in-progress workout', () => {
    const w = buildWorkout({ day: 'mon', date: '2026-11-13', stepIndex: 3, now })
    expect(w).toMatchObject({
      workoutId: '2026-11-13_mon',
      day: 'mon',
      stepIndex: 3,
      totalSteps: getSession('mon').steps.length,
      status: 'in_progress',
      startedAt: now.toISOString(),
      completedAt: null,
      notes: '',
    })
  })

  it('keeps startedAt and notes when updating, and marks completion', () => {
    const existing = buildWorkout({ day: 'mon', date: '2026-11-13', stepIndex: 1, now: new Date('2026-11-13T17:00:00Z') })
    const total = getSession('mon').steps.length
    const w = buildWorkout({ existing: { ...existing, notes: 'felt good' }, day: 'mon', date: '2026-11-13', stepIndex: total + 5, now })
    expect(w.startedAt).toBe('2026-11-13T17:00:00.000Z')
    expect(w.notes).toBe('felt good')
    expect(w.stepIndex).toBe(total)
    expect(w.status).toBe('completed')
    expect(w.completedAt).toBe(now.toISOString())
  })

  it('restores only the given date\'s progress', () => {
    const list = [
      { date: '2026-11-13', day: 'mon', stepIndex: 4 },
      { date: '2026-11-12', day: 'tue', stepIndex: 9 },
    ]
    expect(progressForDate(list, '2026-11-13')).toEqual({ mon: 4 })
  })

  it('sorts newest first and upserts by id', () => {
    const a = { workoutId: 'a', date: '2026-11-10' }
    const b = { workoutId: 'b', date: '2026-11-12' }
    expect(sortWorkouts([a, b]).map((w) => w.workoutId)).toEqual(['b', 'a'])
    const next = upsert([b, a], { ...a, notes: 'x' })
    expect(next).toHaveLength(2)
    expect(next.find((w) => w.workoutId === 'a').notes).toBe('x')
  })
})
