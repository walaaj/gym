import { cueFor } from '../lib/session.js'

/** Target line (and form cue) for the current step. */
export default function StepInfo({ step }) {
  if (step.kind === 'block') return <p className="target">{step.e.detail}</p>
  const cue = cueFor(step.e)
  return (
    <>
      <div className="setline">
        <span className="setno">
          Set {step.set} of {step.e.sets}
        </span>
        <span className="target">{step.e.target}</span>
      </div>
      {cue && <p className="cue">{cue}</p>}
    </>
  )
}
