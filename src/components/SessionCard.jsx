import { FULL_DAY, PLAN, isTraining } from '../data/plan.js'
import { fmt, restFor } from '../lib/session.js'
import DemoLink from './DemoLink.jsx'
import NextUp from './NextUp.jsx'
import RestRing from './RestRing.jsx'
import StepInfo from './StepInfo.jsx'
import Stopwatch from './Stopwatch.jsx'

const ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function nextTrainingDay(day) {
  const i = ORDER.indexOf(day)
  for (let k = 1; k <= 7; k++) {
    const d = ORDER[(i + k) % 7]
    if (isTraining(d)) return d
  }
  return null
}

export default function SessionCard({ state, session, act }) {
  const { phase, day, idx } = state

  if (!session) {
    const next = nextTrainingDay(day)
    return (
      <section className="card restcard" data-phase="rest-day">
        <div className="kicker">{FULL_DAY[day]} · Rest day</div>
        <h2 className="ex">30 min light walk</h2>
        <p className="detail">
          No gym session. Keep the pace easy and let your back recover. Next training day is{' '}
          {FULL_DAY[next]}.
        </p>
        <button className="big" onClick={() => act('SELECT_DAY', { day: next })}>
          Preview {FULL_DAY[next]}
        </button>
      </section>
    )
  }

  const { steps, title } = session

  if (phase === 'done') {
    return (
      <section className="card" data-phase="done">
        <div className="kicker">{title}</div>
        <h2 className="ex">Session complete</h2>
        <p className="detail">
          All {steps.length} steps done. Eat, hydrate and keep tomorrow’s walk easy.
        </p>
        <div className="row">
          <button className="ghost" onClick={() => act('BACK')}>
            Undo last
          </button>
          <button className="ghost" onClick={() => act('RESET')}>
            {state.armed ? 'Tap again to restart' : 'Restart session'}
          </button>
        </div>
      </section>
    )
  }

  const step = steps[idx]
  const isBlock = step.kind === 'block'

  if (phase === 'rest') {
    return (
      <section className="card" data-phase="rest">
        <div className="kicker">Resting</div>
        <RestRing endAt={state.endAt} total={state.total} />
        <NextUp step={step} />
        <div className="row">
          <button className="ghost" onClick={() => act('ADD_TIME')}>
            +15 sec
          </button>
          <button className="ghost" onClick={() => act('NEXT')}>
            Skip rest and start
          </button>
        </div>
        <button className="link" onClick={() => act('BACK')}>
          Undo last set
        </button>
      </section>
    )
  }

  if (phase === 'alarm') {
    return (
      <section className="card" data-phase="alarm">
        <div className="kicker">Rest over</div>
        <h2 className="ex">Time’s up</h2>
        <NextUp step={step} />
        <button className="big" onClick={() => act('NEXT')}>
          Start {isBlock ? 'next' : 'set'}
        </button>
      </section>
    )
  }

  if (phase === 'active') {
    const isLast = idx === steps.length - 1
    const restSeconds = restFor(step, state)
    return (
      <section className="card" data-phase="active">
        <div className="kicker">In progress</div>
        <h2 className="ex">{step.e.name}</h2>
        <StepInfo step={step} />
        <Stopwatch startAt={state.startAt} />
        <button className="big" onClick={() => act('DONE')}>
          {isBlock ? 'Finish' : 'Finish set'}
        </button>
        <p className="detail">
          {isLast
            ? 'This is the last one. Finish to complete the session.'
            : restSeconds > 0
              ? `A ${fmt(restSeconds)} rest timer starts when you finish.`
              : 'The next activity starts right after you finish.'}
        </p>
        {idx > 0 && (
          <button className="link" onClick={() => act('BACK')}>
            Undo, go back one
          </button>
        )}
      </section>
    )
  }

  // ready
  return (
    <section className="card" data-phase="ready">
      <div className="kicker">
        {step.e.tag ? `${step.e.tag} · ` : ''}
        {PLAN[day].title}
      </div>
      <h2 className="ex">{step.e.name}</h2>
      <StepInfo step={step} />
      <DemoLink entry={step.e} />
      <button className="big" onClick={() => act('START')}>
        {isBlock ? 'Start' : 'Start set'}
      </button>
      {idx > 0 && (
        <button className="link" onClick={() => act('BACK')}>
          Undo, go back one
        </button>
      )}
    </section>
  )
}
