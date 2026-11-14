import { useEffect, useState } from 'react'

/** Current time in ms, refreshed on an interval. Only the component that calls it re-renders. */
export function useNow(intervalMs = 250) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
