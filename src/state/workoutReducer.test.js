import { describe, expect, it } from 'vitest'
import { getSession } from '../lib/session.js'
import { createInitialState, workoutReducer } from './workoutReducer.js'

const saved = { restSec: 90, warmRest: 30, sound: true, idxByDay: {} }
const T0 = 1_000_000
const run = (state, type, extra = {}) => workoutReducer(state, { type, now: T0, ...extra })

describe('workoutReducer', () => {
  it('starts on the first step, ready', () => {
    const s = createInitialState('mon', saved)
    expect(s).toMatchObject({ day: 'mon', idx: 0, phase: 'ready' })
  })

  it('Start runs the stopwatch, Finish starts the rest timer', () => {
    let s = createInitialState('mon', saved)
    // step 0 is the treadmill block: no rest, next activity starts right away
    s = run(s, 'START')
    expect(s).toMatchObject({ phase: 'active', startAt: T0 })
    s = run(s, 'DONE', { now: T0 + 5 })
    expect(s).toMatchObject({ idx: 1, phase: 'active', startAt: T0 + 5 })
    // step 1 is a warm-up move: 30 sec rest
    s = run(s, 'DONE', { now: T0 + 10 })
    expect(s).toMatchObject({ idx: 2, phase: 'rest', total: 30, endAt: T0 + 10 + 30_000 })
  })

  it('rest -> alarm -> start next set', () => {
    let s = createInitialState('mon', saved)
    s = { ...s, idx: getSession('mon').steps.findIndex((x) => x.kind === 'set' && !x.warm) }
    s = run(s, 'START')
    s = run(s, 'DONE')
    expect(s).toMatchObject({ phase: 'rest', total: 90 })
    s = run(s, 'ALARM')
    expect(s.phase).toBe('alarm')
    s = run(s, 'NEXT', { now: T0 + 99 })
    expect(s).toMatchObject({ phase: 'active', startAt: T0 + 99 })
  })

  it('ignores ALARM and ADD_TIME outside the rest phase', () => {
    const s = createInitialState('mon', saved)
    expect(run(s, 'ALARM')).toBe(s)
    expect(run(s, 'ADD_TIME')).toBe(s)
  })

  it('adds 15 sec to a running rest', () => {
    let s = { ...createInitialState('mon', saved), phase: 'rest', total: 90, endAt: T0 + 90_000, idx: 20 }
    s = run(s, 'ADD_TIME')
    expect(s).toMatchObject({ total: 105, endAt: T0 + 105_000 })
  })

  it('can walk a whole session on every training day and finish', () => {
    for (const day of ['mon', 'tue', 'thu', 'fri']) {
      const total = getSession(day).steps.length
      let s = createInitialState(day, saved)
      let guard = 0
      while (s.phase !== 'done' && guard++ < 500) {
        if (s.phase === 'ready') s = run(s, 'START')
        else if (s.phase === 'active') s = run(s, 'DONE')
        else s = run(s, 'NEXT')
      }
      expect(s).toMatchObject({ phase: 'done', idx: total })
    }
  })

  it('Back steps to the previous activity', () => {
    let s = { ...createInitialState('mon', saved), idx: 5, phase: 'rest', total: 30, endAt: T0 }
    s = run(s, 'BACK')
    expect(s).toMatchObject({ idx: 4, phase: 'ready' })
    expect(run(createInitialState('mon', saved), 'BACK').idx).toBe(0)
  })

  it('Reset needs two taps', () => {
    let s = { ...createInitialState('mon', saved), idx: 7 }
    s = run(s, 'RESET')
    expect(s).toMatchObject({ armed: true, idx: 7 })
    s = run(s, 'RESET')
    expect(s).toMatchObject({ armed: false, idx: 0, phase: 'ready' })
  })

  it('remembers progress per day when switching tabs', () => {
    let s = { ...createInitialState('mon', saved), idx: 9 }
    s = run(s, 'SELECT_DAY', { day: 'tue' })
    expect(s).toMatchObject({ day: 'tue', idx: 0, phase: 'ready' })
    s = run(s, 'SELECT_DAY', { day: 'mon' })
    expect(s.idx).toBe(9)
  })

  it('shows rest days without steps', () => {
    const s = createInitialState('wed', saved)
    expect(s).toMatchObject({ day: 'wed', idx: 0, phase: 'ready' })
  })

  it('opens a finished day as done', () => {
    const total = getSession('mon').steps.length
    const s = createInitialState('mon', { ...saved, idxByDay: { mon: total } })
    expect(s.phase).toBe('done')
  })

  it('keeps rest settings within limits', () => {
    let s = createInitialState('mon', saved)
    for (let i = 0; i < 30; i++) s = run(s, 'SET_REST', { delta: -15 })
    expect(s.restSec).toBe(30)
    for (let i = 0; i < 30; i++) s = run(s, 'SET_REST', { delta: 15 })
    expect(s.restSec).toBe(300)
    for (let i = 0; i < 30; i++) s = run(s, 'SET_WARM_REST', { delta: -15 })
    expect(s.warmRest).toBe(15)
  })
  it("LOAD_PROGRESS restores server progress while idle", () => {
    let s = createInitialState("mon", saved)
    s = run(s, "LOAD_PROGRESS", { idxByDay: { mon: 5, tue: 2 } })
    expect(s).toMatchObject({ day: "mon", idx: 5, phase: "ready" })
    expect(s.idxByDay).toMatchObject({ mon: 5, tue: 2 })
  })

  it("LOAD_PROGRESS never interrupts a running activity", () => {
    let s = run(createInitialState("mon", saved), "START")
    s = run(s, "LOAD_PROGRESS", { idxByDay: { mon: 0 } })
    expect(s).toMatchObject({ idx: 0, phase: "active" })
    s = run(createInitialState("mon", saved), "LOAD_PROGRESS", { idxByDay: { mon: 3 } })
    s = run(s, "START")
    s = run(s, "LOAD_PROGRESS", { idxByDay: { mon: 0 } })
    expect(s).toMatchObject({ idx: 3, phase: "active" })
  })
})
