import { PLAN, CUES } from '../data/plan.js'

/**
 * Turns a day's plan into a flat list of steps the app walks through, plus an
 * outline (sections with entries) for the list under the main card.
 *
 * step:  { e, set, kind: 'set' | 'block', warm, rest }
 *        rest is a fixed number of seconds, or null to use the user's setting
 * entry: { id, tag, name, sets, target?, detail?, q?, block }
 */
export function buildSession(day) {
  const plan = PLAN[day]
  const steps = []
  const outline = []
  let n = 0

  for (const sec of plan.sections) {
    const section = { title: sec.title, entries: [] }

    for (const item of sec.items) {
      if (item.block) {
        const { name, detail, q } = item.block
        const e = { id: n++, tag: '', name, detail, q, sets: 1, block: true }
        section.entries.push(e)
        steps.push({ e, set: 1, kind: 'block', warm: false, rest: null })
        continue
      }

      const exs = item.group.map((x) => ({
        id: n++,
        tag: x.tag || '',
        name: x.n,
        sets: x.s,
        target: x.t,
        q: x.q,
        block: false,
      }))
      section.entries.push(...exs)

      const maxSets = Math.max(...exs.map((e) => e.sets))
      for (let round = 1; round <= maxSets; round++) {
        exs.forEach((e, i) => {
          if (e.sets < round) return
          steps.push({
            e,
            set: round,
            kind: 'set',
            warm: Boolean(item.warm),
            // Circuits rest 30 sec between exercises and 90 sec after each round.
            rest: item.circuit ? (i === exs.length - 1 ? 90 : 30) : null,
          })
        })
      }
    }
    outline.push(section)
  }

  return { title: plan.title, steps, outline }
}

const cache = new Map()
/** Sessions never change at runtime, so build each day once. */
export function getSession(day) {
  if (!cache.has(day)) cache.set(day, buildSession(day))
  return cache.get(day)
}

/** Seconds of rest after finishing this step. 0 means start the next one straight away. */
export function restFor(step, { restSec, warmRest }) {
  if (step.rest != null) return step.rest
  if (step.kind === 'block') return 0
  return step.warm ? warmRest : restSec
}

export function fmt(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function demoUrl(entry) {
  const q = entry.q || `${entry.name.replace(/\s*\(.*\)/, '')} exercise form`
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
}

export const cueFor = (entry) => CUES[entry.name] || ''

export const stepLabel = (step) => (step.e.tag ? `${step.e.tag} · ` : '') + step.e.name
