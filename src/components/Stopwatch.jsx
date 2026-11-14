import { useNow } from '../hooks/useNow.js'
import { fmt } from '../lib/session.js'

export default function Stopwatch({ startAt }) {
  const now = useNow(250)
  return (
    <div className="sw">
      <b role="timer">{fmt((now - startAt) / 1000)}</b>
      <span>elapsed</span>
    </div>
  )
}
