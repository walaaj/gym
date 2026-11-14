import { stepLabel } from '../lib/session.js'

export default function NextUp({ step }) {
  return (
    <div className="next">
      <div className="kicker">Up next</div>
      <b>{stepLabel(step)}</b>
      {step.kind === 'set' ? (
        <div>
          Set {step.set} of {step.e.sets} · {step.e.target}
        </div>
      ) : (
        <div>{step.e.detail}</div>
      )}
    </div>
  )
}
