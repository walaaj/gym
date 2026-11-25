// Skipped exercises are stored inside the existing progress payload, with no
// extra field: `completedSteps` lists only the steps actually done before
// `currentStep`. A step before `currentStep` that isn't listed was skipped,
// and skipping applies to the whole exercise (all of its sets).

/** Indexes of the steps done before `idx`, leaving out skipped exercises. */
export function completedStepsFor(steps, idx, skipped = []) {
  const end = Math.min(Math.max(Number(idx) || 0, 0), steps.length)
  const done = []
  for (let i = 0; i < end; i++) {
    if (!skipped.includes(steps[i].e.id)) done.push(i)
  }
  return done
}

/** Exercise ids that were skipped, recovered from a saved progress payload. */
export function skippedFromProgress(steps, currentStep, completedSteps) {
  if (!Array.isArray(completedSteps)) return []
  const end = Math.min(Math.max(Number(currentStep) || 0, 0), steps.length)
  const done = new Set(completedSteps.map(Number))
  const skipped = []
  for (let i = 0; i < end; i++) {
    const id = steps[i].e.id
    if (!done.has(i) && !skipped.includes(id)) skipped.push(id)
  }
  return skipped
}
