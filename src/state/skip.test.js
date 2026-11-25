import { describe, expect, it } from 'vitest'
import { DAYS, isTraining } from '../data/plan.js'
import { completedStepsFor, skippedFromProgress } from '../lib/progress.js'
import { getSession } from '../lib/session.js'
import { createInitialState, skippedFor, workoutReducer } from './workoutReducer.js'

const T0 = 1_000_000
const run = (state, type, extra = {}) => workoutReducer(state, { type, now: T0, ...extra })
const at = (day, idx) => ({ ...createInitialState(day), idx })

// A superset step: its exercise's next set comes after a partner's set.
function findSuperset() {
  for (const [day] of DAYS) {
    if (!isTraining(day)) continue
    const { steps } = getSession(day)
    for (let i = 0; i + 2 < steps.length; i++) {
      const id = steps[i].e.id
      if (steps[i + 1].e.id !== id && steps.slice(i + 2).some((s) => s.e.id === id)) return { day, i, steps }
    }
  }
  throw new Error('plan has no superset')
}

// A multi-set exercise whose sets are consecutive.
function findStraightSets() {
  const { steps } = getSession('mon')
  const i = steps.findIndex((s, k) => s.e.sets > 1 && s.set === 1 && steps[k + 1]?.e.id === s.e.id)
  return { day: 'mon', i, steps }
}

describe('skipping an exercise', () => {
  it('passes over every remaining set of the exercise', () => {
    const { day, i, steps } = findStraightSets()
    const s = run(at(day, i), 'SKIP')
    const id = steps[i].e.id
    expect(skippedFor(s)).toEqual([id])
    expect(steps[s.idx].e.id).not.toBe(id)
    expect(s.idx).toBe(i + steps[i].e.sets)
    expect(s.phase).toBe('ready')
  })

  it('keeps superset partners and drops the skipped exercise from later rounds', () => {
    const { day, i, steps } = findSuperset()
    const id = steps[i].e.id
    let s = run(at(day, i), 'SKIP')
    expect(s.idx).toBe(i + 1)
    // Walk the rest of the session: the skipped exercise never comes up again.
    for (let guard = 0; s.phase !== 'done' && guard < 500; guard++) {
      expect(steps[s.idx].e.id).not.toBe(id)
      s = run(run(s, s.phase === 'ready' ? 'START' : 'NEXT'), 'DONE')
    }
    expect(s.phase).toBe('done')
  })

  it('stops a running stopwatch, but leaves a rest timer running', () => {
    const { day, i } = findStraightSets()
    expect(run(run(at(day, i), 'START'), 'SKIP').phase).toBe('ready')
    const resting = { ...at(day, i), phase: 'rest', endAt: T0 + 60_000, total: 60 }
    const s = run(resting, 'SKIP')
    expect(s).toMatchObject({ phase: 'rest', endAt: T0 + 60_000 })
  })

  it('can be undone', () => {
    const { day, i } = findStraightSets()
    const before = run(at(day, i), 'START')
    const s = run(run(before, 'SKIP'), 'UNDO_SKIP')
    expect(s).toMatchObject({ idx: i, phase: 'active', lastSkip: null })
    expect(skippedFor(s)).toEqual([])
  })

  it('finishes the session when the last exercise is skipped', () => {
    const { steps } = getSession('mon')
    const last = steps.length - 1
    const firstOfLast = steps.findIndex((x) => x.e.id === steps[last].e.id)
    expect(run(at('mon', firstOfLast), 'SKIP')).toMatchObject({ idx: steps.length, phase: 'done' })
  })

  it('Back passes over skipped steps, and Reset clears skips', () => {
    const { day, i, steps } = findStraightSets()
    let s = run(at(day, i), 'SKIP')
    s = run(s, 'BACK')
    expect(s.idx).toBe(i - 1)
    expect(steps[s.idx].e.id).not.toBe(steps[i].e.id)
    s = run(run(s, 'RESET'), 'RESET')
    expect(s.idx).toBe(0)
    expect(skippedFor(s)).toEqual([])
  })
})

describe('saving skips in completedSteps', () => {
  it('round-trips through the progress payload', () => {
    const { day, i, steps } = findSuperset()
    let s = run(at(day, i), 'SKIP')
    s = run(run(s, 'START'), 'DONE') // finish the partner's set
    const completed = completedStepsFor(steps, s.idx, skippedFor(s))
    expect(completed).not.toContain(i)
    expect(completed).toContain(i + 1)
    expect(skippedFromProgress(steps, s.idx, completed)).toEqual([steps[i].e.id])
  })

  it('restores skips with LOAD_PROGRESS', () => {
    const { day, i, steps } = findStraightSets()
    const id = steps[i].e.id
    const s = run(createInitialState(day), 'LOAD_PROGRESS', {
      idxByDay: { [day]: i },
      skippedByDay: { [day]: [id] },
    })
    expect(s.idx).toBe(i + steps[i].e.sets)
  })

  it('treats old payloads (all steps completed) as no skips', () => {
    const { steps } = getSession('mon')
    expect(skippedFromProgress(steps, 5, [0, 1, 2, 3, 4])).toEqual([])
    expect(skippedFromProgress(steps, 5, undefined)).toEqual([])
  })
})
