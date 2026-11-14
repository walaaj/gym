import { fmt } from '../lib/session.js'

function Stepper({ label, what, value, onChange }) {
  return (
    <span className="stepper">
      {label}
      <button className="chip" aria-label={`Shorter ${what}`} onClick={() => onChange(-15)}>
        −15
      </button>
      <b>{fmt(value)}</b>
      <button className="chip" aria-label={`Longer ${what}`} onClick={() => onChange(15)}>
        +15
      </button>
    </span>
  )
}

export default function Settings({ restSec, warmRest, sound, act }) {
  return (
    <div className="settings">
      <Stepper
        label="Rest, lifting"
        what="lifting rest"
        value={restSec}
        onChange={(delta) => act('SET_REST', { delta })}
      />
      <Stepper
        label="Rest, warm-up"
        what="warm-up rest"
        value={warmRest}
        onChange={(delta) => act('SET_WARM_REST', { delta })}
      />
      <button className="chip" aria-pressed={sound} onClick={() => act('TOGGLE_SOUND')}>
        {sound ? 'Sound on' : 'Sound off'}
      </button>
    </div>
  )
}
