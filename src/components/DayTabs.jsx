import { DAYS, JS_DAY_TO_KEY, isTraining } from '../data/plan.js'

export default function DayTabs({ day, onSelect }) {
  const today = JS_DAY_TO_KEY[new Date().getDay()]
  return (
    <nav className="tabs" aria-label="Day">
      {DAYS.map(([key, label]) => {
        const training = isTraining(key)
        return (
          <button
            key={key}
            className={`tab${training ? '' : ' rest-day'}`}
            aria-pressed={day === key}
            onClick={() => onSelect(key)}
          >
            {label}
            <small>{key === today ? 'Today' : training ? 'Train' : 'Rest'}</small>
          </button>
        )
      })}
    </nav>
  )
}
