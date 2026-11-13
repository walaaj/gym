import { describe, expect, it } from 'vitest'
import { PLAN, isTraining } from '../data/plan.js'
import { buildSession, demoUrl, fmt, restFor } from './session.js'

const settings = { restSec: 90, warmRest: 30 }

describe('buildSession', () => {
  // Totals recorded from the original single-file page.
  const expected = {
    mon: { steps: 43, warm: 15, blocks: 2 },
    tue: { steps: 43, warm: 12, blocks: 2 },
    thu: { steps: 41, warm: 15, blocks: 2 },
    fri: { steps: 39, warm: 15, blocks: 2 },
  }
  for (const [day, want] of Object.entries(expected)) {
    it(`${day} has the same steps as the original`, () => {
      const { steps } = buildSession(day)
      expect(steps).toHaveLength(want.steps)
      expect(steps.filter((s) => s.warm)).toHaveLength(want.warm)
      expect(steps.filter((s) => s.kind === 'block')).toHaveLength(want.blocks)
    })
  }

  it('only Mon, Tue, Thu and Fri are training days', () => {
    expect(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].filter(isTraining)).toEqual([
      'mon',
      'tue',
      'thu',
      'fri',
    ])
    expect(Object.keys(PLAN)).toHaveLength(4)
  })

  it('alternates superset exercises: A1, A2, A1, A2...', () => {
    const { steps } = buildSession('tue')
    const names = steps.filter((s) => s.e.tag === 'A1' || s.e.tag === 'A2').map((s) => s.e.tag)
    expect(names).toEqual(['A1', 'A2', 'A1', 'A2', 'A1', 'A2'])
  })

  it('rotates the Friday circuit with 30 sec between exercises and 90 sec after a round', () => {
    const { steps } = buildSession('fri')
    const circuit = steps.filter((s) => s.rest != null)
    expect(circuit).toHaveLength(18)
    expect(circuit.slice(0, 6).map((s) => s.rest)).toEqual([30, 30, 30, 30, 30, 90])
    expect(circuit.slice(0, 6).map((s) => s.set)).toEqual([1, 1, 1, 1, 1, 1])
    expect(circuit[6].set).toBe(2)
  })

  it('never lists elliptical anywhere', () => {
    expect(JSON.stringify(PLAN).toLowerCase()).not.toContain('ellip')
  })

  it('keeps core to at most two exercises a day', () => {
    for (const day of Object.keys(PLAN)) {
      const core = buildSession(day).outline.find((s) => s.title === 'Core')
      expect(core.entries.length).toBeLessThanOrEqual(2)
    }
  })
})

describe('restFor', () => {
  const { steps } = buildSession('mon')
  it('uses the warm-up rest for warm-up moves', () => {
    expect(restFor(steps.find((s) => s.warm), settings)).toBe(30)
  })
  it('uses the lifting rest (1:30) for strength sets', () => {
    expect(restFor(steps.find((s) => !s.warm && s.kind === 'set'), settings)).toBe(90)
  })
  it('has no rest after a treadmill block', () => {
    expect(restFor(steps.find((s) => s.kind === 'block'), settings)).toBe(0)
  })
})

describe('helpers', () => {
  it('formats time as m:ss', () => {
    expect(fmt(0)).toBe('0:00')
    expect(fmt(90)).toBe('1:30')
    expect(fmt(-5)).toBe('0:00')
    expect(fmt(65.9)).toBe('1:05')
  })
  it('builds a demo search link', () => {
    expect(demoUrl({ name: 'Dead Bug', q: 'dead bug exercise' })).toBe(
      'https://www.youtube.com/results?search_query=dead%20bug%20exercise',
    )
    expect(demoUrl({ name: 'Hip Abduction (band or side-lying)' })).toContain('Hip%20Abduction%20exercise%20form')
  })
})
