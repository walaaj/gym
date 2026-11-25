import { useMemo } from 'react'
import DemoLink from './DemoLink.jsx'
import WorkoutImage from './WorkoutImage.jsx'

export default function Outline({ session, idx, phase, armed, skipped, act, images }) {
  const { steps, outline } = session

  // How many sets of each entry are finished (skipped exercises don't count).
  const finished = useMemo(() => {
    const counts = new Map()
    for (let i = 0; i < Math.min(idx, steps.length); i++) {
      const id = steps[i].e.id
      if (skipped.includes(id)) continue
      counts.set(id, (counts.get(id) || 0) + 1)
    }
    return counts
  }, [steps, idx, skipped])

  const current = phase === 'done' ? null : steps[idx]

  return (
    <div className="outline">
      {outline.map((section) => {
        // Finished and skipped exercises sink to the bottom of their section,
        // keeping plan order within each group.
        const rows = section.entries.map((e) => {
          const n = finished.get(e.id) || 0
          const isSkipped = skipped.includes(e.id)
          return { e, n, isSkipped, closed: isSkipped || n >= e.sets }
        })
        const ordered = [...rows.filter((r) => !r.closed), ...rows.filter((r) => r.closed)]

        return (
          <div className="sec" key={section.title}>
            <h2>{section.title}</h2>
            <ul>
              {ordered.map(({ e, n, isSkipped, closed }) => {
                const isCurrent = current?.e === e
                return (
                  <li
                    key={e.id}
                    className={`ent${isCurrent ? ' cur' : ''}${closed ? ' fin' : ''}${isSkipped ? ' skipped' : ''}`}
                  >
                    <span className="tag">{e.tag}</span>
                    <span className="nm">
                      {e.name}
                      <small>{e.block ? e.detail : `${e.sets} × ${e.target}`}</small>
                      <DemoLink entry={e} mini />
                      <WorkoutImage exercise={e} images={images} compact />
                    </span>
                    {isSkipped ? (
                      <span className="skip-mark">Skipped</span>
                    ) : e.block ? (
                      closed && <span className="done-mark">Done</span>
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
        )
      })}
      <div className="foot">
        <button className="link" onClick={() => act('RESET')}>
          {armed ? 'Tap again to confirm reset' : 'Reset this session'}
        </button>
      </div>
    </div>
  )
}
