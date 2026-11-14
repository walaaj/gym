import { useMemo } from 'react'
import DemoLink from './DemoLink.jsx'

export default function Outline({ session, idx, phase, armed, act }) {
  const { steps, outline } = session

  // How many sets of each entry are finished.
  const finished = useMemo(() => {
    const counts = new Map()
    for (let i = 0; i < Math.min(idx, steps.length); i++) {
      const id = steps[i].e.id
      counts.set(id, (counts.get(id) || 0) + 1)
    }
    return counts
  }, [steps, idx])

  const current = phase === 'done' ? null : steps[idx]

  return (
    <div className="outline">
      {outline.map((section) => (
        <div className="sec" key={section.title}>
          <h2>{section.title}</h2>
          <ul>
            {section.entries.map((e) => {
              const n = finished.get(e.id) || 0
              const fin = n >= e.sets
              const isCurrent = current?.e === e
              return (
                <li key={e.id} className={`ent${isCurrent ? ' cur' : ''}${fin ? ' fin' : ''}`}>
                  <span className="tag">{e.tag}</span>
                  <span className="nm">
                    {e.name}
                    <small>{e.block ? e.detail : `${e.sets} × ${e.target}`}</small>
                    <DemoLink entry={e} mini />
                  </span>
                  {e.block ? (
                    fin && <span className="done-mark">Done</span>
                  ) : (
                    <span className="dots" role="img" aria-label={`${n} of ${e.sets} sets done`}>
                      {Array.from({ length: e.sets }, (_, j) => (
                        <i key={j} className={j < n ? 'on' : ''} />
                      ))}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
      <div className="foot">
        <button className="link" onClick={() => act('RESET')}>
          {armed ? 'Tap again to confirm reset' : 'Reset this session'}
        </button>
      </div>
    </div>
  )
}
