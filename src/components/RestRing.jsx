import { useEffect } from 'react'
import { useNow } from '../hooks/useNow.js'
import { beep } from '../lib/audio.js'
import { fmt } from '../lib/session.js'

const CIRCUMFERENCE = 565.5 // 2 * PI * r, with r = 90

export default function RestRing({ endAt, total }) {
  const now = useNow(250)
  const remainingMs = Math.max(0, endAt - now)
  const remaining = Math.ceil(remainingMs / 1000)

  // Short tick for each of the last three seconds.
  useEffect(() => {
    if (remaining >= 1 && remaining <= 3) beep(660, 0.09, 0, 0.18)
  }, [remaining])

  return (
    <div className="ringbox">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <circle className="track" cx="100" cy="100" r="90" fill="none" strokeWidth="12" />
        <circle
          className="bar"
          cx="100"
          cy="100"
          r="90"
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - remainingMs / 1000 / total)}
        />
      </svg>
      <div className="ringtxt">
        <div>
          <b role="timer">{fmt(remaining)}</b>
          <br />
          <span>of {fmt(total)}</span>
        </div>
      </div>
    </div>
  )
}
